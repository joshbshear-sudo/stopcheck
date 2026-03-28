const express = require('express');
const axios = require('axios');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/overpass/detect-stops
// Takes course coordinates, queries OSM Overpass for stop signs within 30m
router.post('/detect-stops', authenticateJWT, async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({ error: 'coordinates array is required' });
    }

    // Sample every ~100m along the course
    const sampled = sampleCoordinates(coordinates, 100);
    console.log(`[OVERPASS] ${coordinates.length} input coords, ${sampled.length} sampled`);

    // Split into chunks of 50 points to keep Overpass queries manageable
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

      try {
        const response = await axios.post(
          'https://overpass-api.de/api/interpreter',
          `data=${encodeURIComponent(overpassQuery)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000,
          }
        );

        for (const node of (response.data.elements || [])) {
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
      } catch (chunkErr) {
        console.error(`[OVERPASS] Chunk ${i}-${i + CHUNK_SIZE} failed:`, chunkErr.message);
        // Continue with other chunks
      }

      // Small delay between chunks to respect Overpass rate limits
      if (i + CHUNK_SIZE < sampled.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Sort by position along the course and assign sequence numbers
    allStopSigns.forEach((stop, idx) => { stop.sequence = idx + 1; });

    console.log(`[OVERPASS] Found ${allStopSigns.length} stop signs`);
    res.json({ stop_signs: allStopSigns, count: allStopSigns.length });
  } catch (err) {
    console.error('[OVERPASS] Error:', err.message);
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Overpass API rate limited. Try again in a minute.' });
    }
    res.status(500).json({ error: 'Failed to query Overpass API' });
  }
});

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
