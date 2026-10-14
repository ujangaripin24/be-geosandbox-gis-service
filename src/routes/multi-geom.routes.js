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

router.post(
  ["/gis/multi-geom/create", "/gis/multi-geom/add", "/gis/multi-geom"],
  authenticateTokenGuard,
  CreateMultiGeomValidation,
  handleValidation,
  CreateMultiGeomController,
);

router.get(
  ["/gis/multi-geom/get-all", "/gis/multi-geom/all", "/gis/multi-geom"],
  GetAllMultiGeomController,
);

router.get(
  ["/gis/multi-geom/get/:uuid", "/gis/multi-geom/:uuid"],
  GetDetailMultiGeomController,
);

router.put(
  ["/gis/multi-geom/update/:uuid", "/gis/multi-geom/:uuid"],
  authenticateTokenGuard,
  UpdateMultiGeomValidation,
  handleValidation,
  UpdateMultiGeomController,
);

router.delete(
  ["/gis/multi-geom/delete/:uuid", "/gis/multi-geom/:uuid"],
  authenticateTokenGuard,
  DeleteMultiGeomController,
);

module.exports = router;
