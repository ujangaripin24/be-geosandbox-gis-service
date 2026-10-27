const express = require("express");
const multer = require("multer");
const { validationResult } = require("express-validator");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");
const {
  CreatePlaceValidation,
  UpdatePlaceValidation,
} = require("../validation/point-places.validation");
const {
  CreatePlaceController,
  GetAllPlaceController,
  UpdatePlaceController,
  SearchPlaceByNominatimController,
  DirectionOSRMController,
  DirectionOSRMTwoWayPointController,
  DirectionOSRMMultipleWayPointController,
  UploadCSVFilePointController,
} = require("../controller/point-places.controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10MB
});

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
  CreatePlaceController,
);

router.post(
  "/gis/point/upload-csv",
  authenticateTokenGuard,
  upload.single("file"),
  UploadCSVFilePointController,
);

router.get("/gis/point/get-all", GetAllPlaceController);
router.put(
  "/gis/point/update/:uuid",
  authenticateTokenGuard,
  UpdatePlaceValidation,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      next();
    }
  },
  UpdatePlaceController,
);

router.get("/gis/point/search-nominatim", SearchPlaceByNominatimController);
router.get("/gis/point/direction-osrm", DirectionOSRMController);
router.get(
  "/gis/point/direction-two-point",
  DirectionOSRMTwoWayPointController,
);
router.get(
  "/gis/point/direction-multiple-point",
  DirectionOSRMMultipleWayPointController,
);
router.post(
  "/gis/point/direction-multiple-point",
  DirectionOSRMMultipleWayPointController,
);

module.exports = router;
