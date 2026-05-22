const express = require("express");
const cors = require("cors");
const connectMongo = require("./config/mongo");

const reportsRoutes = require("./routes/reports");
const reportTags = require("./routes/tags");
const mapFunctions = require("./utils/mapFunctions");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/reports", reportsRoutes);
app.use("/map", mapFunctions);
app.use("/tags", reportTags);

const PORT = 3000;

async function startServer() {
  await connectMongo();

  app.listen(PORT, () => {
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
  res.send("Backend funcionando 🚀");
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});*/
