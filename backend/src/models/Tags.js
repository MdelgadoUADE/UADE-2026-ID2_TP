const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
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

    description: {
      type: String,
      default: "",
    },

    created_by: {
      user_id: {
        type: String,
      },

      username: {
        type: String,
      },
    },

    is_system: {
      type: Boolean,
      default: false,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    usage_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

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
