/**
 * Calcula el score de confianza de un reporte
 * 
 * Factores considerados:
 * - Usuario autenticado vs anónimo (+0.3)
 * - Tiene attachments (+0.2)
 * - Cantidad de tags (+0.1 por tag, max 0.3)
 * - Ubicación verificada con dirección (+0.1)
 * - Base: 0.5
 * 
 * @param {Object} reportData - Datos del reporte
 * @returns {Number} Score entre 0 y 1
 */
function calculateTrustScore(reportData) {
  let score = 0.5; // Base score

  // Factor 1: Usuario autenticado (+0.3)
  if (!reportData.is_anonymous && reportData.user && reportData.user.user_id) {
    // Verificar que no sea un ID anónimo generado
    if (!reportData.user.user_id.startsWith('anon_')) {
      score += 0.3;
    }
  }

  // Factor 2: Tiene attachments (+0.2)
  if (reportData.attachments && reportData.attachments.length > 0) {
    score += 0.2;
  }

  // Factor 3: Cantidad de tags (+0.1 por tag, max 0.3)
  if (reportData.tags && typeof reportData.tags === 'object') {
    const tagCount = Object.keys(reportData.tags).length;
    const tagBonus = Math.min(tagCount * 0.1, 0.3);
    score += tagBonus;
  }

  // Factor 4: Ubicación verificada con dirección (+0.1)
  if (reportData.report_location && reportData.report_location.address) {
    score += 0.1;
  }

  // Factor 5: Tiene notas descriptivas (+0.05)
  if (reportData.notes && reportData.notes.trim().length > 20) {
    score += 0.05;
  }

  // Asegurar que el score esté entre 0 y 1
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Calcula el score de confianza considerando el historial del usuario
 * 
 * @param {Object} reportData - Datos del reporte
 * @param {Number} userReportCount - Cantidad de reportes previos del usuario
 * @param {Number} userAverageScore - Score promedio de reportes previos
 * @returns {Number} Score ajustado entre 0 y 1
 */
function calculateTrustScoreWithHistory(reportData, userReportCount = 0, userAverageScore = 0.5) {
  let baseScore = calculateTrustScore(reportData);

  // Si el usuario tiene historial, ajustar el score
  if (userReportCount > 0) {
    // Usuarios con buen historial obtienen un pequeño bonus
    if (userAverageScore > 0.7 && userReportCount >= 5) {
      baseScore += 0.05;
    }
    
    // Usuarios con mal historial obtienen una penalización
    if (userAverageScore < 0.4 && userReportCount >= 3) {
      baseScore -= 0.1;
    }
  }

  // Asegurar que el score esté entre 0 y 1
  return Math.min(Math.max(baseScore, 0), 1);
}

/**
 * Obtiene una descripción textual del nivel de confianza
 * 
 * @param {Number} score - Score de confianza (0-1)
 * @returns {String} Descripción del nivel
 */
function getTrustLevel(score) {
  if (score >= 0.9) return 'Muy Alto';
  if (score >= 0.7) return 'Alto';
  if (score >= 0.5) return 'Medio';
  if (score >= 0.3) return 'Bajo';
  return 'Muy Bajo';
}

/**
 * Obtiene el color asociado al nivel de confianza
 * 
 * @param {Number} score - Score de confianza (0-1)
 * @returns {String} Color en formato hex
 */
function getTrustColor(score) {
  if (score >= 0.9) return '#10b981'; // green-500
  if (score >= 0.7) return '#3b82f6'; // blue-500
  if (score >= 0.5) return '#f59e0b'; // amber-500
  if (score >= 0.3) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

module.exports = {
  calculateTrustScore,
  calculateTrustScoreWithHistory,
  getTrustLevel,
  getTrustColor
};

// Made with Bob
