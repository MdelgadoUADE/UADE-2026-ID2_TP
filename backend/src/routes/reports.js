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

router.get('/near/:id', async (req, res) => {

  try {
    const reportId = req.params.id;

    // 1. Buscar reporte base
    const baseReport = await Report.findById(reportId);

    if (!baseReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const coordinates = baseReport.report_location.coordinates;

    // 2. Buscar reportes cercanos (50km)
    const nearbyReports = await Report.find({
      report_location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates
          },
          $maxDistance: 50000 // 50km en metros
        }
      }
    });

    // 3. Mapear respuesta
    const result = nearbyReports.map(r => ({
      id: r._id,
      username: r.user?.username,
      coordinates: r.report_location.coordinates
    }));

    res.json(result);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error fetching nearby reports'
    });
  }
});

module.exports = router;