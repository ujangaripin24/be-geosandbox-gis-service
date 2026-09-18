const express = require("express");
const multer = require("multer");
const { importProvinsiController, getProvinsiByCodeController, getProvinsiByNameController, getAllProvinsiController } = require("../controller/provinsi.controller");

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/gis/provinsi/import", upload.single("file"), importProvinsiController);
router.get("/gis/provinsi/get-all", getAllProvinsiController);
router.get("/gis/provinsi/:kode_provinsi", getProvinsiByCodeController);
router.get("/gis/provinsi/search", getProvinsiByNameController);

module.exports = router;
