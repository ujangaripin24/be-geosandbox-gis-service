const express = require("express");
const {
  getKecamatanByProvinsiController,
} = require("../controller/selected-area.controller");

const router = express.Router();

router.get(
  "/gis/selected-area/kecamatan/:kode_provinsi",
  getKecamatanByProvinsiController,
);

module.exports = router;