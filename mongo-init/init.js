const reportitDb = db.getSiblingDB('reportit_db');

reportitDb.createCollection('reports');

reportitDb.reports.insertMany([
  // Cluster 1: Vehículo sospechoso en Monserrat (3 reportes relacionados)
  {
    user: {
      user_id: "68111aa2c8f8d2a001000101",
      username: "juan.perez",
      surname: "Perez",
      email: "juan.perez@gmail.com"
    },
    timestamp: new Date("2026-05-28T22:14:00Z"),
    notes: "Vehículo sospechoso estacionado hace más de 2 horas frente al edificio.",
    attachments: ["att_9f8a12", "att_4be772"],
    tags: {
      color_vehiculo: "negro",
      modelo_vehiculo: "Toyota Corolla",
      patente_vehiculo: "AF123XY"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3816, -34.6186],
      address: "Lima 757, Monserrat, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.91,
    criticality: "medium",
    validity: "pending"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000102",
      username: "maria.lopez",
      surname: "Lopez",
      email: "maria.lopez@gmail.com"
    },
    timestamp: new Date("2026-05-28T22:45:00Z"),
    notes: "Persona merodeando vehículos en el estacionamiento cerca de Lima.",
    attachments: ["att_73ad91"],
    tags: {
      color_vehiculo: "negro",
      pelo_color_actor: "castaño",
      genero_actor: "male"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3824, -34.6191],
      address: "Av. Independencia 1200, Monserrat, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.85,
    criticality: "high",
    validity: "pending"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000105",
      username: "lucia.mendez",
      surname: "Mendez",
      email: "lucia.mendez@gmail.com"
    },
    timestamp: new Date("2026-05-29T00:08:00Z"),
    notes: "Mismo vehículo negro visto circulando lentamente varias veces por la zona.",
    attachments: ["att_001abc"],
    tags: {
      color_vehiculo: "negro",
      modelo_vehiculo: "Toyota Corolla",
      patente_vehiculo: "AF123XY"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3810, -34.6180],
      address: "Salta 750, Monserrat, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.88,
    criticality: "high",
    validity: "pending"
  },

  // Cluster 2: Accidente de tránsito en Palermo (2 reportes)
  {
    user: {
      user_id: "68111aa2c8f8d2a001000103",
      username: "carlos.ramirez",
      surname: "Ramirez",
      email: "carlos.ramirez@gmail.com"
    },
    timestamp: new Date("2026-05-28T18:42:00Z"),
    notes: "Choque entre dos vehículos en Av. Santa Fe y Scalabrini Ortiz.",
    attachments: ["att_ff81aa", "att_cc8821"],
    tags: {
      color_vehiculo: "blanco",
      modelo_vehiculo: "Ford Focus"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.4200, -34.5950],
      address: "Av. Santa Fe 4500, Palermo, Buenos Aires"
    },
    status: "resolved",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.96,
    criticality: "medium",
    validity: "valid"
  },
  {
    user: {
      user_id: "user_anon_001",
      username: "anonymous",
      surname: "user",
      email: "anonymous@reportit.com"
    },
    timestamp: new Date("2026-05-28T18:50:00Z"),
    notes: "Tráfico detenido por accidente en Santa Fe.",
    attachments: [],
    tags: {
      color_vehiculo: "blanco"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.4205, -34.5948],
      address: "Av. Santa Fe 4520, Palermo, Buenos Aires"
    },
    status: "resolved",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.65,
    criticality: "low",
    validity: "valid"
  },

  // Reportes individuales variados
  {
    user: {
      user_id: "68111aa2c8f8d2a001000104",
      username: "anon-user-77",
      surname: "-",
      email: "hidden@anonymous.com"
    },
    timestamp: new Date("2026-05-27T03:11:00Z"),
    notes: "Grupo de personas discutiendo agresivamente en la calle.",
    attachments: [],
    tags: {
      pelo_color_actor: "negro",
      genero_actor: "female",
      edad_actor: "25"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3808, -34.6179],
      address: "Salta 800, Monserrat, Buenos Aires"
    },
    status: "archived",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.54,
    criticality: "low",
    validity: "invalid"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000106",
      username: "pedro.gomez",
      surname: "Gomez",
      email: "pedro.gomez@gmail.com"
    },
    timestamp: new Date("2026-05-29T14:30:00Z"),
    notes: "Motocicleta estacionada en la vereda bloqueando el paso.",
    attachments: ["att_moto01"],
    tags: {
      color_vehiculo: "rojo",
      modelo_vehiculo: "Honda"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3750, -34.6050],
      address: "Av. Corrientes 1500, San Nicolás, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.78,
    criticality: "low",
    validity: "pending"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000107",
      username: "ana.silva",
      surname: "Silva",
      email: "ana.silva@gmail.com"
    },
    timestamp: new Date("2026-05-29T16:15:00Z"),
    notes: "Persona vendiendo productos sin autorización en la plaza.",
    attachments: [],
    tags: {
      genero_actor: "male",
      edad_actor: "40"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3900, -34.6100],
      address: "Plaza de Mayo, Monserrat, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.72,
    criticality: "low",
    validity: "pending"
  },

  // Cluster 3: Robos en Recoleta (3 reportes cercanos)
  {
    user: {
      user_id: "68111aa2c8f8d2a001000108",
      username: "roberto.diaz",
      surname: "Diaz",
      email: "roberto.diaz@gmail.com"
    },
    timestamp: new Date("2026-05-29T10:20:00Z"),
    notes: "Intento de robo a transeúnte en Av. Alvear. Persona huyó en motocicleta.",
    attachments: ["att_rob01", "att_rob02"],
    tags: {
      color_vehiculo: "negro",
      modelo_vehiculo: "motocicleta",
      genero_actor: "male"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3850, -34.5920],
      address: "Av. Alvear 1800, Recoleta, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.92,
    criticality: "critical",
    validity: "pending"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000109",
      username: "sofia.martinez",
      surname: "Martinez",
      email: "sofia.martinez@gmail.com"
    },
    timestamp: new Date("2026-05-29T11:05:00Z"),
    notes: "Motocicleta negra circulando de manera sospechosa por la zona.",
    attachments: ["att_moto_susp"],
    tags: {
      color_vehiculo: "negro",
      modelo_vehiculo: "motocicleta"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3860, -34.5925],
      address: "Av. Quintana 500, Recoleta, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.80,
    criticality: "high",
    validity: "pending"
  },
  {
    user: {
      user_id: "user_anon_002",
      username: "anonymous",
      surname: "user",
      email: "anonymous@reportit.com"
    },
    timestamp: new Date("2026-05-29T11:30:00Z"),
    notes: "Vi dos personas en moto actuando de forma extraña.",
    attachments: [],
    tags: {
      color_vehiculo: "negro",
      genero_actor: "male"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3855, -34.5918],
      address: "Av. Alvear 1900, Recoleta, Buenos Aires"
    },
    status: "active",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.58,
    criticality: "high",
    validity: "pending"
  },

  // Reportes adicionales para variedad
  {
    user: {
      user_id: "68111aa2c8f8d2a001000110",
      username: "diego.fernandez",
      surname: "Fernandez",
      email: "diego.fernandez@gmail.com"
    },
    timestamp: new Date("2026-05-28T20:00:00Z"),
    notes: "Basura acumulada en la esquina hace varios días.",
    attachments: ["att_basura01"],
    tags: {
      tipo_incidente: "ambiente"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.4100, -34.6000],
      address: "Av. Callao 800, Balvanera, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.75,
    criticality: "low",
    validity: "pending"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000111",
      username: "valeria.ruiz",
      surname: "Ruiz",
      email: "valeria.ruiz@gmail.com"
    },
    timestamp: new Date("2026-05-29T08:45:00Z"),
    notes: "Semáforo en mal estado, luz roja no funciona correctamente.",
    attachments: [],
    tags: {
      tipo_incidente: "infraestructura"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3950, -34.6080],
      address: "Av. 9 de Julio y Av. Corrientes, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.82,
    criticality: "medium",
    validity: "pending"
  },
  {
    user: {
      user_id: "68111aa2c8f8d2a001000112",
      username: "martin.lopez",
      surname: "Lopez",
      email: "martin.lopez@gmail.com"
    },
    timestamp: new Date("2026-05-29T12:00:00Z"),
    notes: "Vehículo abandonado hace más de una semana en la calle.",
    attachments: ["att_auto_abandonado"],
    tags: {
      color_vehiculo: "gris",
      modelo_vehiculo: "Renault"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.4300, -34.6100],
      address: "Av. Rivadavia 5000, Caballito, Buenos Aires"
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.87,
    criticality: "low",
    validity: "pending"
  }
]);

/* =========================
   TAGS
========================= */
reportitDb.createCollection('tags');

reportitDb.tags.insertMany([

  /* =========================
     VEHICULO
  ========================= */

  {
    canonical_name: "color_vehiculo",

    aliases: [
      "color-vehiculo",
      "Color-Vehiculo",
      "vehicle-color",
      "auto-color",
      "color auto",
      "vehiculo color",
      "vehicle_color",
      "car-color"
    ],

    type: "vehiculo"
  },

  {
    canonical_name: "modelo_vehiculo",

    aliases: [
      "modelo-vehiculo",
      "vehicle-model",
      "modelo auto",
      "modelo_auto",
      "car-model",
      "vehicle_model"
    ],

    type: "vehiculo"
  },

  {
    canonical_name: "patente_vehiculo",

    aliases: [
      "patente-auto",
      "patente vehiculo",
      "vehicle-plate",
      "license-plate",
      "matricula",
      "patente_auto"
    ],

    type: "vehiculo"
  },

  /* =========================
     ACTOR / PERSONA
  ========================= */

  {
    canonical_name: "pelo_color_actor",

    aliases: [
      "actor-hair-color",
      "hair-color",
      "color pelo",
      "hair_color_actor",
      "cabello-color",
      "pelo actor"
    ],

    type: "persona"
  },

  {
    canonical_name: "piel_color_actor",

    aliases: [
      "actor-skin-color",
      "skin-color",
      "tono piel",
      "color piel",
      "skin_color_actor"
    ],

    type: "persona"
  },

  {
    canonical_name: "edad_actor",

    aliases: [
      "actor-age",
      "age",
      "edad persona",
      "persona edad",
      "actor_age"
    ],

    type: "persona"
  },

  {
    canonical_name: "altura_actor",

    aliases: [
      "actor-height",
      "height",
      "altura persona",
      "persona altura",
      "actor_height"
    ],

    type: "persona"
  },

  {
    canonical_name: "genero_actor",

    aliases: [
      "actor-gender",
      "gender",
      "sexo",
      "sexo actor",
      "actor_gender"
    ],

    type: "persona"
  }

]);

/* =========================
   INDEXES
========================= */

reportitDb.reports.createIndex({
  report_location: "2dsphere"
});

reportitDb.tags.createIndex({
  canonical_name: 1
}, {
  unique: true
});

reportitDb.tags.createIndex({
  aliases: 1
});
