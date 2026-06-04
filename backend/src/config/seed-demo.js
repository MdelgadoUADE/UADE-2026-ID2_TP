const Report = require('../models/Report');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN CENTRAL
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  TOTAL_REPORTS: parseInt(process.env.SEED_REPORTS) || 5000,
  CLUSTER_COUNT: Math.floor((parseInt(process.env.SEED_REPORTS) || 5000) / 200),
  CLUSTER_SIZE_MIN: 15,
  CLUSTER_SIZE_MAX: 40,
  BATCH_SIZE: 1000,
  TIME_RANGE_MONTHS: 6,
  CLEAR_EXISTING: process.env.SEED_CLEAR === 'true'
};

// ═══════════════════════════════════════════════════════════════════════════
// ZONAS GEOGRÁFICAS CON PESOS
// ═══════════════════════════════════════════════════════════════════════════

const ZONES = [
  // Buenos Aires (80%)
  { city: 'Buenos Aires', zone: 'Palermo', lat: -34.588, lng: -58.430, weight: 20 },
  { city: 'Buenos Aires', zone: 'Recoleta', lat: -34.592, lng: -58.390, weight: 15 },
  { city: 'Buenos Aires', zone: 'Monserrat', lat: -34.610, lng: -58.380, weight: 15 },
  { city: 'Buenos Aires', zone: 'Caballito', lat: -34.620, lng: -58.440, weight: 10 },
  { city: 'Buenos Aires', zone: 'Balvanera', lat: -34.609, lng: -58.407, weight: 10 },
  { city: 'Buenos Aires', zone: 'San Nicolás', lat: -34.603, lng: -58.377, weight: 10 },
  
  // Córdoba (20%)
  { city: 'Córdoba', zone: 'Nueva Córdoba', lat: -31.424, lng: -64.184, weight: 10 },
  { city: 'Córdoba', zone: 'Centro', lat: -31.417, lng: -64.183, weight: 5 },
  { city: 'Córdoba', zone: 'General Paz', lat: -31.409, lng: -64.168, weight: 3 },
  { city: 'Córdoba', zone: 'Güemes', lat: -31.413, lng: -64.195, weight: 1 },
  { city: 'Córdoba', zone: 'Alta Córdoba', lat: -31.400, lng: -64.182, weight: 0.5 },
  { city: 'Córdoba', zone: 'Cerro de las Rosas', lat: -31.381, lng: -64.230, weight: 0.5 }
];

// ═══════════════════════════════════════════════════════════════════════════
// CATÁLOGO DE TIPOS DE INCIDENTES
// ═══════════════════════════════════════════════════════════════════════════

const INCIDENT_TYPES = [
  // Seguridad (53%)
  { type: 'vehiculo_sospechoso', category: 'seguridad', weight: 20 },
  { type: 'persona_sospechosa', category: 'seguridad', weight: 15 },
  { type: 'robo', category: 'seguridad', weight: 10 },
  { type: 'vandalismo', category: 'seguridad', weight: 8 },
  
  // Infraestructura (23%)
  { type: 'bache', category: 'infraestructura', weight: 10 },
  { type: 'luminaria', category: 'infraestructura', weight: 8 },
  { type: 'semaforo', category: 'infraestructura', weight: 5 },
  
  // Ambiente (14%)
  { type: 'basura', category: 'ambiente', weight: 10 },
  { type: 'contaminacion', category: 'ambiente', weight: 4 },
  
  // Tránsito (10%)
  { type: 'accidente', category: 'transito', weight: 6 },
  { type: 'vehiculo_abandonado', category: 'transito', weight: 4 }
];

// ═══════════════════════════════════════════════════════════════════════════
// DATOS AUXILIARES PARA GENERACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const VEHICLE_COLORS = ['Negro', 'Blanco', 'Gris', 'Rojo', 'Azul', 'Verde', 'Plateado', 'Amarillo'];
const VEHICLE_MODELS = ['Auto', 'Motocicleta', 'Camioneta', 'Camión', 'Bicicleta'];
const VEHICLE_BRANDS = ['Toyota', 'Ford', 'Chevrolet', 'Volkswagen', 'Fiat', 'Renault', 'Peugeot', 'Honda'];
const GENDERS = ['Masculino', 'Femenino', 'No especificado'];
const HAIR_COLORS = ['Negro', 'Castaño', 'Rubio', 'Pelirrojo', 'Gris', 'Canoso'];
const INFRASTRUCTURE_STATES = ['Roto', 'Dañado', 'No funciona', 'Deteriorado', 'Peligroso'];
const DAMAGE_SEVERITIES = ['Leve', 'Moderado', 'Grave', 'Crítico'];

const STATUS_DISTRIBUTION = [
  { value: 'active', weight: 35 },
  { value: 'en_verificacion', weight: 20 },
  { value: 'asignado', weight: 15 },
  { value: 'resolved', weight: 20 },
  { value: 'archived', weight: 10 }
];

const CRITICIDAD_DISTRIBUTION = [
  { value: 'baja', weight: 25 },
  { value: 'media', weight: 30 },
  { value: 'alta', weight: 20 },
  { value: 'critica', weight: 10 },
  { value: null, weight: 15 }
];

const VALIDEZ_DISTRIBUTION = [
  { value: 'pendiente', weight: 40 },
  { value: 'valido', weight: 35 },
  { value: 'dudoso', weight: 15 },
  { value: 'falso', weight: 10 }
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Selección aleatoria ponderada
 */
function randomWeighted(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

/**
 * Número aleatorio en rango
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Elemento aleatorio de array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Genera patente argentina realista
 */
function generatePlate() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  // Formato nuevo: AB123CD o viejo: ABC123
  if (Math.random() > 0.5) {
    return `${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}${digits[randomInt(0, 9)]}${digits[randomInt(0, 9)]}${digits[randomInt(0, 9)]}${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}`;
  } else {
    return `${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}${digits[randomInt(0, 9)]}${digits[randomInt(0, 9)]}${digits[randomInt(0, 9)]}`;
  }
}

/**
 * Genera timestamp realista con distribución temporal y horarios pico
 */
function generateRealisticTimestamp() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - CONFIG.TIME_RANGE_MONTHS * 30 * 24 * 60 * 60 * 1000);
  
  // Distribución temporal: más reciente = más probable
  const random = Math.random();
  let daysAgo;
  
  if (random < 0.10) {
    // 10% en últimas 24 horas
    daysAgo = Math.random();
  } else if (random < 0.30) {
    // 20% en última semana
    daysAgo = 1 + Math.random() * 6;
  } else if (random < 0.60) {
    // 30% en último mes
    daysAgo = 7 + Math.random() * 23;
  } else {
    // 40% en últimos 6 meses
    daysAgo = 30 + Math.random() * 150;
  }
  
  const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Ajustar hora del día según horarios pico
  const hourRandom = Math.random();
  let hour;
  
  if (hourRandom < 0.25) {
    // 25% en horario pico mañana (8-10)
    hour = 8 + Math.random() * 2;
  } else if (hourRandom < 0.45) {
    // 20% en horario pico mediodía (12-14)
    hour = 12 + Math.random() * 2;
  } else if (hourRandom < 0.75) {
    // 30% en horario pico tarde-noche (18-23)
    hour = 18 + Math.random() * 5;
  } else {
    // 25% en otros horarios
    hour = Math.random() * 24;
  }
  
  timestamp.setHours(Math.floor(hour), randomInt(0, 59), randomInt(0, 59));
  
  return timestamp;
}

/**
 * Genera ubicación con variación aleatoria
 */
function generateLocation(zone, radiusKm = 1) {
  // 1 grado ≈ 111 km
  const latVariation = (Math.random() - 0.5) * 2 * (radiusKm / 111);
  const lngVariation = (Math.random() - 0.5) * 2 * (radiusKm / 111);
  
  return {
    type: 'Point',
    coordinates: [
      zone.lng + lngVariation,
      zone.lat + latVariation
    ],
    address: `${zone.zone}, ${zone.city}`
  };
}

/**
 * Genera usuario (70% autenticado, 30% anónimo)
 */
function generateUser() {
  if (Math.random() < 0.3) {
    return {
      user_id: 'anonymous',
      username: 'anonymous',
      surname: '',
      email: ''
    };
  }
  
  const id = randomInt(1000, 9999);
  const names = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia', 'Diego', 'Valentina'];
  const surnames = ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Pérez', 'Sánchez'];
  
  const name = randomChoice(names);
  const surname = randomChoice(surnames);
  
  return {
    user_id: `user_${id}`,
    username: name,
    surname: surname,
    email: `${name.toLowerCase()}.${surname.toLowerCase()}@example.com`
  };
}

/**
 * Genera tags dinámicos según tipo de incidente
 */
function generateTagsForType(incidentType) {
  switch (incidentType) {
    case 'vehiculo_sospechoso':
      return {
        color_vehiculo: randomChoice(VEHICLE_COLORS),
        modelo_vehiculo: randomChoice(VEHICLE_MODELS),
        patente_vehiculo: Math.random() > 0.3 ? generatePlate() : 'No visible',
        marca_vehiculo: randomChoice(VEHICLE_BRANDS)
      };
      
    case 'persona_sospechosa':
      return {
        genero_actor: randomChoice(GENDERS),
        pelo_color_actor: randomChoice(HAIR_COLORS),
        edad_actor: String(randomInt(15, 65)),
        vestimenta: randomChoice(['Casual', 'Deportiva', 'Formal', 'Oscura'])
      };
      
    case 'robo':
      return {
        tipo_robo: randomChoice(['Motochorro', 'Arrebato', 'Robo a comercio', 'Robo a vivienda']),
        objetos_robados: randomChoice(['Celular', 'Cartera', 'Mochila', 'Bicicleta', 'Varios'])
      };
      
    case 'vandalismo':
      return {
        tipo_dano: randomChoice(['Graffiti', 'Rotura', 'Incendio', 'Destrucción']),
        severidad: randomChoice(DAMAGE_SEVERITIES)
      };
      
    case 'bache':
      return {
        tipo_incidente: 'infraestructura',
        categoria: 'bache',
        severidad: randomChoice(DAMAGE_SEVERITIES),
        tamano: randomChoice(['Pequeño', 'Mediano', 'Grande'])
      };
      
    case 'luminaria':
      return {
        tipo_incidente: 'infraestructura',
        categoria: 'luminaria',
        estado: randomChoice(INFRASTRUCTURE_STATES)
      };
      
    case 'semaforo':
      return {
        tipo_incidente: 'infraestructura',
        categoria: 'semaforo',
        estado: randomChoice(['No funciona', 'Intermitente', 'Roto', 'Apagado'])
      };
      
    case 'basura':
      return {
        tipo_incidente: 'ambiente',
        categoria: 'basura',
        volumen: randomChoice(['Poco', 'Moderado', 'Mucho', 'Excesivo'])
      };
      
    case 'contaminacion':
      return {
        tipo_incidente: 'ambiente',
        categoria: 'contaminacion',
        tipo_contaminacion: randomChoice(['Aire', 'Agua', 'Ruido', 'Visual'])
      };
      
    case 'accidente':
      return {
        tipo_accidente: randomChoice(['Choque', 'Atropello', 'Vuelco', 'Colisión múltiple']),
        vehiculos_involucrados: String(randomInt(1, 4))
      };
      
    case 'vehiculo_abandonado':
      return {
        tipo_vehiculo: randomChoice(VEHICLE_MODELS),
        estado: randomChoice(['Quemado', 'Desarmado', 'Abandonado', 'Sin ruedas'])
      };
      
    default:
      return {};
  }
}

/**
 * Genera notas descriptivas según tipo de incidente
 */
function generateNotes(incidentType, tags) {
  const templates = {
    vehiculo_sospechoso: [
      `Vehículo ${tags.modelo_vehiculo} ${tags.color_vehiculo} circulando de manera sospechosa.`,
      `Se observa ${tags.modelo_vehiculo} ${tags.color_vehiculo} dando vueltas por la zona.`,
      `${tags.modelo_vehiculo} ${tags.color_vehiculo} con comportamiento extraño. Patente: ${tags.patente_vehiculo}`
    ],
    persona_sospechosa: [
      `Persona de ${tags.edad_actor} años aproximadamente, ${tags.genero_actor}, con actitud sospechosa.`,
      `Individuo ${tags.genero_actor} merodeando la zona, pelo ${tags.pelo_color_actor}.`,
      `Se observa persona sospechosa, vestimenta ${tags.vestimenta}.`
    ],
    robo: [
      `Reporte de ${tags.tipo_robo}. Objeto robado: ${tags.objetos_robados}.`,
      `Víctima de robo tipo ${tags.tipo_robo}.`,
      `Se reporta robo de ${tags.objetos_robados}.`
    ],
    vandalismo: [
      `Acto de vandalismo: ${tags.tipo_dano}. Severidad: ${tags.severidad}.`,
      `Daño a propiedad pública/privada: ${tags.tipo_dano}.`,
      `Vandalismo reportado, tipo ${tags.tipo_dano}.`
    ],
    bache: [
      `Bache ${tags.tamano} en la calzada. Severidad: ${tags.severidad}.`,
      `Deterioro en pavimento, tamaño ${tags.tamano}.`,
      `Bache peligroso para vehículos.`
    ],
    luminaria: [
      `Luminaria ${tags.estado}.`,
      `Falta de iluminación pública, luminaria ${tags.estado}.`,
      `Poste de luz en mal estado.`
    ],
    semaforo: [
      `Semáforo ${tags.estado}.`,
      `Problema con semáforo: ${tags.estado}.`,
      `Semáforo requiere reparación urgente.`
    ],
    basura: [
      `Acumulación de basura, volumen ${tags.volumen}.`,
      `Basura sin recolectar, cantidad ${tags.volumen}.`,
      `Problema de higiene urbana.`
    ],
    contaminacion: [
      `Contaminación ${tags.tipo_contaminacion} en la zona.`,
      `Problema ambiental: contaminación ${tags.tipo_contaminacion}.`,
      `Afectación por contaminación.`
    ],
    accidente: [
      `Accidente de tránsito: ${tags.tipo_accidente}. Vehículos: ${tags.vehiculos_involucrados}.`,
      `${tags.tipo_accidente} con ${tags.vehiculos_involucrados} vehículos involucrados.`,
      `Accidente requiere asistencia.`
    ],
    vehiculo_abandonado: [
      `${tags.tipo_vehiculo} abandonado, estado: ${tags.estado}.`,
      `Vehículo ${tags.estado} en la vía pública.`,
      `${tags.tipo_vehiculo} requiere remoción.`
    ]
  };
  
  const options = templates[incidentType] || ['Reporte de incidente.'];
  return randomChoice(options);
}

/**
 * Genera trust score correlacionado con validez
 */
function generateTrustScore(validez) {
  switch (validez) {
    case 'valido':
      return 0.7 + Math.random() * 0.25; // 0.7-0.95
    case 'dudoso':
      return 0.4 + Math.random() * 0.2;  // 0.4-0.6
    case 'falso':
      return 0.1 + Math.random() * 0.2;  // 0.1-0.3
    case 'pendiente':
    default:
      return 0.5 + Math.random() * 0.3;  // 0.5-0.8
  }
}

/**
 * Genera attachments ocasionalmente
 */
function generateAttachments() {
  if (Math.random() > 0.3) return []; // 70% sin attachments
  
  const count = randomInt(1, 3);
  const attachments = [];
  
  for (let i = 0; i < count; i++) {
    attachments.push(`attachment_${Date.now()}_${randomInt(1000, 9999)}.jpg`);
  }
  
  return attachments;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERADORES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera un reporte individual
 */
function generateReport(options = {}) {
  const zone = options.zone || randomWeighted(ZONES);
  const incidentData = options.incidentType || randomWeighted(INCIDENT_TYPES);
  const timestamp = options.timestamp || generateRealisticTimestamp();
  const location = options.location || generateLocation(zone, options.radius || 1);
  const tags = options.tags || generateTagsForType(incidentData.type);
  
  const status = randomWeighted(STATUS_DISTRIBUTION).value;
  const criticidad = randomWeighted(CRITICIDAD_DISTRIBUTION).value;
  const validez = randomWeighted(VALIDEZ_DISTRIBUTION).value;
  const user = generateUser();
  const isAnonymous = user.user_id === 'anonymous';
  
  return {
    user,
    timestamp,
    notes: generateNotes(incidentData.type, tags),
    attachments: generateAttachments(),
    tags,
    report_location: location,
    status,
    criticidad,
    validez,
    is_anonymous: isAnonymous,
    trust_score: generateTrustScore(validez)
  };
}

/**
 * Genera clusters correlacionados para detección automática
 */
function generateClusteredReports() {
  console.log(`\n🔗 Generando ${CONFIG.CLUSTER_COUNT} clusters correlacionados...`);
  
  const clusteredReports = [];
  
  // Tipos de incidentes que generan buenos clusters
  const clusterableTypes = INCIDENT_TYPES.filter(t =>
    ['vehiculo_sospechoso', 'persona_sospechosa', 'robo', 'vandalismo'].includes(t.type)
  );
  
  for (let i = 0; i < CONFIG.CLUSTER_COUNT; i++) {
    const clusterSize = randomInt(CONFIG.CLUSTER_SIZE_MIN, CONFIG.CLUSTER_SIZE_MAX);
    const zone = randomWeighted(ZONES);
    const incidentData = randomChoice(clusterableTypes);
    
    // Generar tags base que se mantendrán en el cluster
    const baseTags = generateTagsForType(incidentData.type);
    
    // Timestamp base para el cluster
    const baseTimestamp = generateRealisticTimestamp();
    
    // Coordenadas base para el cluster
    const baseLocation = generateLocation(zone, 0.5);
    
    console.log(`  Cluster ${i + 1}/${CONFIG.CLUSTER_COUNT}: ${clusterSize} reportes de "${incidentData.type}" en ${zone.zone}`);
    
    for (let j = 0; j < clusterSize; j++) {
      // Variación temporal: ±90 minutos
      const timeVariation = (Math.random() - 0.5) * 2 * 90 * 60 * 1000;
      const timestamp = new Date(baseTimestamp.getTime() + timeVariation);
      
      // Variación espacial: ±300m (≈0.002 grados)
      const latVariation = (Math.random() - 0.5) * 0.004;
      const lngVariation = (Math.random() - 0.5) * 0.004;
      
      const location = {
        type: 'Point',
        coordinates: [
          baseLocation.coordinates[0] + lngVariation,
          baseLocation.coordinates[1] + latVariation
        ],
        address: baseLocation.address
      };
      
      // Mantener tags principales pero con pequeñas variaciones
      const tags = { ...baseTags };
      
      // Agregar pequeña variación en algunos tags no críticos
      if (Math.random() > 0.7 && tags.edad_actor) {
        tags.edad_actor = String(parseInt(tags.edad_actor) + randomInt(-2, 2));
      }
      
      const report = generateReport({
        zone,
        incidentType: incidentData,
        timestamp,
        location,
        tags,
        radius: 0.3
      });
      
      clusteredReports.push(report);
    }
  }
  
  console.log(`✅ ${clusteredReports.length} reportes en clusters generados`);
  return clusteredReports;
}

/**
 * Genera reportes normales sin correlación
 */
function generateNormalReports(count) {
  console.log(`\n📊 Generando ${count} reportes normales...`);
  
  const reports = [];
  const progressInterval = Math.floor(count / 10);
  
  for (let i = 0; i < count; i++) {
    reports.push(generateReport());
    
    if ((i + 1) % progressInterval === 0) {
      const percent = Math.round(((i + 1) / count) * 100);
      console.log(`  Progreso: ${percent}% (${i + 1}/${count})`);
    }
  }
  
  console.log(`✅ ${reports.length} reportes normales generados`);
  return reports;
}

/**
 * Inserta reportes en lotes con barra de progreso
 */
async function insertInBatches(reports) {
  console.log(`\n💾 Insertando ${reports.length} reportes en lotes de ${CONFIG.BATCH_SIZE}...`);
  
  const batches = [];
  for (let i = 0; i < reports.length; i += CONFIG.BATCH_SIZE) {
    batches.push(reports.slice(i, i + CONFIG.BATCH_SIZE));
  }
  
  let inserted = 0;
  
  for (let i = 0; i < batches.length; i++) {
    try {
      await Report.insertMany(batches[i], { ordered: false });
      inserted += batches[i].length;
      
      const percent = Math.round((inserted / reports.length) * 100);
      console.log(`  Lote ${i + 1}/${batches.length}: ${percent}% (${inserted}/${reports.length})`);
    } catch (error) {
      console.error(`  ⚠️  Error en lote ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Inserción completada: ${inserted} reportes`);
  return inserted;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

async function runDemoSeed() {
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('🌱 SEED DEMO - Generador de Datos de Demostración');
    console.log('═'.repeat(70));
    console.log(`📊 Configuración:`);
    console.log(`   - Total reportes: ${CONFIG.TOTAL_REPORTS.toLocaleString()}`);
    console.log(`   - Clusters: ${CONFIG.CLUSTER_COUNT}`);
    console.log(`   - Tamaño clusters: ${CONFIG.CLUSTER_SIZE_MIN}-${CONFIG.CLUSTER_SIZE_MAX} reportes`);
    console.log(`   - Período: últimos ${CONFIG.TIME_RANGE_MONTHS} meses`);
    console.log(`   - Limpiar existentes: ${CONFIG.CLEAR_EXISTING ? 'Sí' : 'No'}`);
    console.log('═'.repeat(70));
    
    // Limpiar reportes existentes si está configurado
    if (CONFIG.CLEAR_EXISTING) {
      console.log('\n🗑️  Limpiando reportes existentes...');
      const deleted = await Report.deleteMany({});
      console.log(`✅ ${deleted.deletedCount} reportes eliminados`);
    }
    
    // Calcular distribución
    const avgClusterSize = (CONFIG.CLUSTER_SIZE_MIN + CONFIG.CLUSTER_SIZE_MAX) / 2;
    const clusterReportsCount = Math.floor(CONFIG.CLUSTER_COUNT * avgClusterSize);
    const normalReportsCount = CONFIG.TOTAL_REPORTS - clusterReportsCount;
    
    console.log(`\n📈 Distribución:`);
    console.log(`   - Reportes en clusters: ${clusterReportsCount.toLocaleString()}`);
    console.log(`   - Reportes normales: ${normalReportsCount.toLocaleString()}`);
    
    // Generar reportes
    const startTime = Date.now();
    
    const clusteredReports = generateClusteredReports();
    const normalReports = generateNormalReports(normalReportsCount);
    
    // Mezclar reportes para distribución aleatoria
    const allReports = [...clusteredReports, ...normalReports];
    
    // Shuffle array
    for (let i = allReports.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allReports[i], allReports[j]] = [allReports[j], allReports[i]];
    }
    
    // Insertar en base de datos
    const inserted = await insertInBatches(allReports);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(70));
    console.log('✨ SEED DEMO COMPLETADO');
    console.log('═'.repeat(70));
    console.log(`📊 Estadísticas:`);
    console.log(`   - Reportes insertados: ${inserted.toLocaleString()}`);
    console.log(`   - Tiempo total: ${duration}s`);
    console.log(`   - Velocidad: ${Math.round(inserted / duration)} reportes/s`);
    console.log('═'.repeat(70));
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Accede al dashboard de analytics');
    console.log('   2. Explora las visualizaciones y estadísticas');
    console.log('   3. Prueba la detección de clusters con:');
    console.log('      - Tags coincidentes ≥ 2');
    console.log('      - Radio = 500m');
    console.log('      - Ventana temporal = 2h');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error en seed demo:', error);
    throw error;
  }
}

module.exports = { runDemoSeed };

