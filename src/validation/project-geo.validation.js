const { body } = require("express-validator");

const CreateProjectGeoValidation = [
  body("name")
    .notEmpty()
    .withMessage("Nama proyek tidak boleh kosong")
    .isString()
    .withMessage("Nama proyek harus berupa string"),
  body("detail")
    .optional()
    .isString()
    .withMessage("Detail proyek harus berupa string"),
  body("uuid_folder")
    .notEmpty()
    .withMessage("UUID folder project tidak boleh kosong")
    .isUUID(4)
    .withMessage("UUID folder project harus berupa UUIDv4 yang valid"),
  body("kode_provinsi")
    .notEmpty()
    .withMessage("Kode provinsi tidak boleh kosong"),
  body("kode_kabupaten")
    .notEmpty()
    .withMessage("Kode kabupaten/kota tidak boleh kosong"),
];

const UpdateProjectGeoValidation = [
  body("name")
    .notEmpty()
    .withMessage("Nama proyek tidak boleh kosong")
    .isString()
    .withMessage("Nama proyek harus berupa string"),
  body("detail")
    .optional()
    .isString()
    .withMessage("Detail proyek harus berupa string"),
  body("kode_provinsi")
    .optional()
    .notEmpty()
    .withMessage("Kode provinsi tidak boleh kosong jika diisi"),
  body("kode_kabupaten")
    .optional()
    .notEmpty()
    .withMessage("Kode kabupaten/kota tidak boleh kosong jika diisi"),
];

module.exports = {
  CreateProjectGeoValidation,
  UpdateProjectGeoValidation,
};
