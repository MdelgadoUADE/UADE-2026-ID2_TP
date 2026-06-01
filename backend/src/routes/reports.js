const express = require("express");

const router = express.Router();

const Report = require("../models/Report");

// =========================
// POST /reports — Crear reporte
// =========================
router.post("/", async (req, res) => {
  try {
    const coordinates = req.body.report_location.coordinates;
    const lng = coordinates[0];
    const lat = coordinates[1];

    const geocodeResponse = await fetch(
      `http://localhost:3000/map/resolve-address?lat=${lat}&lng=${lng}`
    );

    const geocodeData = await geocodeResponse.json();

    if (geocodeData.success) {
      req.body.report_location.address = geocodeData.address;
    }

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

// =========================
// GET /reports/admin/stats — Agregaciones para gráficos de Cat. 1
// Devuelve: por_status, por_criticidad, por_validez, anonimos, trust_score_ranges
// =========================
router.get("/admin/stats", async (req, res) => {
  try {
    const [result] = await Report.aggregate([
      {
        $facet: {
          // Embudo de estados
          por_status: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // Distribución por criticidad
          por_criticidad: [
            { $group: { _id: { $ifNull: ["$criticidad", "sin_clasificar"] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // Distribución por validez
          por_validez: [
            { $group: { _id: { $ifNull: ["$validez", "pendiente"] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // Anónimo vs autenticado
          anonimos: [
            { $group: { _id: "$is_anonymous", count: { $sum: 1 } } },
          ],

          // Rangos de trust_score
          trust_score_ranges: [
            {
              $bucket: {
                groupBy: "$trust_score",
                boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.01],
                default: "sin_score",
                output: { count: { $sum: 1 } },
              },
            },
          ],

          // Total general
          totales: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pendientes: { $sum: { $cond: [{ $in: ["$status", ["active", "en_verificacion"]] }, 1, 0] } },
                resueltos:  { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
                trust_promedio: { $avg: "$trust_score" },
              },
            },
          ],
        },
      },
    ]);

    res.json({ success: true, stats: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
});

// =========================
// GET /reports/admin — Cola de reportes para el dashboard
// Filtros: status, is_anonymous, tag_key, tag_value, sort (reciente|antiguo)
// RF_23: incluye agrupación de relacionados
// =========================
router.get("/admin", async (req, res) => {
  try {
    const {
      status,
      is_anonymous,
      tag_key,
      tag_value,
      criticidad,
      validez,
      sort = "reciente",
    } = req.query;

    const filter = {};

    if (status) filter.status = status;

    if (is_anonymous !== undefined && is_anonymous !== "") {
      filter.is_anonymous = is_anonymous === "true";
    }

    if (criticidad) filter.criticidad = criticidad;

    if (validez) filter.validez = validez;

    // Filtro por tag key/value: tags es Mixed, usamos dot notation
    if (tag_key && tag_value) {
      filter[`tags.${tag_key}`] = tag_value;
    } else if (tag_key) {
      // Solo filtrar por existencia de la key
      filter[`tags.${tag_key}`] = { $exists: true };
    }

    const sortOrder = sort === "antiguo" ? 1 : -1;

    const reports = await Report.find(filter)
      .sort({ timestamp: sortOrder })
      .lean();

    // RF_23: agrupar reportes relacionados
    // Un reporte es "líder del grupo" si ningún otro lo menciona en related_reports
    // y él mismo tiene related_reports con contenido
    const allIds = new Set(reports.map((r) => String(r._id)));
    const referencedIds = new Set(
      reports.flatMap((r) => (r.related_reports || []).map(String))
    );

    const groups = [];
    const processedIds = new Set();

    for (const report of reports) {
      const id = String(report._id);

      if (processedIds.has(id)) continue;

      const isGroupLeader =
        (report.related_reports || []).length > 0 &&
        !referencedIds.has(id);

      if (isGroupLeader) {
        const related = (report.related_reports || [])
          .map((relId) => reports.find((r) => String(r._id) === relId))
          .filter(Boolean);

        groups.push({
          leader: report,
          related,
          is_group: true,
        });

        processedIds.add(id);
        related.forEach((r) => processedIds.add(String(r._id)));
      } else if (!referencedIds.has(id)) {
        groups.push({
          leader: report,
          related: [],
          is_group: false,
        });
        processedIds.add(id);
      }
    }

    res.json({
      success: true,
      total: reports.length,
      groups,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin reports",
    });
  }
});

// =========================
// GET /reports/:id — Reporte por ID
// =========================
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching report" });
  }
});

// =========================
// GET /reports — Todos los reportes (uso público)
// =========================
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reports" });
  }
});

// =========================
// PATCH /reports/:id/status — RF_24: clasificar criticidad y validez
// Body: { status?, criticidad?, validez? }
// =========================
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, criticidad, validez } = req.body;

    const allowedStatus = ["active", "en_verificacion", "asignado", "resolved", "archived"];
    const allowedCriticidad = ["baja", "media", "alta", "critica", null];
    const allowedValidez = ["pendiente", "valido", "falso", "dudoso"];

    const update = {};

    if (status !== undefined) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Estado inválido" });
      }
      update.status = status;
    }

    if (criticidad !== undefined) {
      if (!allowedCriticidad.includes(criticidad)) {
        return res.status(400).json({ message: "Criticidad inválida" });
      }
      update.criticidad = criticidad;
    }

    if (validez !== undefined) {
      if (!allowedValidez.includes(validez)) {
        return res.status(400).json({ message: "Validez inválida" });
      }
      update.validez = validez;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nada para actualizar" });
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ success: true, report: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating report" });
  }
});

// =========================
// GET /reports/near/:id — Reportes cercanos
// =========================
router.get("/near/:id", async (req, res) => {
  try {
    const reportId = req.params.id;
    const baseReport = await Report.findById(reportId);

    if (!baseReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    const coordinates = baseReport.report_location.coordinates;

    const nearbyReports = await Report.find({
      report_location: {
        $near: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: 10000,
        },
      },
    });

    res.json(nearbyReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching nearby reports" });
  }
});

module.exports = router;
