const express = require("express");
const { validationResult } = require("express-validator");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");
const { CreatePlaceValidation } = require("../validation/point-places.validation");
const { CreatePlaceController } = require("../controller/point-places.controller");

const router = express.Router();

router.post(
  "/gis/point/add",
  authenticateTokenGuard,
  CreatePlaceValidation,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      next();
    }
  },
  CreatePlaceController
);

module.exports = router;
