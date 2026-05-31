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
      enum: ['active', 'en_verificacion', 'asignado', 'resolved', 'archived'],
      default: 'active'
    },

    // RF_24: clasificación por criticidad
    criticidad: {
      type: String,
      enum: ['baja', 'media', 'alta', 'critica', null],
      default: null
    },

    // RF_24: clasificación por validez
    validez: {
      type: String,
      enum: ['pendiente', 'valido', 'falso', 'dudoso'],
      default: 'pendiente'
    },

    is_anonymous: Boolean,

    related_reports: [String],

    trust_score: Number
  },
  {
    timestamps: true
  }
);

ReportSchema.index({
  report_location: '2dsphere'
});

module.exports = mongoose.model('Report', ReportSchema);
