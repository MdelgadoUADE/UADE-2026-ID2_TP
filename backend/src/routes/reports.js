const express = require('express');

const router = express.Router();

const Report = require('../models/Report');

router.post('/', async (req, res) => {
  try {
    const report = new Report(req.body);

    const savedReport = await report.save();

    res.status(201).json(savedReport);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error creating report'
    });
  }
});

module.exports = router;