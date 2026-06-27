const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const router = express.Router();

router.post(
  "/transcribe",
  createProxyMiddleware({
    target: process.env.WHISPER_API_URL || "http://whisper:9000",
    changeOrigin: true,

    // Using a function ensures the path is ALWAYS overwritten correctly
    pathRewrite: (path, req) => "/asr?output=txt",

    // Add this to log the proxy attempt in your backend console
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Whisper Proxy] Forwarding request to: ${proxyReq.path}`);
    },

    onError: (err, req, res) => {
      console.error("[Whisper Proxy Error]:", err.message);
      res.status(500).json({ error: "Failed to reach transcription service." });
    },
  }),
);

module.exports = router;
