const cors = require("cors");
const express = require("express");
const logger = require("morgan");
const dotenv = require("dotenv");
const helmet = require("helmet");
const createError = require("http-errors");
const messageBroker = require("./config/message-broker.config");
const database = require("./config/database.config");
const {listenUserUpdatedQueue } = require("./pkg/message-broker/user.subscriber");
const fs = require("fs");
const path = require("path");
const provinsiRouter = require("./routes/provinsi.routes");
const kabupatenRouter = require("./routes/kabupaten.routes");
const selectedAreaRouter = require("./routes/selected-area.routes");
const rustfsClient = require("./config/storage-s3.config");

dotenv.config();

let app = express();
// let accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'))
let dateNow = new Date().toISOString().replace("T", " ").substring(0, 19);

app.use(helmet());
app.use(cors());
app.use(logger("dev"));
// app.use(logger("combined", { stream: accessLogStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", provinsiRouter);
app.use("/api/v1", kabupatenRouter);
app.use("/api/v1", selectedAreaRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "[SERVICE-GIS] Server Berhasil Berjalan",
    date: dateNow,
  });
});

app.listen(process.env.APP_PORT, async () => {
  console.log(`[SERVICE-GIS] Server berjalan di port ${process.env.APP_PORT}`);
  try {
    await database.authenticate();
    await messageBroker.connectRabbitMQ();
    await rustfsClient.connectionStorageS3(); 
    await listenUserUpdatedQueue();
  } catch (error) {
    console.error("Unable to start server:");
    console.error(error.message);
    process.exit(1);
  }
});

module.exports = app;
