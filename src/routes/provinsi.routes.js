const express = require("express");
const multer = require("multer");
const { importProvinsiController } = require("../controller/provinsi.controller");

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/gis/provinsi/import", upload.single("file"), importProvinsiController);

module.exports = router;
