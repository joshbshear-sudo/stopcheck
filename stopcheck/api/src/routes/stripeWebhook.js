const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// POST /api/webhooks/stripe — Stripe webhook handler
// Uses raw body for signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  if (webhookSecret) {
    // Production: verify Stripe signature
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[STRIPE-WEBHOOK] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // TODO: Remove this path before production deployment.
    // Local testing only — no signature verification.
    console.warn('[STRIPE-WEBHOOK] No STRIPE_WEBHOOK_SECRET — skipping signature verification');
    try {
      const body = typeof req.body === 'string' ? req.body : req.body.toString();
      event = JSON.parse(body);
    } catch (err) {
      return res.status(400).send('Invalid payload');
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        // Unhandled event type — ignore silently
        break;
    }
  } catch (err) {
    console.error(`[STRIPE-WEBHOOK] Error handling ${event.type}:`, err.message);
  }

  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  const { org_id, event_id, tier, plan } = session.metadata || {};

  if (!org_id) {
    console.error('[STRIPE-WEBHOOK] checkout.session.completed missing org_id');
    return;
  }

  if (session.mode === 'payment' && event_id && tier) {
    // One-time payment: unlock the specific event
    await query('UPDATE events SET unlocked = true WHERE id = $1', [event_id]);
    console.log(`[STRIPE] Event ${event_id} unlocked (${tier})`);
  }

  if (session.mode === 'subscription' && plan) {
    // Subscription: update org plan
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await query(
      'UPDATE organizations SET plan = $1, plan_expires_at = $2 WHERE id = $3',
      [plan, expiresAt.toISOString(), org_id]
    );
    console.log(`[STRIPE] Org ${org_id} upgraded to ${plan}`);
  }
}

async function handleInvoicePaid(invoice) {
  // Renewal: extend plan_expires_at by 1 year
  const customerId = invoice.customer;
  if (!customerId) return;

  const orgResult = await query(
    'SELECT id, plan FROM organizations WHERE stripe_customer_id = $1',
    [customerId]
  );
  if (orgResult.rows.length === 0) return;

  const org = orgResult.rows[0];
  if (org.plan === 'free') return; // Not a subscriber

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await query(
    'UPDATE organizations SET plan_expires_at = $1 WHERE id = $2',
    [expiresAt.toISOString(), org.id]
  );
  console.log(`[STRIPE] Org ${org.id} subscription renewed`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  if (!customerId) return;

  await query(
    "UPDATE organizations SET plan = 'free', plan_expires_at = NULL WHERE stripe_customer_id = $1",
    [customerId]
  );
  console.log(`[STRIPE] Customer ${customerId} subscription cancelled, reverted to free`);
}

module.exports = router;
