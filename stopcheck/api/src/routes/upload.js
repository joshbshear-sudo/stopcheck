const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../config/database');
const { uploadFile } = require('../services/s3');
const { createQueue } = require('../config/redis');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.fit' || ext === '.gpx') {
      cb(null, true);
    } else {
      cb(new Error('Only .fit and .gpx files are allowed'));
    }
  },
});

// POST /api/upload/fit/:authToken — rider uploads FIT file directly
// No JWT required — auth via rider URL token
router.post('/fit/:authToken', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const riderResult = await query(
      'SELECT id, event_id FROM riders WHERE auth_token = $1',
      [req.params.authToken]
    );
    if (riderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const rider = riderResult.rows[0];

    // Dedup check: same event already processed
    const existing = await query(
      'SELECT id FROM rider_summaries WHERE rider_id = $1 AND event_id = $2',
      [rider.id, rider.event_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Activity already processed for this event' });
    }

    // Upload to S3
    const s3Key = `fit-files/${rider.event_id}/${rider.id}/${Date.now()}.fit`;
    await uploadFile(s3Key, req.file.buffer, 'application/octet-stream');

    // Mark rider as connected via upload
    await query(
      `UPDATE riders SET connected_at = now(), platform = 'upload' WHERE id = $1`,
      [rider.id]
    );

    // Queue processing job
    const fitQueue = createQueue('process_fit');
    await fitQueue.add('process_fit', {
      rider_id: rider.id,
      event_id: rider.event_id,
      fit_file_path: s3Key,
    });

    res.status(202).json({
      message: 'FIT file uploaded and queued for processing',
      rider_id: rider.id,
    });
  } catch (err) {
    if (err.message === 'Only .fit and .gpx files are allowed') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/upload/course/:eventId — organizer uploads course file
const { authenticateJWT } = require('../middleware/auth');

router.post('/course/:eventId', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const eventCheck = await query(
      'SELECT id FROM events WHERE id = $1 AND org_id = $2',
      [req.params.eventId, req.org.id]
    );
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const s3Key = `course-files/${req.params.eventId}/course${ext}`;
    await uploadFile(s3Key, req.file.buffer, 'application/octet-stream');

    await query(
      'UPDATE events SET course_file_url = $1 WHERE id = $2',
      [s3Key, req.params.eventId]
    );

    res.status(201).json({ course_file_url: s3Key });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
