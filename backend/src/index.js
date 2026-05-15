const express = require("express");
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
});