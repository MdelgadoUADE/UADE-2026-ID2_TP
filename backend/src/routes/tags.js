const express = require("express");
const router = express.Router();

const ReportType = require("../models/Tags");

router.get("/", async (req, res) => {
  try {
    const reportTypes = await ReportType.find();

    res.json({
      success: true,
      reportTypes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Could not fetch report types",
    });
  }
});

module.exports = router;
