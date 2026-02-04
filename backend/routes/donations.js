const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { uploadBuffer } = require('../utils/minio');

// Get all orphans
router.get('/orphans', async (req, res) => {
  try {
    console.log('[v0] Fetching all orphans');
    const result = await pool.query('SELECT * FROM orphans ORDER BY name ASC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching orphans:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching orphans',
      error: err.message
    });
  }
});

// Get single orphan
router.get('/orphans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orphans WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orphan not found'
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error fetching orphan:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching orphan',
      error: err.message
    });
  }
});

// Get all old-age homes
router.get('/old-age-homes', async (req, res) => {
  try {
    console.log('[v0] Fetching all old-age homes');
    const result = await pool.query('SELECT * FROM old_age_homes ORDER BY name ASC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching old-age homes:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching old-age homes',
      error: err.message
    });
  }
});

// Get single old-age home
router.get('/old-age-homes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM old_age_homes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Old-age home not found'
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error fetching old-age home:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching old-age home',
      error: err.message
    });
  }
});

// Create donation
router.post('/donate', async (req, res) => {
  try {
    const { type, item_id, item_name, amount, name, email, phone } = req.body;

    // Validate inputs
    if (!type || !item_id || !item_name || !amount || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!['orphan', 'old-age'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation type'
      });
    }

    console.log('[v0] Creating donation:', { type, item_name, amount, name, email });

    // Insert donation record
    const query = `
      INSERT INTO donations (id, type, item_id, item_name, amount, name, email, phone, created_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      type,
      item_id,
      item_name,
      amount,
      name,
      email,
      phone || null
    ]);

    console.log('[v0] Donation created successfully');

    res.json({
      success: true,
      message: 'Donation recorded successfully',
      donation: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error creating donation:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing donation',
      error: err.message
    });
  }
});

// Upload donation screenshot
router.post('/donate/upload-screenshot', async (req, res) => {
  try {
    const { donation_id } = req.body;
    const screenshot = req.files?.screenshot;

    if (!donation_id || !screenshot) {
      return res.status(400).json({
        success: false,
        message: 'Missing donation ID or screenshot'
      });
    }

    console.log('[v0] Uploading donation screenshot for donation:', donation_id);

    // Upload to MinIO
    const uploadResult = await uploadBuffer(
      screenshot.data,
      `donation-${donation_id}-${Date.now()}.${screenshot.name.split('.').pop()}`,
      screenshot.mimetype
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload screenshot',
        error: uploadResult.error
      });
    }

    // Update donation with screenshot URL
    const updateQuery = `
      UPDATE donations 
      SET screenshot_url = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [uploadResult.url, donation_id]);

    res.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      donation: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error uploading screenshot:', err);
    res.status(500).json({
      success: false,
      message: 'Error uploading screenshot',
      error: err.message
    });
  }
});

// Get donations statistics
router.get('/donations/stats/:type', async (req, res) => {
  try {
    const { type } = req.params;

    if (!['orphan', 'old-age'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type'
      });
    }

    // Get total donations
    const totalQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(CAST(amount AS DECIMAL)) as total,
        AVG(CAST(amount AS DECIMAL)) as average
      FROM donations
      WHERE type = $1
    `;

    const totalResult = await pool.query(totalQuery, [type]);

    // Get donations by item
    const itemsQuery = `
      SELECT 
        item_name,
        COUNT(*) as count,
        SUM(CAST(amount AS DECIMAL)) as total
      FROM donations
      WHERE type = $1
      GROUP BY item_name
      ORDER BY total DESC
    `;

    const itemsResult = await pool.query(itemsQuery, [type]);

    res.json({
      success: true,
      stats: {
        total: totalResult.rows[0],
        byItem: itemsResult.rows
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching donation stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation statistics',
      error: err.message
    });
  }
});

// Get all donations (admin)
router.get('/donations', async (req, res) => {
  try {
    const { type, from_date, to_date, limit = 100 } = req.query;

    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (from_date) {
      query += ' AND created_at >= $' + (params.length + 1);
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND created_at <= $' + (params.length + 1);
      params.push(to_date);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit}`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching donations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: err.message
    });
  }
});

module.exports = router;
