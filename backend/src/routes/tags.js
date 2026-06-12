const express = require("express");
const router = express.Router();

const Tag = require("../models/Tags");

function createNormalName(str) {
  return str
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find();

    res.json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Could not fetch tags",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { canonical_name, description, type = "otros" } = req.body;

    /* validar el nombre del tag */
    if (!canonical_name?.trim()) {
      return res.status(400).json({
        success: false,
        error: "canonical_name is required",
      });
    }

    /* Normalizar nombre */
    const normalizedName = canonical_name
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const normalName = createNormalName(normalizedName);

    /* revisar si existe */
    const existingTag = await Tag.findOne({
      canonical_name: normalizedName,
    });

    if (existingTag) {
      return res.json({
        success: true,
        tag: existingTag,
        alreadyExists: true,
      });
    }

    /* crear tag nuevo */
    const newTag = await Tag.create({
      canonical_name: normalizedName,
      normal_name: normalName,
      description: description || "",
      type,
    });

    return res.status(201).json({
      success: true,
      tag: newTag,
      alreadyExists: false,
    });
  } catch (error) {
    console.error(error);

    /* manejador de condicion de carrera 
     si el tag ya existe (dos usuarios hicieron click al mismo tiempo) entonces se devuelve el tag existente */
    if (error.code === 11000) {
      const existingTag = await Tag.findOne({
        canonical_name: req.body.canonical_name.trim().toLowerCase(),
      });

      return res.json({
        success: true,
        tag: existingTag,
        alreadyExists: true,
      });
    }

    res.status(500).json({
      success: false,
      error: "Could not create tag",
    });
  }
});

module.exports = router;
