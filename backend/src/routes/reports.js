const express = require("express");

const router = express.Router();

const Report = require("../models/Report");
const { calculateTrustScore } = require("../utils/trustScore");

// =========================
// GET /reports/search — Búsqueda pública con filtros y paginación
// Query params: status (default: 'active'), limit (default: 100), skip (default: 0)
//               tag_key, tag_value, sort (reciente|antiguo), trust_score_min, trust_score_max
// =========================
router.get("/search", async (req, res) => {
  try {
    const {
      status = "active",
      limit  = "100",
      skip   = "0",
      tag_key,
      tag_value,
      trust_score_min,
      trust_score_max,
      sort = "reciente",
      q = "", // Parámetro de búsqueda de texto
    } = req.query;

    const filter = {};

    if (status) filter.status = status;

    if (tag_key && tag_value) {
      filter[`tags.${tag_key}`] = tag_value;
    } else if (tag_key) {
      filter[`tags.${tag_key}`] = { $exists: true };
    }

    // Filtro por trust score range
    if (trust_score_min !== undefined || trust_score_max !== undefined) {
      filter.trust_score = {};
      if (trust_score_min !== undefined) {
        filter.trust_score.$gte = parseFloat(trust_score_min);
      }
      if (trust_score_max !== undefined) {
        filter.trust_score.$lte = parseFloat(trust_score_max);
      }
    }

    // Búsqueda de texto en múltiples campos
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { 'user.username': searchRegex },
        { 'user.email': searchRegex },
        { 'notes': searchRegex },
        { 'report_location.address': searchRegex },
        { '_id': q.trim().match(/^[0-9a-fA-F]{24}$/) ? q.trim() : null }, // Búsqueda exacta por ID si es válido
      ].filter(condition => {
        // Filtrar condiciones nulas (como cuando el ID no es válido)
        return condition._id !== null || !condition._id;
      });
    }

    const sortOrder = sort === "antiguo" ? 1 : -1;
    const limitNum  = Math.min(parseInt(limit, 10) || 100, 500); // cap en 500
    const skipNum   = parseInt(skip, 10) || 0;

    const [reports, totalCount] = await Promise.all([
      Report.find(filter)
        .sort({ timestamp: sortOrder })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total:   totalCount,
      count:   reports.length,
      skip:    skipNum,
      limit:   limitNum,
      reports,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching reports" });
  }
});

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

    // Calcular trust score automáticamente
    try {
      console.log('[TRUST SCORE] Iniciando cálculo para reporte:', savedReport._id);
      const { score, metadata } = await calculateTrustScore(savedReport);
      console.log('[TRUST SCORE] Calculado exitosamente:', score);
      savedReport.trust_score = score;
      savedReport.trust_score_metadata = metadata;
      await savedReport.save();
      console.log('[TRUST SCORE] Guardado en DB');
    } catch (trustScoreError) {
      console.error('[TRUST SCORE] ❌ Error calculating trust score:', trustScoreError);
      console.error('[TRUST SCORE] Stack trace:', trustScoreError.stack);
      // No fallar la creación del reporte si falla el trust score
    }

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
// Filtros: status, is_anonymous, tag_key, tag_value, sort (reciente|antiguo), trust_score_min, trust_score_max
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
      trust_score_min,
      trust_score_max,
      limit = "100",
      skip  = "0",
      sort = "reciente",
    } = req.query;

    const filter = {};

    // "active" por defecto si no se pasa nada; "" vacío = sin filtro (todos)
    const statusValue = status === undefined ? "active" : status;
    if (statusValue) filter.status = statusValue;

    if (is_anonymous !== undefined && is_anonymous !== "") {
      filter.is_anonymous = is_anonymous === "true";
    }

    if (criticidad) filter.criticidad = criticidad;

    if (validez) filter.validez = validez;

    // Filtro por trust score range
    if (trust_score_min !== undefined || trust_score_max !== undefined) {
      filter.trust_score = {};
      if (trust_score_min !== undefined) {
        filter.trust_score.$gte = parseFloat(trust_score_min);
      }
      if (trust_score_max !== undefined) {
        filter.trust_score.$lte = parseFloat(trust_score_max);
      }
    }

    // Filtro por tag key/value: tags es Mixed, usamos dot notation
    if (tag_key && tag_value) {
      filter[`tags.${tag_key}`] = tag_value;
    } else if (tag_key) {
      // Solo filtrar por existencia de la key
      filter[`tags.${tag_key}`] = { $exists: true };
    }

    const sortOrder = sort === "antiguo" ? 1 : -1; 
    const limitNum = Math.min(parseInt(limit, 10) || 100, 500);
    const skipNum  = parseInt(skip, 10) || 0;

    const [reports, totalCount] = await Promise.all([
      Report.find(filter)
        .sort({ timestamp: sortOrder })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(filter),
    ]);

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
      total: totalCount,        // total real en DB con esos filtros
      count: reports.length,    // cuántos vinieron en esta página
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
// GET /reports/admin/geo-stats — Categoría 2: Geo-Análisis
// Query params:
//   criticidad  : '' | 'baja' | 'media' | 'alta' | 'critica'
//   horasAtras  : número (default 48, 0 = sin límite)
//   minReportes : número (default 1, filtra zonas con menos reportes en el bar chart)
//   validez     : '' | 'valido' | 'dudoso' | 'falso' | 'pendiente'
// =========================
router.get("/admin/geo-stats", async (req, res) => {
  try {
    const {
      criticidad,
      horasAtras = 48,
      minReportes = 1,
      validez,
    } = req.query;

    // ── Construir filtro base ──────────────────────────────────────────────
    const filter = {};

    if (criticidad) filter.criticidad = criticidad;
    if (validez)    filter.validez    = validez;

    const horas = parseInt(horasAtras, 10);
    if (!isNaN(horas) && horas > 0) {
      filter.timestamp = { $gte: new Date(Date.now() - horas * 60 * 60 * 1000) };
    }

    // ── Puntos para el heatmap ────────────────────────────────────────────
    const reports = await Report.find(filter)
      .select("report_location criticidad")
      .lean();

    const CRITICIDAD_WEIGHT = { critica: 1.0, alta: 0.75, media: 0.45, baja: 0.2 };
    const heatPoints = reports
      .filter(r => r.report_location?.coordinates?.length === 2)
      .map(r => ({
        lat:    r.report_location.coordinates[1],
        lng:    r.report_location.coordinates[0],
        weight: CRITICIDAD_WEIGHT[r.criticidad] ?? 0.3,
      }));

    // ── Agregación por zona (segundo segmento del address de Nominatim) ───
    const [zoneResult] = await Report.aggregate([
      { $match: filter },
      {
        $addFields: {
          zona_raw: {
            $trim: {
              input: {
                $arrayElemAt: [
                  { $split: ["$report_location.address", ","] },
                  1,
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          zona: {
            $cond: {
              if:   { $or: [{ $eq: ["$zona_raw", null] }, { $eq: ["$zona_raw", ""] }] },
              then: "Sin zona",
              else: "$zona_raw",
            },
          },
        },
      },
      {
        $facet: {
          por_zona: [
            {
              $group: {
                _id:         "$zona",
                count:       { $sum: 1 },
                criticidades: { $push: "$criticidad" },
              },
            },
            { $sort:  { count: -1 } },
            { $limit: 10 },
          ],
          totales: [
            {
              $group: {
                _id:      null,
                total:    { $sum: 1 },
                criticos: {
                  $sum: { $cond: [{ $in: ["$criticidad", ["alta", "critica"]] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const minRep  = parseInt(minReportes, 10) || 1;
    const porZona = (zoneResult?.por_zona ?? []).filter(z => z.count >= minRep);

    res.json({
      success:    true,
      heatPoints,
      porZona,
      totales:    zoneResult?.totales?.[0] ?? { total: 0, criticos: 0 },
      filtros:    { criticidad, horasAtras: horas, minReportes: minRep, validez },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching geo stats" });
  }
});

// =========================
// GET /reports/admin/temporal-stats — Categoría 3: Análisis Temporal
// Ayuda a entender "cuándo" ocurren los incidentes (tendencias y horarios)
// para habilitar la Estrategia 3 (Cobertura preventiva focalizada).
//
// Query params:
//   granularidad : 'dia' | 'semana' | 'mes'   (default: 'dia')
//   diasAtras    : número, 0 = sin límite      (default: 30)
//   criticidad   : '' | 'baja' | 'media' | 'alta' | 'critica'
//   validez      : '' | 'valido' | 'dudoso' | 'falso' | 'pendiente'
//
// Devuelve:
//   tendencia          : [{ _id: 'YYYY-MM-DD' | 'YYYY-Www' | 'YYYY-MM', count }]
//   matriz_dia_hora    : [{ dia: 1-7 (Mongo: 1=Domingo), franja: 'madrugada'|'manana'|'tarde'|'noche', count }]
//   totales            : { total, promedio_diario }
// =========================
router.get("/admin/temporal-stats", async (req, res) => {
  try {
    const {
      granularidad = "dia",
      diasAtras = 30,
      criticidad,
      validez,
    } = req.query;

    // ── Filtro base ──────────────────────────────────────────────────────
    const filter = {};
    if (criticidad) filter.criticidad = criticidad;
    if (validez) filter.validez = validez;

    const dias = parseInt(diasAtras, 10);
    if (!isNaN(dias) && dias > 0) {
      filter.timestamp = { $gte: new Date(Date.now() - dias * 24 * 60 * 60 * 1000) };
    }

    // ── Formato de fecha según granularidad (para $dateToString) ────────
    const DATE_FORMATS = {
      dia: "%Y-%m-%d",
      semana: "%G-W%V", // año ISO + semana ISO
      mes: "%Y-%m",
    };
    const dateFormat = DATE_FORMATS[granularidad] ?? DATE_FORMATS.dia;

    const [result] = await Report.aggregate([
      { $match: filter },
      {
        $facet: {
          // ── Tendencia temporal (línea) ──────────────────────────────
          tendencia: [
            {
              $group: {
                _id: {
                  $dateToString: { format: dateFormat, date: "$timestamp", timezone: "America/Argentina/Buenos_Aires" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],

          // ── Matriz día de semana × franja horaria (heatmap) ─────────
          // dayOfWeek: 1=Domingo ... 7=Sábado (estándar Mongo)
          matriz_dia_hora: [
            {
              $addFields: {
                dia_semana: { $dayOfWeek: { date: "$timestamp", timezone: "America/Argentina/Buenos_Aires" } },
                hora_local: { $hour: { date: "$timestamp", timezone: "America/Argentina/Buenos_Aires" } },
              },
            },
            {
              $addFields: {
                franja: {
                  $switch: {
                    branches: [
                      { case: { $and: [{ $gte: ["$hora_local", 0] }, { $lt: ["$hora_local", 6] }] }, then: "madrugada" },
                      { case: { $and: [{ $gte: ["$hora_local", 6] }, { $lt: ["$hora_local", 12] }] }, then: "manana" },
                      { case: { $and: [{ $gte: ["$hora_local", 12] }, { $lt: ["$hora_local", 19] }] }, then: "tarde" },
                    ],
                    default: "noche", // 19hs - 23hs
                  },
                },
              },
            },
            {
              $group: {
                _id: { dia: "$dia_semana", franja: "$franja" },
                count: { $sum: 1 },
              },
            },
          ],

          // ── Totales generales ────────────────────────────────────────
          totales: [
            { $group: { _id: null, total: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const total = result?.totales?.[0]?.total ?? 0;
    const diasRango = !isNaN(dias) && dias > 0 ? dias : null;

    res.json({
      success: true,
      tendencia: result?.tendencia ?? [],
      matriz_dia_hora: result?.matriz_dia_hora ?? [],
      totales: {
        total,
        promedio_diario: diasRango ? Math.round((total / diasRango) * 10) / 10 : null,
      },
      filtros: { granularidad, diasAtras: dias, criticidad, validez },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching temporal stats" });
  }
});

// =========================
// GET /reports/admin/user-stats — Categoría 4: Calidad y Confianza
// Métricas de comportamiento de los usuarios que reportan: volumen, validez
// de sus reportes y trust score, para detectar posibles cuentas maliciosas
// o usuarios especialmente confiables.
//
// Cruza datos de dos fuentes:
//   - MongoDB (reports): conteos por user.user_id (válidos, falsos, etc.)
//   - PostgreSQL (users): username, surname, email, role — fuente de verdad
//     de identidad/rol. Permite además detectar usuarios sin reportes aún.
//
// Query params:
//   minReportes : número, mínimo de reportes para aparecer en el ranking (default 1)
//   rol         : '' | 'user' | 'admin' | etc. (filtra por users.role)
//   sort        : campo de orden (default 'total_reportes') — uno de:
//                 total_reportes | validos | falsos | tasa_falsos | trust_score_promedio
//   dir         : 'asc' | 'desc' (default 'desc')
//   limit       : tamaño de página (default 25, máx 200)
//   skip        : offset (default 0)
// =========================
router.get("/admin/user-stats", async (req, res) => {
  try {
    const {
      minReportes = 1,
      rol,
      sort = "total_reportes",
      dir = "desc",
      limit = "25",
      skip = "0",
    } = req.query;

    const minRep = parseInt(minReportes, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 25, 200);
    const skipNum = Math.max(parseInt(skip, 10) || 0, 0);

    const SORT_FIELDS = ["total_reportes", "validos", "falsos", "tasa_falsos", "trust_score_promedio"];
    const sortField = SORT_FIELDS.includes(sort) ? sort : "total_reportes";
    const sortDir = dir === "asc" ? 1 : -1;

    // ── 1. Agregación en Mongo: métricas por user_id ──────────────────────
    const porUsuario = await Report.aggregate([
      {
        $match: {
          is_anonymous: { $ne: true }, // los anónimos no tienen user_id confiable para rankear
        },
      },
      {
        $group: {
          _id: "$user.user_id",
          username: { $first: "$user.username" },
          surname: { $first: "$user.surname" },
          email: { $first: "$user.email" },
          total_reportes: { $sum: 1 },
          validos: { $sum: { $cond: [{ $eq: ["$validez", "valido"] }, 1, 0] } },
          falsos: { $sum: { $cond: [{ $eq: ["$validez", "falso"] }, 1, 0] } },
          dudosos: { $sum: { $cond: [{ $eq: ["$validez", "dudoso"] }, 1, 0] } },
          pendientes: { $sum: { $cond: [{ $eq: ["$validez", "pendiente"] }, 1, 0] } },
          trust_score_promedio: { $avg: "$trust_score" },
          ultimo_reporte: { $max: "$timestamp" },
        },
      },
    ]);

    // ── 2. Traer usuarios desde Postgres (fuente de verdad de rol) ────────
    const { pool } = require("../config/postgres");
    const pgResult = await pool.query(
      "SELECT user_id, username, surname, email, role FROM users"
    );
    const pgUsers = pgResult.rows; // user_id acá es numérico (SERIAL), distinto al user_id de Mongo (ObjectId string)

    // El user_id embebido en los reportes (Mongo) no necesariamente coincide
    // 1:1 con el user_id de Postgres en datos de seed/mock. Cruzamos por
    // username como mejor esfuerzo, y si no hay match dejamos rol = null.
    const pgByUsername = new Map(pgUsers.map((u) => [u.username, u]));

    let combinados = porUsuario.map((u) => {
      const pgMatch = pgByUsername.get(u.username);
      const tasaFalsos = u.total_reportes > 0 ? u.falsos / u.total_reportes : 0;
      return {
        user_id: u._id,
        username: u.username,
        surname: u.surname,
        email: u.email,
        role: pgMatch?.role ?? null,
        total_reportes: u.total_reportes,
        validos: u.validos,
        falsos: u.falsos,
        dudosos: u.dudosos,
        pendientes: u.pendientes,
        tasa_falsos: Math.round(tasaFalsos * 1000) / 1000,
        trust_score_promedio:
          u.trust_score_promedio != null ? Math.round(u.trust_score_promedio * 1000) / 1000 : null,
        ultimo_reporte: u.ultimo_reporte,
        tiene_reportes: true,
      };
    });

    // Filtro por mínimo de reportes
    combinados = combinados.filter((u) => u.total_reportes >= minRep);

    // Filtro por rol (solo aplica a quienes matchearon con Postgres)
    if (rol) {
      combinados = combinados.filter((u) => u.role === rol);
    }

    // ── 3. Orden (server-side, antes de paginar) ───────────────────────────
    combinados.sort((a, b) => {
      const av = a[sortField] ?? -1;
      const bv = b[sortField] ?? -1;
      return (av - bv) * sortDir;
    });

    // ── 4. Paginación sobre el resultado ya combinado y ordenado ──────────
    const totalRanking = combinados.length;
    const paginaActual = combinados.slice(skipNum, skipNum + limitNum);

    // ── 5. Usuarios de Postgres SIN reportes aún ───────────────────────────
    const usernamesConReportes = new Set(porUsuario.map((u) => u.username));
    const sinReportes = pgUsers
      .filter((u) => !usernamesConReportes.has(u.username))
      .filter((u) => !rol || u.role === rol)
      .map((u) => ({
        user_id: String(u.user_id),
        username: u.username,
        surname: u.surname,
        email: u.email,
        role: u.role,
        total_reportes: 0,
        validos: 0,
        falsos: 0,
        dudosos: 0,
        pendientes: 0,
        tasa_falsos: 0,
        trust_score_promedio: null,
        ultimo_reporte: null,
        tiene_reportes: false,
      }));

    // ── 6. Totales generales para KPIs (sobre el universo filtrado, no la página) ──
    const totalUsuariosPlataforma = pgUsers.length;
    const totalUsuariosActivos = porUsuario.length; // con al menos 1 reporte (no-anónimo)
    const totalReportesNoAnonimos = porUsuario.reduce((acc, u) => acc + u.total_reportes, 0);
    const totalFalsos = porUsuario.reduce((acc, u) => acc + u.falsos, 0);
    const tasaFalsosGlobal = totalReportesNoAnonimos > 0 ? totalFalsos / totalReportesNoAnonimos : 0;

    res.json({
      success: true,
      ranking: paginaActual,       // solo la página pedida
      total: totalRanking,         // total de usuarios que matchean los filtros (para "Mostrando X de Y")
      count: paginaActual.length,
      skip: skipNum,
      limit: limitNum,
      sin_reportes: rol && minRep > 0 ? [] : sinReportes,
      totales: {
        usuarios_plataforma: totalUsuariosPlataforma,
        usuarios_activos: totalUsuariosActivos,
        tasa_falsos_global: Math.round(tasaFalsosGlobal * 1000) / 1000,
        total_reportes_no_anonimos: totalReportesNoAnonimos,
      },
      filtros: { minReportes: minRep, rol: rol || null, sort: sortField, dir: dir === "asc" ? "asc" : "desc" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching user stats" });
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
// =========================
// PATCH /reports/:id/trust-score — Recalcular trust score de un reporte
// =========================
router.patch("/:id/trust-score", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Calcular nuevo trust score
    const { score, metadata } = await calculateTrustScore(report);
    
    report.trust_score = score;
    report.trust_score_metadata = metadata;
    await report.save();

    res.json({
      success: true,
      report_id: report._id,
      trust_score: score,
      metadata
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Error recalculating trust score" 
    });
  }
});

// =========================
// POST /reports/admin/recalculate-trust-scores — Recalcular trust scores en lote
// Query params: status, validez, limit (default 1000)
// =========================
router.post("/admin/recalculate-trust-scores", async (req, res) => {
  try {
    const { filter = {}, limit = 1000 } = req.body;
    
    // Construir filtro
    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.validez) query.validez = filter.validez;
    if (filter.trust_score === null) query.trust_score = null;

    const limitNum = Math.min(parseInt(limit, 10) || 1000, 5000); // Máximo 5000

    // Obtener reportes a procesar
    const reports = await Report.find(query).limit(limitNum);

    let processed = 0;
    let updated = 0;
    let failed = 0;
    let totalScore = 0;

    // Procesar cada reporte
    for (const report of reports) {
      try {
        const { score, metadata } = await calculateTrustScore(report);
        
        report.trust_score = score;
        report.trust_score_metadata = metadata;
        await report.save();
        
        updated++;
        totalScore += score;
      } catch (error) {
        console.error(`Error processing report ${report._id}:`, error);
        failed++;
      }
      processed++;
    }

    const averageScore = updated > 0 ? totalScore / updated : 0;

    res.json({
      success: true,
      processed,
      updated,
      failed,
      average_score: Math.floor(averageScore * 100) / 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Error recalculating trust scores" 
    });
  }
});

});

module.exports = router;
