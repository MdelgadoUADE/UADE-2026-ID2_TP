const reportitDb = db.getSiblingDB('reportit_db');

reportitDb.createCollection('reports');

reportitDb.reports.insertMany([
  {
    user: {
      user_id: "68111aa2c8f8d2a001000101",
      username: "juan.perez",
      surname: "Perez",
      email: "juan.perez@gmail.com"
    },
    timestamp: new Date("2026-05-12T22:14:00Z"),
    notes: "Vehículo sospechoso estacionado hace más de 2 horas frente al edificio.",
    attachments: [
      "att_9f8a12",
      "att_4be772"
    ],
    tags: {
      vehicle: {
        color: "negro",
        model: "Toyota Corolla",
        license_plate: "AF123XY"
      }
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3702, -34.6037]
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.91
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000102",
      username: "maria.lopez",
      surname: "Lopez",
      email: "maria.lopez@gmail.com"
    },
    timestamp: new Date("2026-05-12T22:27:00Z"),
    notes: "Persona merodeando vehículos en el estacionamiento.",
    attachments: [
      "att_73ad91"
    ],
    tags: {
      actor: {
        hair_color: "castaño",
        skin_color: "clara",
        age: 32,
        height: 1.78,
        gender: "male"
      },
      persona_color_ropa: "gris"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3699, -34.6034]
    },
    status: "active",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.77
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000103",
      username: "carlos.ramirez",
      surname: "Ramirez",
      email: "carlos.ramirez@gmail.com"
    },
    timestamp: new Date("2026-05-11T18:42:00Z"),
    notes: "Choque menor entre dos vehículos, sin heridos.",
    attachments: [
      "att_ff81aa",
      "att_cc8821",
      "att_998abc"
    ],
    tags: {
      vehicle: {
        color: "blanco",
        model: "Ford Focus",
        license_plate: "AC456TR"
      },
      auto_color: "blanco"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3816, -34.6039]
    },
    status: "resolved",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.96
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000104",
      username: "anon-user-77",
      surname: "-",
      email: "hidden@anonymous.com"
    },
    timestamp: new Date("2026-05-10T03:11:00Z"),
    notes: "Grupo de personas discutiendo agresivamente en la calle.",
    attachments: [],
    tags: {
      actor: {
        hair_color: "negro",
        skin_color: "morena",
        age: 25,
        height: 1.70,
        gender: "female"
      },
      persona_sexo: "female"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3745, -34.6012]
    },
    status: "archived",
    is_anonymous: true,
    related_reports: [],
    trust_score: 0.54
  },

  {
    user: {
      user_id: "68111aa2c8f8d2a001000105",
      username: "lucia.mendez",
      surname: "Mendez",
      email: "lucia.mendez@gmail.com"
    },
    timestamp: new Date("2026-05-13T00:08:00Z"),
    notes: "Mismo vehículo negro visto circulando lentamente varias veces.",
    attachments: [
      "att_001abc"
    ],
    tags: {
      vehicle: {
        color: "negro",
        model: "Toyota Corolla",
        license_plate: "AF123XY"
      },
      auto_patente: "AF123XY"
    },
    report_location: {
      type: "Point",
      coordinates: [-58.3710, -34.6041]
    },
    status: "active",
    is_anonymous: false,
    related_reports: [],
    trust_score: 0.88
  }
]);

reportitDb.reports.createIndex({
  report_location: "2dsphere"
});