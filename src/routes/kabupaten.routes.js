const express = require("express");
const multer = require("multer");
const { importKabupatenController, getAllKabupatenController, getKabupatenByCodeController } = require("../controller/kabupaten.controller");

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/gis/kabupaten/import", upload.single("file"), importKabupatenController)
router.get("/gis/kabupaten/get-all", getAllKabupatenController);
router.get("/gis/kabupaten/detail/detail/:code", getKabupatenByCodeController);

module.exports = router;
