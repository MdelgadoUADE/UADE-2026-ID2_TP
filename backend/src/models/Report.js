const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    user: {
      user_id: String,
      username: String,
      surname: String,
      email: String
    },

    timestamp: {
      type: Date,
      default: Date.now
    },

    notes: String,

    attachments: [String],

    tags: {
      type: mongoose.Schema.Types.Mixed
    },

    report_location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },

      coordinates: {
        type: [Number],
        required: true
      },

      address: {
        type: String,
        default: ''
      }
    },

    status: {
      type: String,
      enum: ['active', 'resolved', 'archived'],
      default: 'active'
    },

    is_anonymous: Boolean,

    related_reports: [String],

    trust_score: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },

    // Campos para clasificación por analistas (RF_24)
    criticality: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    validity: {
      type: String,
      enum: ['pending', 'valid', 'invalid', 'duplicate'],
      default: 'pending'
    },

    analyst_notes: {
      type: String,
      default: ''
    },

    validated_by: {
      user_id: String,
      username: String,
      timestamp: Date
    },

    // Campo para clustering (RF_23)
    cluster_id: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Índices para optimizar consultas
ReportSchema.index({
  report_location: '2dsphere'
});

ReportSchema.index({
  status: 1,
  timestamp: -1
});

ReportSchema.index({
  trust_score: -1
});

ReportSchema.index({
  cluster_id: 1
});

ReportSchema.index({
  'user.user_id': 1,
  timestamp: -1
});

ReportSchema.index({
  validity: 1,
  criticality: 1
});

module.exports = mongoose.model('Report', ReportSchema);