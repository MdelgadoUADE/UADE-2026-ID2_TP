const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    user: {
      user_id: String,
      username: String,
      surname: String,
      email: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    notes: String,

    attachments: [
      {
        original_name: String,
        file_name: String, // The UUID generated for S3
        mime_type: String, // Optional, but helpful for the future
      },
    ],

    tags: {
      type: mongoose.Schema.Types.Mixed,
    },

    report_location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },

      coordinates: {
        type: [Number],
        required: true,
      },

      address: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["active", "en_verificacion", "asignado", "resolved", "archived"],
      default: "active",
    },

    // RF_24: clasificación por criticidad
    criticidad: {
      type: String,
      enum: ["baja", "media", "alta", "critica", null],
      default: null,
    },

    // RF_24: clasificación por validez
    validez: {
      type: String,
      enum: ["pendiente", "valido", "falso", "dudoso"],
      default: "pendiente",
    },

    is_anonymous: Boolean,

    related_reports: [String],

    trust_score: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    trust_score_metadata: {
      calculated_at: Date,
      version: String,
      breakdown: {
        user_authentication: Number,
        report_completeness: Number,
        user_history: Number,
        related_reports: Number,
        time_consistency: Number,
      },
    },
  },
  {
    timestamps: true,
  },
);

ReportSchema.index({
  report_location: "2dsphere",
});

// Índices para optimizar consultas de trust score
ReportSchema.index({ trust_score: 1 });
ReportSchema.index({ "user.user_id": 1, timestamp: -1 });
ReportSchema.index({ validez: 1 });

module.exports = mongoose.model("Report", ReportSchema);
