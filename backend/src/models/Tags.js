const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema({
  canonical_name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  normal_name: {
    type: String,
  },

  aliases: [
    {
      type: String,
      lowercase: true,
      trim: true,
    },
  ],

  type: {
    type: String,
    enum: ["vehiculo", "persona", "ambiente", "otros"],
    required: true,
  },
});

/* =========================
   INDEXES
========================= */

TagSchema.index(
  {
    canonical_name: 1,
  },
  {
    unique: true,
  },
);

TagSchema.index({
  aliases: 1,
});

TagSchema.index({
  type: 1,
});

/* =========================
   EXPORT
========================= */

module.exports = mongoose.model("Tag", TagSchema);
