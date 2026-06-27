const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const router = express.Router();

/**
 * POST /api/whisper/transcribe
 * Streams the multipart/form-data request directly to the Whisper container.
 */
router.post(
  "/transcribe",
  createProxyMiddleware({
    // The destination container
    target: process.env.WHISPER_API_URL || "http://whisper:9000",
    changeOrigin: true,

    // Rewrite the URL so /api/whisper/transcribe becomes /asr?output=txt
    pathRewrite: {
      "^/api/whisper/transcribe": "/asr?output=txt",
    },

    // Optional: Log errors if the Whisper container is down
    onError: (err, req, res) => {
      console.error("Whisper Proxy Error:", err.message);
      res.status(500).json({ error: "Failed to reach transcription service." });
    },
  }),
);

module.exports = router;
