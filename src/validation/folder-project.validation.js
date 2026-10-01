const { body } = require("express-validator");

const CreateFolderProjectValidation = [
  body("name")
    .notEmpty()
    .withMessage("Nama folder project tidak boleh kosong")
    .isString()
    .withMessage("Nama folder project harus berupa string"),
  body("detail")
    .optional()
    .isString()
    .withMessage("Detail folder project harus berupa string"),
];

const UpdateFolderProjectValidation = [
  body("name")
    .notEmpty()
    .withMessage("Nama folder project tidak boleh kosong")
    .isString()
    .withMessage("Nama folder project harus berupa string"),
  body("detail")
    .optional()
    .isString()
    .withMessage("Detail folder project harus berupa string"),
];

module.exports = {
  CreateFolderProjectValidation,
  UpdateFolderProjectValidation,
};
