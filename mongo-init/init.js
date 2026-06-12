const reportitDb = db.getSiblingDB("reportit_db");

reportitDb.createCollection("reports");

reportitDb.reports.insertMany([
  {
    user: {
      user_id: "68111aa2c8f8d2a001000101",
      username: "juan.perez",
      surname: "Perez",
      email: "juan.perez@gmail.com",
    },
    timestamp: new Date("2026-05-12T22:14:00Z"),
    notes:
      "Vehículo sospechoso estacionado hace más de 2 horas frente al edificio.",
    attachments: ["att_9f8a12", "att_4be772"],
    tags: {
      vehicle: {
        color: "negro",
        model: "Toyota Corolla",
        license_plate: "AF123XY",
      },
    },

    report_location: {
      type: "Point",
      coordinates: [-58.3816, -34.6186],
      address: "Lima 757, Monserrat, Buenos Aires",
    },

    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.91,
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000102",
      username: "maria.lopez",
      surname: "Lopez",
      email: "maria.lopez@gmail.com",
    },
    timestamp: new Date("2026-05-12T22:27:00Z"),
    notes: "Persona merodeando vehículos en el estacionamiento.",
    attachments: ["att_73ad91"],
    tags: {
      actor: {
        hair_color: "castaño",
        skin_color: "clara",
        age: 32,
        height: 1.78,
        gender: "male",
      },
      persona_color_ropa: "gris",
    },

    report_location: {
      type: "Point",
      coordinates: [-58.3824, -34.6191],
      address: "Av. Independencia 1200, Monserrat, Buenos Aires",
    },

    status: "active",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.77,
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000103",
      username: "carlos.ramirez",
      surname: "Ramirez",
      email: "carlos.ramirez@gmail.com",
    },
    timestamp: new Date("2026-05-11T18:42:00Z"),
    notes: "Choque menor entre dos vehículos, sin heridos.",
    attachments: ["att_ff81aa", "att_cc8821", "att_998abc"],
    tags: {
      vehicle: {
        color: "blanco",
        model: "Ford Focus",
        license_plate: "AC456TR",
      },
      auto_color: "blanco",
    },
    report_location: {
      type: "Point",
      coordinates: [-64.1888, -31.4201],
      address: "Av. Colón 550, Córdoba Capital",
    },
    status: "resolved",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.96,
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000104",
      username: "anon-user-77",
      surname: "-",
      email: "hidden@anonymous.com",
    },
    timestamp: new Date("2026-05-10T03:11:00Z"),
    notes: "Grupo de personas discutiendo agresivamente en la calle.",
    attachments: [],
    tags: {
      actor: {
        hair_color: "negro",
        skin_color: "morena",
        age: 25,
        height: 1.7,
        gender: "female",
      },
      persona_sexo: "female",
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3808, -34.6179],
      address: "Salta 800, Monserrat, Buenos Aires",
    },
    status: "archived",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.54,
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000105",
      username: "lucia.mendez",
      surname: "Mendez",
      email: "lucia.mendez@gmail.com",
    },
    timestamp: new Date("2026-05-13T00:08:00Z"),
    notes: "Mismo vehículo negro visto circulando lentamente varias veces.",
    attachments: ["att_001abc"],
    tags: {
      vehicle: {
        color: "negro",
        model: "Toyota Corolla",
        license_plate: "AF123XY",
      },
      auto_patente: "AF123XY",
    },
    report_location: {
      type: "Point",
      coordinates: [-64.1901, -31.421],
      address: "General Paz 320, Córdoba Capital",
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.88,
  },
]);

/* =========================
   TAGS
========================= */
reportitDb.createCollection("tags");

reportitDb.tags.insertMany([
  /* =========================
     VEHICULO
  ========================= */

  {
    canonical_name: "color_vehiculo",

    normal_name: "Color Vehiculo",

    aliases: [
      "color-vehiculo",
      "Color-Vehiculo",
      "vehicle-color",
      "auto-color",
      "color auto",
      "vehiculo color",
      "vehicle_color",
      "car-color",
    ],

    type: "vehiculo",
  },

  {
    canonical_name: "modelo_vehiculo",

    normal_name: "Modelo Vehiculo",

    aliases: [
      "modelo-vehiculo",
      "vehicle-model",
      "modelo auto",
      "modelo_auto",
      "car-model",
      "vehicle_model",
    ],

    type: "vehiculo",
  },

  {
    canonical_name: "patente_vehiculo",

    normal_name: "Patente Vehiculo",

    aliases: [
      "patente-auto",
      "patente vehiculo",
      "vehicle-plate",
      "license-plate",
      "matricula",
      "patente_auto",
    ],

    type: "vehiculo",
  },

  /* =========================
     ACTOR / PERSONA
  ========================= */

  {
    canonical_name: "pelo_color_actor",

    normal_name: "Color de Pelo",

    aliases: [
      "actor-hair-color",
      "hair-color",
      "color pelo",
      "hair_color_actor",
      "cabello-color",
      "pelo actor",
    ],

    type: "persona",
  },

  {
    canonical_name: "piel_color_actor",

    normal_name: "Color de Piel",

    aliases: [
      "actor-skin-color",
      "skin-color",
      "tono piel",
      "color piel",
      "skin_color_actor",
    ],

    type: "persona",
  },

  {
    canonical_name: "edad_actor",

    normal_name: "Edad",

    aliases: ["actor-age", "age", "edad persona", "persona edad", "actor_age"],

    type: "persona",
  },

  {
    canonical_name: "altura_actor",

    normal_name: "Altura",

    aliases: [
      "actor-height",
      "height",
      "altura persona",
      "persona altura",
      "actor_height",
    ],

    type: "persona",
  },

  {
    canonical_name: "genero_actor",

    normal_name: "Genero",

    aliases: ["actor-gender", "gender", "sexo", "sexo actor", "actor_gender"],

    type: "persona",
  },
]);

/* =========================
   INDEXES
========================= */

reportitDb.reports.createIndex({
  report_location: "2dsphere",
});

reportitDb.tags.createIndex(
  {
    canonical_name: 1,
  },
  {
    unique: true,
  },
);

reportitDb.tags.createIndex({
  aliases: 1,
});
