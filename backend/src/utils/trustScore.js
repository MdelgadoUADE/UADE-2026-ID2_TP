const Report = require('../models/Report');

/**
 * Versión del algoritmo de trust score
 * Incrementar cuando se modifique la lógica de cálculo
 */
const TRUST_SCORE_VERSION = '1.0';

/**
 * Pesos de cada parámetro en el cálculo del trust score
 * Total debe sumar 1.0 (100%)
 */
const WEIGHTS = {
  USER_AUTHENTICATION: 0.30,  // 30%
  REPORT_COMPLETENESS: 0.25,  // 25%
  USER_HISTORY: 0.20,         // 20%
  RELATED_REPORTS: 0.15,      // 15%
  TIME_CONSISTENCY: 0.10      // 10%
};

/**
 * Trunca un número a 2 decimales
 * @param {number} value - Valor a truncar
 * @returns {number} Valor truncado a 2 decimales
 */
function truncateToTwoDecimals(value) {
  return Math.floor(value * 100) / 100;
}

/**
 * Calcula el score de autenticación del usuario
 * @param {Object} report - Documento del reporte
 * @returns {number} Score entre 0 y 1
 */
function calculateUserAuthenticationScore(report) {
  // Usuario registrado = máxima confianza
  if (report.is_anonymous === false && report.user?.user_id) {
    return 1.0;
  }
  
  // Usuario anónimo = confianza base baja
  return 0.3;
}

/**
 * Calcula el score de completitud del reporte
 * @param {Object} report - Documento del reporte
 * @returns {number} Score entre 0 y 1
 */
function calculateReportCompletenessScore(report) {
  let score = 0;
  
  // Tiene adjuntos (40% de completitud)
  if (report.attachments && report.attachments.length > 0) {
    score += 0.4;
  }
  
  // Tiene notas detalladas (40% de completitud)
  if (report.notes && report.notes.trim().length >= 20) {
    score += 0.4;
  }
  
  // Tiene tags apropiados (20% de completitud)
  if (report.tags && Object.keys(report.tags).length > 0) {
    score += 0.2;
  }
  
  // Bonus por múltiples adjuntos (máximo 1.0)
  if (report.attachments && report.attachments.length >= 3) {
    score = Math.min(1.0, score + 0.1);
  }
  
  return score;
}

/**
 * Calcula el score basado en el historial del usuario
 * @param {Object} report - Documento del reporte
 * @returns {Promise<number>} Score entre 0 y 1
 */
async function calculateUserHistoryScore(report) {
  // Usuarios anónimos tienen score base bajo
  if (report.is_anonymous || !report.user?.user_id) {
    return 0.2;
  }
  
  try {
    // Obtener reportes previos del usuario (excluyendo el actual)
    const userReports = await Report.find({
      'user.user_id': report.user.user_id,
      _id: { $ne: report._id }
    }).select('validez').lean();
    
    const totalReports = userReports.length;
    
    // Usuario nuevo registrado = score base medio
    if (totalReports === 0) {
      return 0.5;
    }
    
    // Contar reportes por validez
    const validatedReports = userReports.filter(r => r.validez === 'valido').length;
    const falseReports = userReports.filter(r => r.validez === 'falso').length;
    
    // Score base para usuario registrado con historial
    let historyScore = 0.5;
    
    // Bonus por experiencia (hasta +0.3)
    if (totalReports >= 1) historyScore += 0.1;
    if (totalReports >= 5) historyScore += 0.1;
    if (totalReports >= 10) historyScore += 0.1;
    
    // Impacto de la tasa de validación (hasta +0.2 o -0.4)
    const validationRate = validatedReports / totalReports;
    const falseRate = falseReports / totalReports;
    
    if (validationRate >= 0.8) {
      historyScore += 0.2;
    } else if (validationRate >= 0.5) {
      historyScore += 0.1;
    }
    
    // Penalización por reportes falsos
    if (falseRate >= 0.3) {
      historyScore -= 0.4;
    } else if (falseRate >= 0.2) {
      historyScore -= 0.2;
    }
    
    // Asegurar que esté entre 0 y 1
    return Math.max(0, Math.min(1, historyScore));
    
  } catch (error) {
    console.error('Error calculating user history score:', error);
    return 0.5; // Score por defecto en caso de error
  }
}

/**
 * Calcula el score basado en reportes relacionados cercanos
 * @param {Object} report - Documento del reporte
 * @returns {Promise<number>} Score entre 0 y 1
 */
async function calculateRelatedReportsScore(report) {
  try {
    // Buscar reportes cercanos (500m) en los últimos 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const nearbyReports = await Report.find({
      report_location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: report.report_location.coordinates
          },
          $maxDistance: 500 // 500 metros
        }
      },
      timestamp: { $gte: sevenDaysAgo },
      _id: { $ne: report._id }
    }).select('tags').lean();
    
    const nearbyCount = nearbyReports.length;
    
    // Score base según cantidad de reportes cercanos
    let relatedScore = 0.3; // Sin reportes cercanos
    
    if (nearbyCount >= 5) {
      relatedScore = 1.0;
    } else if (nearbyCount >= 3) {
      relatedScore = 0.7;
    } else if (nearbyCount >= 1) {
      relatedScore = 0.5;
    }
    
    // Bonus si hay coincidencia de tags con reportes cercanos
    if (report.tags && Object.keys(report.tags).length > 0) {
      const reportTags = Object.keys(report.tags);
      
      const matchingTagsCount = nearbyReports.filter(nr => {
        if (!nr.tags) return false;
        const nearbyTags = Object.keys(nr.tags);
        return reportTags.some(tag => nearbyTags.includes(tag));
      }).length;
      
      // Bonus si al menos 2 reportes cercanos tienen tags coincidentes
      if (matchingTagsCount >= 2) {
        relatedScore = Math.min(1.0, relatedScore + 0.2);
      }
    }
    
    return relatedScore;
    
  } catch (error) {
    console.error('Error calculating related reports score:', error);
    return 0.3; // Score por defecto en caso de error
  }
}

/**
 * Calcula el score de consistencia temporal
 * @param {Object} report - Documento del reporte
 * @returns {Promise<number>} Score entre 0 y 1
 */
async function calculateTimeConsistencyScore(report) {
  let timeScore = 1.0; // Asumir normal por defecto
  
  // Solo verificar para usuarios registrados
  if (!report.is_anonymous && report.user?.user_id) {
    try {
      // Verificar reportes rápidos (posible bot)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentReports = await Report.countDocuments({
        'user.user_id': report.user.user_id,
        timestamp: { $gte: fiveMinutesAgo },
        _id: { $ne: report._id }
      });
      
      // Penalización por reportes rápidos
      if (recentReports >= 5) {
        timeScore = 0.2; // Sospechoso: 5+ reportes en 5 minutos
      } else if (recentReports >= 3) {
        timeScore = 0.5; // Cuestionable: 3-4 reportes en 5 minutos
      }
      
      // Verificar horario inusual (2 AM - 5 AM)
      const hour = new Date(report.timestamp).getHours();
      if (hour >= 2 && hour < 5) {
        timeScore *= 0.8; // Penalización leve por horario inusual
      }
      
    } catch (error) {
      console.error('Error calculating time consistency score:', error);
    }
  }
  
  return timeScore;
}

/**
 * Calcula el trust score completo para un reporte
 * @param {Object} report - Documento del reporte (puede ser lean o documento Mongoose)
 * @returns {Promise<Object>} Objeto con score y metadata
 */
async function calculateTrustScore(report) {
  try {
    // Calcular cada componente del score
    const authScore = calculateUserAuthenticationScore(report);
    const completenessScore = calculateReportCompletenessScore(report);
    const historyScore = await calculateUserHistoryScore(report);
    const relatedScore = await calculateRelatedReportsScore(report);
    const timeScore = await calculateTimeConsistencyScore(report);
    
    // Aplicar pesos y sumar
    const weightedScore = 
      (authScore * WEIGHTS.USER_AUTHENTICATION) +
      (completenessScore * WEIGHTS.REPORT_COMPLETENESS) +
      (historyScore * WEIGHTS.USER_HISTORY) +
      (relatedScore * WEIGHTS.RELATED_REPORTS) +
      (timeScore * WEIGHTS.TIME_CONSISTENCY);
    
    // Truncar a 2 decimales
    const finalScore = truncateToTwoDecimals(weightedScore);
    
    // Crear metadata con breakdown
    const metadata = {
      calculated_at: new Date(),
      version: TRUST_SCORE_VERSION,
      breakdown: {
        user_authentication: truncateToTwoDecimals(authScore * WEIGHTS.USER_AUTHENTICATION),
        report_completeness: truncateToTwoDecimals(completenessScore * WEIGHTS.REPORT_COMPLETENESS),
        user_history: truncateToTwoDecimals(historyScore * WEIGHTS.USER_HISTORY),
        related_reports: truncateToTwoDecimals(relatedScore * WEIGHTS.RELATED_REPORTS),
        time_consistency: truncateToTwoDecimals(timeScore * WEIGHTS.TIME_CONSISTENCY)
      }
    };
    
    return {
      score: finalScore,
      metadata
    };
    
  } catch (error) {
    console.error('Error calculating trust score:', error);
    throw error;
  }
}

/**
 * Calcula y actualiza el trust score de un reporte existente
 * @param {string} reportId - ID del reporte
 * @returns {Promise<Object>} Reporte actualizado con trust score
 */
async function calculateAndUpdateTrustScore(reportId) {
  try {
    const report = await Report.findById(reportId);
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    const { score, metadata } = await calculateTrustScore(report);
    
    report.trust_score = score;
    report.trust_score_metadata = metadata;
    
    await report.save();
    
    return report;
    
  } catch (error) {
    console.error('Error calculating and updating trust score:', error);
    throw error;
  }
}

module.exports = {
  calculateTrustScore,
  calculateAndUpdateTrustScore,
  TRUST_SCORE_VERSION,
  WEIGHTS
};

// Made with Bob
