const express = require("express");
const {
  getKabupatenByProvinsiController,
} = require("../controller/selected-area.controller");

const router = express.Router();

router.get(
  "/gis/selected-area/kecamatan/:kode_provinsi",
  getKabupatenByProvinsiController,
);

module.exports = router;