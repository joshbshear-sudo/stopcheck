const express = require('express');
const axios = require('axios');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const USER_AGENT = 'StopCheck/1.0 (stopcheck.io; gravel cycling event compliance)';

// POST /api/overpass/detect-stops
router.post('/detect-stops', authenticateJWT, async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({ error: 'coordinates array is required' });
    }

    // Sample every ~100m along the course
    const sampled = sampleCoordinates(coordinates, 100);

    // Log bbox for debugging
    const lats = sampled.map(c => c.lat);
    const lons = sampled.map(c => c.lon);
    const bbox = {
      minLat: Math.min(...lats).toFixed(4),
      maxLat: Math.max(...lats).toFixed(4),
      minLon: Math.min(...lons).toFixed(4),
      maxLon: Math.max(...lons).toFixed(4),
    };
    console.log(`[OVERPASS] ${coordinates.length} input -> ${sampled.length} sampled | bbox: ${bbox.minLat},${bbox.minLon} to ${bbox.maxLat},${bbox.maxLon}`);

    // Split into chunks of 50 points
    const CHUNK_SIZE = 50;
    const allStopSigns = [];
    const seenIds = new Set();

    for (let i = 0; i < sampled.length; i += CHUNK_SIZE) {
      const chunk = sampled.slice(i, i + CHUNK_SIZE);
      const latLonList = chunk.map(c => `${c.lat},${c.lon}`).join(',');

      const overpassQuery = `
        [out:json][timeout:25];
        (
          node[highway=stop](around:30,${latLonList});
          node[highway=give_way](around:30,${latLonList});
        );
        out body;
      `;

      const nodes = await queryOverpassWithFallback(overpassQuery, i, i + CHUNK_SIZE);
      for (const node of nodes) {
        if (!seenIds.has(node.id)) {
          seenIds.add(node.id);
          allStopSigns.push({
            osm_id: node.id,
            lat: node.lat,
            lon: node.lon,
            type: node.tags?.highway || 'stop',
          });
        }
      }

      // Delay between chunks to respect rate limits
      if (i + CHUNK_SIZE < sampled.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    allStopSigns.forEach((stop, idx) => { stop.sequence = idx + 1; });
    console.log(`[OVERPASS] Found ${allStopSigns.length} stop signs`);
    res.json({ stop_signs: allStopSigns, count: allStopSigns.length });
  } catch (err) {
    console.error('[OVERPASS] Error:', err.message);
    res.status(500).json({ error: 'Failed to detect stop signs. Try again or add stops manually.' });
  }
});

async function queryOverpassWithFallback(query, chunkStart, chunkEnd) {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`[OVERPASS] Trying ${mirror} (chunk ${chunkStart}-${chunkEnd})`);
      const response = await axios.post(
        mirror,
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
          },
          timeout: 30000,
        }
      );
      return response.data.elements || [];
    } catch (err) {
      const status = err.response?.status || 'no response';
      const body = typeof err.response?.data === 'string'
        ? err.response.data.slice(0, 200)
        : JSON.stringify(err.response?.data || '').slice(0, 200);
      console.error(`[OVERPASS] ${mirror} failed (${status}): ${body || err.message}`);
      // Try next mirror
    }
  }
  console.error(`[OVERPASS] All mirrors failed for chunk ${chunkStart}-${chunkEnd}`);
  return [];
}

function sampleCoordinates(coords, intervalMeters) {
  if (coords.length <= 1) return coords;
  const sampled = [coords[0]];
  let accumulated = 0;
  for (let i = 1; i < coords.length; i++) {
    const dist = haversineSimple(
      coords[i - 1].lat, coords[i - 1].lon,
      coords[i].lat, coords[i].lon
    );
    accumulated += dist;
    if (accumulated >= intervalMeters) {
      sampled.push(coords[i]);
      accumulated = 0;
    }
  }
  return sampled;
}

function haversineSimple(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
