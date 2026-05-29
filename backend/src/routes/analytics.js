const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { requireAuth } = require('../middleware/auth');
const { clusterReports, findClusterCandidates, recalculateClusters } = require('../utils/clustering');

/**
 * Todas las rutas de analytics requieren autenticación
 */

/**
 * GET /analytics/stats
 * Obtener estadísticas generales del sistema
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $facet: {
          // Total de reportes
          total: [
            { $count: 'count' }
          ],
          
          // Reportes por status
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Reportes por validity
          byValidity: [
            {
              $group: {
                _id: '$validity',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Reportes por criticality
          byCriticality: [
            {
              $group: {
                _id: '$criticality',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Trust score promedio
          avgTrustScore: [
            {
              $group: {
                _id: null,
                avg: { $avg: '$trust_score' }
              }
            }
          ],
          
          // Reportes anónimos vs autenticados
          byAuthType: [
            {
              $group: {
                _id: '$is_anonymous',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Reportes en las últimas 24 horas
          last24h: [
            {
              $match: {
                timestamp: {
                  $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
              }
            },
            { $count: 'count' }
          ],
          
          // Top 5 tags más usados
          topTags: [
            {
              $project: {
                tags: { $objectToArray: '$tags' }
              }
            },
            { $unwind: '$tags' },
            {
              $group: {
                _id: '$tags.k',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

/**
 * GET /analytics/reports/pending
 * Obtener reportes pendientes de validación
 */
router.get('/reports/pending', requireAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const reports = await Report.find({
      validity: 'pending'
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Report.countDocuments({ validity: 'pending' });

    res.json({
      success: true,
      total,
      reports
    });

  } catch (error) {
    console.error('Error fetching pending reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending reports',
      error: error.message
    });
  }
});

/**
 * PUT /analytics/reports/:id/validate
 * Validar o rechazar un reporte
 */
router.put('/reports/:id/validate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { validity, criticality, analyst_notes } = req.body;

    // Validar parámetros
    if (!validity) {
      return res.status(400).json({
        success: false,
        message: 'validity is required'
      });
    }

    const validValidities = ['valid', 'invalid', 'duplicate'];
    if (!validValidities.includes(validity)) {
      return res.status(400).json({
        success: false,
        message: `validity must be one of: ${validValidities.join(', ')}`
      });
    }

    // Actualizar reporte
    const updateData = {
      validity,
      validated_by: {
        user_id: req.user.user_id,
        username: req.headers['x-user-name'] || 'admin',
        timestamp: new Date()
      }
    };

    if (criticality) {
      updateData.criticality = criticality;
    }

    if (analyst_notes) {
      updateData.analyst_notes = analyst_notes;
    }

    const report = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error validating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating report',
      error: error.message
    });
  }
});

/**
 * GET /analytics/reports/clusters
 * Obtener reportes agrupados por clusters
 */
router.get('/reports/clusters', requireAuth, async (req, res) => {
  try {
    const clusters = await Report.aggregate([
      {
        $match: {
          cluster_id: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$cluster_id',
          count: { $sum: 1 },
          reports: { $push: '$$ROOT' },
          avgTrustScore: { $avg: '$trust_score' },
          criticalities: { $push: '$criticality' },
          statuses: { $push: '$status' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json({
      success: true,
      clusters
    });

  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clusters',
      error: error.message
    });
  }
});

/**
 * GET /analytics/heatmap
 * Obtener datos para mapa de calor
 */
router.get('/heatmap', requireAuth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const heatmapData = await Report.aggregate([
      {
        $match: {
          status,
          'report_location.coordinates': { $exists: true }
        }
      },
      {
        $project: {
          coordinates: '$report_location.coordinates',
          trust_score: 1,
          criticality: 1
        }
      },
      {
        $limit: 1000 // Limitar para performance
      }
    ]);

    res.json({
      success: true,
      count: heatmapData.length,
      data: heatmapData
    });

  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching heatmap data',
      error: error.message
    });
  }
});

/**
 * GET /analytics/trends
 * Obtener tendencias temporales
 */
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = await Report.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 },
          avgTrustScore: { $avg: '$trust_score' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      trends
    });

  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trends',
      error: error.message
    });
  }
});

/**
 * POST /analytics/cluster/run
 * Ejecutar clustering de reportes
 */
router.post('/cluster/run', requireAuth, async (req, res) => {
  try {
    const { maxDistance, timeWindowHours, minTrustScore } = req.body;

    const result = await clusterReports({
      maxDistance,
      timeWindowHours,
      minTrustScore
    });

    res.json(result);

  } catch (error) {
    console.error('Error running clustering:', error);
    res.status(500).json({
      success: false,
      message: 'Error running clustering',
      error: error.message
    });
  }
});

/**
 * POST /analytics/cluster/recalculate
 * Recalcular todos los clusters
 */
router.post('/cluster/recalculate', requireAuth, async (req, res) => {
  try {
    const result = await recalculateClusters();
    res.json(result);

  } catch (error) {
    console.error('Error recalculating clusters:', error);
    res.status(500).json({
      success: false,
      message: 'Error recalculating clusters',
      error: error.message
    });
  }
});

/**
 * GET /analytics/cluster/candidates/:id
 * Obtener candidatos para clustering de un reporte específico
 */
router.get('/cluster/candidates/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDistance, timeWindowHours, minTrustScore } = req.query;

    const candidates = await findClusterCandidates(id, {
      maxDistance: maxDistance ? parseInt(maxDistance) : undefined,
      timeWindowHours: timeWindowHours ? parseInt(timeWindowHours) : undefined,
      minTrustScore: minTrustScore ? parseFloat(minTrustScore) : undefined
    });

    res.json({
      success: true,
      count: candidates.length,
      candidates
    });

  } catch (error) {
    console.error('Error finding cluster candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding cluster candidates',
      error: error.message
    });
  }
});

module.exports = router;

// Made with Bob
