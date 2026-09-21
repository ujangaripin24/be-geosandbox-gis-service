const express = require("express");
const {
  getKabupatenByProvinsiController,
  getKabupatenByProvinsiAreaController,
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

module.exports = router;