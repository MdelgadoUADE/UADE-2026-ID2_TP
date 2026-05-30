const express = require("express");

const router = express.Router();

const Report = require("../models/Report");
const { calculateTrustScore } = require("../utils/trustScore");

router.post("/", async (req, res) => {
  try {
    // Validar que exista ubicación
    if (!req.body.report_location || !req.body.report_location.coordinates) {
      return res.status(400).json({
        success: false,
        message: "report_location is required"
      });
    }

    // Validar que haya al menos notas o tags
    if (!req.body.notes && (!req.body.tags || Object.keys(req.body.tags).length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Report must have either notes or tags"
      });
    }

    // Agregar geocoding para obtener dirección a partir de coordenadas
    const coordinates = req.body.report_location.coordinates;
    const lng = coordinates[0];
    const lat = coordinates[1];

    const geocodeResponse =
      await fetch(
        `http://localhost:3000/map/resolve-address?lat=${lat}&lng=${lng}`
      );

    const geocodeData = await geocodeResponse.json();

    if (geocodeData.success) {
      req.body.report_location.address = geocodeData.address;
    }

    // Manejar reportes anónimos (modo emergencia)
    if (req.body.is_anonymous || !req.body.user) {
      req.body.is_anonymous = true;
      req.body.user = {
        user_id: `anon_${Date.now()}`,
        username: 'anonymous',
        surname: 'user',
        email: 'anonymous@reportit.com'
      };
    }

    // Calcular trust score automáticamente
    const trustScore = calculateTrustScore(req.body);
    req.body.trust_score = trustScore;

    // Crear reporte
    const report = new Report(req.body);

    const savedReport = await report.save();

    console.log(`Report created with trust score: ${trustScore.toFixed(2)}`);

    res.status(201).json({
      success: true,
      report: savedReport,
    });
  } catch (error) {
    console.error('Error creating report:', error);

    res.status(500).json({
      success: false,
      message: "Error creating report",
      error: error.message
    });
  }
});

/**
 * Búsqueda avanzada combinada por ubicación y tags (RF_13)
 * GET /reports/search?lat=X&lng=Y&radius=1000&tags=tag1,tag2&status=active
 */
router.get("/search", async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 1000, // Radio en metros (default 1km)
      tags,
      status,
      minTrustScore,
      validity,
      criticality
    } = req.query;

    // Validar parámetros requeridos
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required"
      });
    }

    // Validar radio (min 100m, max 10km)
    const radiusNum = parseInt(radius);
    if (radiusNum < 100 || radiusNum > 10000) {
      return res.status(400).json({
        success: false,
        message: "radius must be between 100 and 10000 meters"
      });
    }

    // Construir query base con búsqueda geoespacial
    const query = {
      report_location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            radiusNum / 6378100 // Convertir metros a radianes
          ]
        }
      }
    };

    // Filtrar por status
    if (status) {
      query.status = status;
    }

    // Filtrar por tags
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      // Buscar reportes que tengan al menos uno de los tags
      const tagConditions = tagArray.map(tag => ({
        [`tags.${tag}`]: { $exists: true }
      }));
      query.$or = tagConditions;
    }

    // Filtrar por trust score mínimo
    if (minTrustScore) {
      query.trust_score = { $gte: parseFloat(minTrustScore) };
    }

    // Filtrar por validity
    if (validity) {
      query.validity = validity;
    }

    // Filtrar por criticality
    if (criticality) {
      query.criticality = criticality;
    }

    // Ejecutar búsqueda
    const reports = await Report.find(query)
      .sort({ timestamp: -1 })
      .limit(100); // Limitar resultados

    res.json({
      success: true,
      count: reports.length,
      radius: radiusNum,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) },
      reports
    });

  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({
      success: false,
      message: "Error searching reports",
      error: error.message
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

module.exports = router;
