const express = require("express");
const { validationResult } = require("express-validator");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");
const {
  CreateMultiGeomValidation,
  UpdateMultiGeomValidation,
} = require("../validation/multi-geom.validation");
const {
  CreateMultiGeomController,
  GetAllMultiGeomController,
  GetDetailMultiGeomController,
  UpdateMultiGeomController,
  DeleteMultiGeomController,
} = require("../controller/multi-geom.controller");

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// CREATE
router.post(
  ["/gis/multi-geom/create", "/gis/multi-geom/add", "/gis/multi-geom"],
  authenticateTokenGuard,
  CreateMultiGeomValidation,
  handleValidation,
  CreateMultiGeomController,
);

// READ ALL (GeoJSON FeatureCollection)
router.get(
  ["/gis/multi-geom/get-all", "/gis/multi-geom/all", "/gis/multi-geom"],
  GetAllMultiGeomController,
);

// READ DETAIL (GeoJSON Feature)
router.get(
  ["/gis/multi-geom/get/:uuid", "/gis/multi-geom/:uuid"],
  GetDetailMultiGeomController,
);

// UPDATE
router.put(
  ["/gis/multi-geom/update/:uuid", "/gis/multi-geom/:uuid"],
  authenticateTokenGuard,
  UpdateMultiGeomValidation,
  handleValidation,
  UpdateMultiGeomController,
);

// DELETE
router.delete(
  ["/gis/multi-geom/delete/:uuid", "/gis/multi-geom/:uuid"],
  authenticateTokenGuard,
  DeleteMultiGeomController,
);

module.exports = router;
