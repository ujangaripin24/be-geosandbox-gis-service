const { body } = require("express-validator");

const CreateGeometryProjectValidation = [
  body("uuid_project_geo")
    .notEmpty()
    .withMessage("UUID project geo tidak boleh kosong")
    .isUUID(4)
    .withMessage("UUID project geo harus berupa UUIDv4 yang valid"),
  body("name")
    .optional()
    .isString()
    .withMessage("Nama geometri harus berupa string"),
  body("detail")
    .optional()
    .isString()
    .withMessage("Detail geometri harus berupa string"),
];

const UpdateGeometryProjectValidation = [
  body("name")
    .optional()
    .isString()
    .withMessage("Nama geometri harus berupa string"),
  body("detail")
    .optional()
    .isString()
    .withMessage("Detail geometri harus berupa string"),
];

module.exports = {
  CreateGeometryProjectValidation,
  UpdateGeometryProjectValidation,
};
