const express = require("express");
const multer = require("multer");
const { importKabupatenController } = require("../controller/kabupaten.controller");

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/gis/kabupaten/import", upload.single("file"), importKabupatenController)

module.exports = router;
