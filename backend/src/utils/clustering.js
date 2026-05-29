const Report = require('../models/Report');

/**
 * Algoritmo de clustering para agrupar reportes relacionados
 * 
 * Criterios de agrupación:
 * - Distancia geográfica < 500m
 * - Al menos 1 tag en común
 * - Ventana temporal de 48 horas
 * - Trust score > 0.4
 */

/**
 * Calcula la distancia entre dos puntos geográficos (en metros)
 * Usa la fórmula de Haversine
 */
function calculateDistance(coord1, coord2) {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const deltaLng = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distancia en metros
}

/**
 * Verifica si dos reportes tienen tags en común
 */
function hasCommonTags(tags1, tags2) {
  if (!tags1 || !tags2) return false;
  
  const keys1 = Object.keys(tags1);
  const keys2 = Object.keys(tags2);
  
  return keys1.some(key => keys2.includes(key));
}

/**
 * Verifica si dos reportes están dentro de la ventana temporal
 */
function isWithinTimeWindow(timestamp1, timestamp2, windowHours = 48) {
  const diff = Math.abs(new Date(timestamp1) - new Date(timestamp2));
  const hours = diff / (1000 * 60 * 60);
  return hours <= windowHours;
}

/**
 * Determina si dos reportes deben estar en el mismo cluster
 */
function shouldCluster(report1, report2, options = {}) {
  const {
    maxDistance = 500,      // metros
    timeWindowHours = 48,   // horas
    minTrustScore = 0.4
  } = options;

  // Verificar trust score mínimo
  if (report1.trust_score < minTrustScore || report2.trust_score < minTrustScore) {
    return false;
  }

  // Verificar distancia geográfica
  const distance = calculateDistance(
    report1.report_location.coordinates,
    report2.report_location.coordinates
  );
  
  if (distance > maxDistance) {
    return false;
  }

  // Verificar ventana temporal
  if (!isWithinTimeWindow(report1.timestamp, report2.timestamp, timeWindowHours)) {
    return false;
  }

  // Verificar tags en común
  if (!hasCommonTags(report1.tags, report2.tags)) {
    return false;
  }

  return true;
}

/**
 * Genera un ID único para un cluster
 */
function generateClusterId() {
  return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Agrupa reportes relacionados usando un algoritmo simple de clustering
 * 
 * @param {Object} options - Opciones de clustering
 * @returns {Promise<Object>} Resultado del clustering
 */
async function clusterReports(options = {}) {
  try {
    const {
      maxDistance = 500,
      timeWindowHours = 48,
      minTrustScore = 0.4,
      status = 'active'
    } = options;

    // Obtener reportes sin cluster asignado
    const reports = await Report.find({
      cluster_id: null,
      status,
      trust_score: { $gte: minTrustScore }
    }).sort({ timestamp: -1 });

    console.log(`Clustering ${reports.length} reports...`);

    const clusters = [];
    const processed = new Set();

    for (let i = 0; i < reports.length; i++) {
      if (processed.has(reports[i]._id.toString())) continue;

      const cluster = {
        id: generateClusterId(),
        reports: [reports[i]]
      };

      processed.add(reports[i]._id.toString());

      // Buscar reportes relacionados
      for (let j = i + 1; j < reports.length; j++) {
        if (processed.has(reports[j]._id.toString())) continue;

        if (shouldCluster(reports[i], reports[j], { maxDistance, timeWindowHours, minTrustScore })) {
          cluster.reports.push(reports[j]);
          processed.add(reports[j]._id.toString());
        }
      }

      // Solo crear cluster si tiene más de 1 reporte
      if (cluster.reports.length > 1) {
        clusters.push(cluster);

        // Actualizar reportes con el cluster_id
        const reportIds = cluster.reports.map(r => r._id);
        await Report.updateMany(
          { _id: { $in: reportIds } },
          { $set: { cluster_id: cluster.id } }
        );

        // Actualizar related_reports
        for (const report of cluster.reports) {
          const relatedIds = cluster.reports
            .filter(r => r._id.toString() !== report._id.toString())
            .map(r => r._id.toString());
          
          await Report.findByIdAndUpdate(
            report._id,
            { $set: { related_reports: relatedIds } }
          );
        }
      }
    }

    console.log(`Created ${clusters.length} clusters`);

    return {
      success: true,
      clustersCreated: clusters.length,
      reportsProcessed: reports.length,
      clusters: clusters.map(c => ({
        id: c.id,
        count: c.reports.length,
        reportIds: c.reports.map(r => r._id)
      }))
    };

  } catch (error) {
    console.error('Error in clustering:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Encuentra reportes cercanos a uno dado que podrían formar un cluster
 * 
 * @param {String} reportId - ID del reporte base
 * @param {Object} options - Opciones de búsqueda
 * @returns {Promise<Array>} Reportes candidatos para clustering
 */
async function findClusterCandidates(reportId, options = {}) {
  try {
    const {
      maxDistance = 500,
      timeWindowHours = 48,
      minTrustScore = 0.4
    } = options;

    const baseReport = await Report.findById(reportId);
    
    if (!baseReport) {
      throw new Error('Report not found');
    }

    // Calcular ventana temporal
    const startTime = new Date(baseReport.timestamp);
    startTime.setHours(startTime.getHours() - timeWindowHours);
    const endTime = new Date(baseReport.timestamp);
    endTime.setHours(endTime.getHours() + timeWindowHours);

    // Buscar reportes cercanos en tiempo y espacio
    const candidates = await Report.find({
      _id: { $ne: reportId },
      timestamp: { $gte: startTime, $lte: endTime },
      trust_score: { $gte: minTrustScore },
      report_location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: baseReport.report_location.coordinates
          },
          $maxDistance: maxDistance
        }
      }
    });

    // Filtrar por tags en común
    const related = candidates.filter(candidate => 
      hasCommonTags(baseReport.tags, candidate.tags)
    );

    return related;

  } catch (error) {
    console.error('Error finding cluster candidates:', error);
    throw error;
  }
}

/**
 * Recalcula clusters existentes (útil cuando se actualizan reportes)
 */
async function recalculateClusters() {
  try {
    // Limpiar clusters existentes
    await Report.updateMany(
      {},
      {
        $set: {
          cluster_id: null,
          related_reports: []
        }
      }
    );

    // Ejecutar clustering nuevamente
    return await clusterReports();

  } catch (error) {
    console.error('Error recalculating clusters:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  clusterReports,
  findClusterCandidates,
  recalculateClusters,
  calculateDistance,
  hasCommonTags,
  shouldCluster
};

// Made with Bob
