const express = require("express");

const router = express.Router();

const Report = require("../models/Report");

router.post("/", async (req, res) => {
  try {
    // Agregar geocoding para obtener dirección a partir de coordenadas
    const coordinates = req.body.report_location.coordinates;
    const lng = coordinates[0];
    const lat = coordinates[1];

    const geocodeResponse =
      await fetch(
        `http://localhost:3000/map/resolve-address?lat=${lat}&lng=${lng}`
      );

    const geocodeData =await geocodeResponse.json();

    if (geocodeData.success) {
      req.body.report_location.address = geocodeData.address;
    }

    // validar que el req tenga la estructura correcta
    const report = new Report(req.body);

    const savedReport = await report.save();

    res.status(201).json({
      success: true,
      report: savedReport,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error creating report",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    res.json(report);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching report",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const reports = await Report.find();

    res.json(reports);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching reports",
    });
  }
});

router.get("/near/:id", async (req, res) => {

  try {

    const reportId = req.params.id;

    // Buscar reporte base
    const baseReport = await Report.findById(reportId);

    if (!baseReport) {

      return res.status(404).json({
        message: "Report not found",
      });
    }

    const coordinates =
      baseReport.report_location.coordinates;

    // Buscar cercanos
    const nearbyReports = await Report.find({

      report_location: {

        $near: {

          $geometry: {
            type: "Point",
            coordinates,
          },

          $maxDistance: 10000,
        },
      },
    });

    // Devolver reportes completos
    res.json(nearbyReports);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching nearby reports",
    });
  }
});

module.exports = router;
