const express = require("express");
const cors = require("cors");
const connectMongo = require("./config/mongo");
const { connectPostgres } = require("./config/postgres");
const { runSeed } = require("./config/seed"); // script para mock data en DB

const reportsRoutes = require("./routes/reports");
const reportTags = require("./routes/tags");
const mapFunctions = require("./utils/mapFunctions");
const authRoutes = require("./routes/auth");
const filesRoutes = require("./routes/files");
const whisperRoutes = require("./routes/whisper");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/reports", reportsRoutes);
app.use("/map", mapFunctions);
app.use("/tags", reportTags);
app.use("/auth", authRoutes);
app.use("/files", filesRoutes);
app.use("/api/whisper", whisperRoutes);

const PORT = 3000;

async function startServer() {
  await connectMongo();
  await connectPostgres();
  await runSeed();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

/*const express = require("express");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb://mongo:27017/test")
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});*/
