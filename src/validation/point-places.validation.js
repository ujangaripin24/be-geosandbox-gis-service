const { body } = require("express-validator");

const CreatePlaceValidation = [
  body("name_place")
    .notEmpty()
    .withMessage("Nama tempat tidak boleh kosong"),
  body("kode_kabupaten")
    .notEmpty()
    .withMessage("Kode kabupaten tidak boleh kosong"),
  body("longitude")
    .notEmpty()
    .withMessage("Longitude tidak boleh kosong")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude harus berupa angka koordinat valid (-180 sampai 180)"),
  body("latitude")
    .notEmpty()
    .withMessage("Latitude tidak boleh kosong")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude harus berupa angka koordinat valid (-90 sampai 90)"),
];

module.exports = {
  CreatePlaceValidation,
};
