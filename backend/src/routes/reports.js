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

router.get('/:id', async (req, res) => {

  try {

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }

    res.json(report);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error fetching report'
    });
  }
});

router.get('/', async (req, res) => {

  try {

    const reports = await Report.find();

    res.json(reports);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error fetching reports'
    });
  }
});

module.exports = router;