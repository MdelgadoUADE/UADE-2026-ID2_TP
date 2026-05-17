const mongoose = require("mongoose");

const reportTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  slug: {
    type: String,
    required: true,
    unique: true,
  },

  requiredFields: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("ReportType", reportTypeSchema);
// lelelele mans lelelele lelelele lemans noche canallaaa
