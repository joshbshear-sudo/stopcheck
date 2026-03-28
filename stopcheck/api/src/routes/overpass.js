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

    // Sample every ~100m along the course to build the query
    const sampled = sampleCoordinates(coordinates, 100);

    // Build Overpass query per spec section 4.4
    const latLonList = sampled.map(c => `${c.lat},${c.lon}`).join(',');
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node[highway=stop](around:30,${latLonList});
        node[highway=give_way](around:30,${latLonList});
      );
      out body;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      }
    );

    const stopSigns = (response.data.elements || []).map((node, idx) => ({
      osm_id: node.id,
      lat: node.lat,
      lon: node.lon,
      type: node.tags?.highway || 'stop',
      sequence: idx + 1,
    }));

    res.json({ stop_signs: stopSigns, count: stopSigns.length });
  } catch (err) {
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Overpass API rate limited. Try again shortly.' });
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
