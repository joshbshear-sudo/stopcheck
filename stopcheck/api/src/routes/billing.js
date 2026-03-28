const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Price IDs from Stripe dashboard (set in .env)
// Falls back to inline price_data if not set
const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  event_pass: process.env.STRIPE_PRICE_EVENT_PASS,
  season_pro: process.env.STRIPE_PRICE_SEASON_PRO,
  series: process.env.STRIPE_PRICE_SERIES,
};

const TIERS = {
  starter: { name: 'Starter', amount: 2900, mode: 'payment', maxRiders: 150 },
  event_pass: { name: 'Event Pass', amount: 4900, mode: 'payment', maxRiders: null },
  season_pro: { name: 'Season Pro', amount: 29900, mode: 'subscription', interval: 'year', maxRiders: null },
  series: { name: 'Series', amount: 79900, mode: 'subscription', interval: 'year', maxRiders: null },
};

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

async function ensureCustomer(stripe, orgId) {
  const orgResult = await query(
    'SELECT id, name, email, stripe_customer_id FROM organizations WHERE id = $1',
    [orgId]
  );
  const org = orgResult.rows[0];
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: org.email, name: org.name, metadata: { org_id: org.id },
  });
  await query('UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2', [customer.id, orgId]);
  return customer.id;
}

function buildLineItem(tier, tierConfig) {
  const priceId = PRICE_IDS[tier];
  if (priceId) {
    return { price: priceId, quantity: 1 };
  }
  // Fallback: inline price_data (works for testing without pre-created products)
  const item = {
    price_data: {
      currency: 'usd',
      product_data: {
        name: `StopCheck ${tierConfig.name}`,
        description: tier === 'starter' ? 'Up to 150 riders for one event'
          : tier === 'event_pass' ? 'Unlimited riders for one event'
          : tier === 'season_pro' ? 'Unlimited riders & events for one year'
          : 'Unlimited everything, priority support for one year',
      },
      unit_amount: tierConfig.amount,
    },
    quantity: 1,
  };
  if (tierConfig.mode === 'subscription') {
    item.price_data.recurring = { interval: tierConfig.interval };
  }
  return item;
}

// POST /api/billing/create-checkout-session — one-time payment for starter or event_pass
router.post('/create-checkout-session', authenticateJWT, async (req, res) => {
  try {
    const { tier, eventId } = req.body;
    const tierConfig = TIERS[tier];

    if (!tierConfig || tierConfig.mode !== 'payment') {
      return res.status(400).json({ error: 'Invalid tier. Use starter or event_pass.' });
    }

    const stripe = getStripe();
    const customerId = await ensureCustomer(stripe, req.org.id);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [buildLineItem(tier, tierConfig)],
      metadata: { org_id: req.org.id, event_id: eventId, tier },
      success_url: `${appUrl}/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/events/${eventId}?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/create-subscription — recurring for season_pro or series
router.post('/create-subscription', authenticateJWT, async (req, res) => {
  try {
    const { plan } = req.body;
    const tierConfig = TIERS[plan];

    if (!tierConfig || tierConfig.mode !== 'subscription') {
      return res.status(400).json({ error: 'Invalid plan. Use season_pro or series.' });
    }

    const stripe = getStripe();
    const customerId = await ensureCustomer(stripe, req.org.id);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [buildLineItem(plan, tierConfig)],
      metadata: { org_id: req.org.id, plan },
      success_url: `${appUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Subscription error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/portal — Stripe customer portal
router.get('/portal', authenticateJWT, async (req, res) => {
  try {
    const orgResult = await query(
      'SELECT stripe_customer_id FROM organizations WHERE id = $1', [req.org.id]
    );
    if (!orgResult.rows[0]?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }
    const stripe = getStripe();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: orgResult.rows[0].stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/fulfill — manual fulfillment after successful checkout
// Called from the success_url redirect (client-side) to unlock the event
// This is the local-testing path; in production the webhook handles this
router.post('/fulfill', authenticateJWT, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const { org_id, event_id, tier, plan } = session.metadata || {};

    // Verify the org making the request matches the session
    if (org_id !== req.org.id) {
      return res.status(403).json({ error: 'Org mismatch' });
    }

    if (session.mode === 'payment' && event_id) {
      await query('UPDATE events SET unlocked = true WHERE id = $1', [event_id]);
      res.json({ unlocked: true, event_id });
    } else if (session.mode === 'subscription' && plan) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await query(
        'UPDATE organizations SET plan = $1, plan_expires_at = $2 WHERE id = $3',
        [plan, expiresAt.toISOString(), org_id]
      );
      res.json({ plan, expires_at: expiresAt });
    } else {
      res.json({ message: 'Nothing to fulfill' });
    }
  } catch (err) {
    console.error('Fulfill error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/status
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    const orgResult = await query(
      'SELECT plan, plan_expires_at, sponsored, sponsor_charity_name FROM organizations WHERE id = $1',
      [req.org.id]
    );
    const org = orgResult.rows[0];

    if (org.plan_expires_at && new Date(org.plan_expires_at) < new Date()) {
      await query("UPDATE organizations SET plan = 'free', plan_expires_at = NULL WHERE id = $1", [req.org.id]);
      org.plan = 'free';
      org.plan_expires_at = null;
    }

    res.json({
      plan: org.sponsored ? 'sponsored' : org.plan,
      plan_expires_at: org.plan_expires_at,
      sponsored: org.sponsored,
      sponsor_charity_name: org.sponsor_charity_name,
      tiers: TIERS,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

module.exports = router;
