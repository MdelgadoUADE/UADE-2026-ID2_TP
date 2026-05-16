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
      }
    },

    status: {
      type: String,
      enum: ['active', 'resolved', 'archived'],
      default: 'active'
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