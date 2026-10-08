const express = require("express");
const {
  getKabupatenByProvinsiController,
  getKabupatenByProvinsiAreaController,
  getSelectedAreaPointerController,
} = require("../controller/selected-area.controller");
const { version } = require("../../package.json");

const router = express.Router();

router.get("/gis/health", (req, res) => {
  res.status(200).json({
    status: 200,
    versionApp: version,
    message: "[SERVICE-USER] Server Berhasil Berjalan",
    date: new Date().toISOString().replace("T", " ").substring(0, 19),
  });
});

router.get(
  "/gis/selected-area/kecamatan/:kode_provinsi",
  getKabupatenByProvinsiController,
);

router.get(
  "/gis/selected-area/kecamatan-area/:kode_provinsi",
  getKabupatenByProvinsiAreaController,
);

router.get("/gis/selected-area/points/bbox", getSelectedAreaPointerController);

module.exports = router;
