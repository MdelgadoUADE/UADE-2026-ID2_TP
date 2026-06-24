const express = require("express");
const router = express.Router();
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

// Inicializacion de S3 y MinIO
const s3Client = new S3Client({
  region: "us-east-1", // region dummy
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  endpoint: `http://localhost:9000`,
  forcePathStyle: true, // CRITICO: Necesario para MinIO
});

//nombre de balde donde dejamos los archivos
const BUCKET_NAME = "media-uploads";

// POST /files/upload-url
router.post("/upload-url", async (req, res) => {
  try {
    const { contentType, originalName } = req.body;

    // genera un nombre unico para que los archivos no se sobreescriban
    const fileExtension = originalName.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType, // ej, 'video/mp4', 'image/jpeg', 'audio/mpeg'
    });

    // Crea un URL que expira en 1 hora
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.json({
      uploadUrl,
      fileName: uniqueFileName,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// GET /files/download-url/:fileName
router.get("/download-url/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
});

module.exports = router;
