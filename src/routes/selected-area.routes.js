const express = require("express");
const {
  getKabupatenByProvinsiController,
  getKabupatenByProvinsiAreaController,
  getSelectedAreaPointerController,
} = require("../controller/selected-area.controller");

const router = express.Router();

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
