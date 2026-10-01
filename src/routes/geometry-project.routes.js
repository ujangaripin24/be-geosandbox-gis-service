const express = require("express");
const { validationResult } = require("express-validator");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");
const {
  CreateGeometryProjectValidation,
  UpdateGeometryProjectValidation,
} = require("../validation/geometry-project.validation");
const {
  CreateGeometryProjectController,
  GetGeometriesByProjectController,
  GetDetailGeometryProjectController,
  UpdateGeometryProjectController,
  DeleteGeometryProjectController,
} = require("../controller/geometry-project.controller");

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/gis/geometry-project/add",
  authenticateTokenGuard,
  CreateGeometryProjectValidation,
  handleValidation,
  CreateGeometryProjectController
);

router.get(
  "/gis/geometry-project/project/:uuid_project_geo",
  authenticateTokenGuard,
  GetGeometriesByProjectController
);

router.get(
  "/gis/geometry-project/get/:uuid",
  authenticateTokenGuard,
  GetDetailGeometryProjectController
);

router.put(
  "/gis/geometry-project/update/:uuid",
  authenticateTokenGuard,
  UpdateGeometryProjectValidation,
  handleValidation,
  UpdateGeometryProjectController
);

router.delete(
  "/gis/geometry-project/delete/:uuid",
  authenticateTokenGuard,
  DeleteGeometryProjectController
);

module.exports = router;
