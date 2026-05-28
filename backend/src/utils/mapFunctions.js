const express = require("express");
const router = express.Router();

router.get("/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;
  console.log("Reverse geocoding:", lat, lng);

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "ReportingAppforUniversity/0.1 (contact: mdelgadomoina@uade.edu.ar)",
        Accept: "application/json",
      },
    });

    // If Nominatim failed
    if (!response.ok) {
      const errorText = await response.text();

      console.error("Nominatim error:", errorText);

      return res.status(503).json({
        success: false,
        error: "Geocoding service unavailable",
      });
    }

    const data = await response.json();

    // Send result to frontend
    return res.json({
      success: true,
      street: data.display_name,
    });
  } catch (error) {
    console.error("Reverse geocoding failed:", error);

    return res.status(500).json({
      success: false,
      error: "Internal geocoding error",
    });
  }
});

router.get(
  "/resolve-address",
  async (req, res) => {

    const { lat, lng } = req.query;

    try {

      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?format=jsonv2&lat=${lat}&lon=${lng}`;

      const response = await fetch(url, {

        headers: {

          "User-Agent":
            "ReportingAppforUniversity/0.1 (contact: mdelgadomoina@uade.edu.ar)",

          Accept: "application/json",
        },
      });

      if (!response.ok) {

        return res.status(503).json({

          success: false,

          error:
            "Geocoding service unavailable",
        });
      }

      const data = await response.json();

      return res.json({

        success: true,

        address:
          data.display_name || "",
      });

    } catch (error) {

      console.error(
        "Resolve address failed:",
        error
      );

      return res.status(500).json({

        success: false,

        error:
          "Internal geocoding error",
      });
    }
  }
);

module.exports = router;
