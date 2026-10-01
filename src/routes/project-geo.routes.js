const express = require("express");
const { validationResult } = require("express-validator");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");
const {
    CreateProjectGeoValidation,
    UpdateProjectGeoValidation,
} = require("../validation/project-geo.validation");
const {
    CreateProjectGeoController,
    GetAllProjectGeoController,
    GetDetailProjectGeoController,
    UpdateProjectGeoController,
    DeleteProjectGeoController,
} = require("../controller/project-geo.controller");

const router = express.Router();

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.post(
    "/gis/project-geo/create",
    authenticateTokenGuard,
    CreateProjectGeoValidation,
    handleValidation,
    CreateProjectGeoController
);

router.get(
    "/gis/project-geo/get-all",
    authenticateTokenGuard,
    GetAllProjectGeoController
);

router.get(
    "/gis/project-geo/get/:uuid",
    authenticateTokenGuard,
    GetDetailProjectGeoController
);

router.put(
    "/gis/project-geo/update/:uuid",
    authenticateTokenGuard,
    UpdateProjectGeoValidation,
    handleValidation,
    UpdateProjectGeoController
);

router.delete(
    "/gis/project-geo/delete/:uuid",
    authenticateTokenGuard,
    DeleteProjectGeoController
);

module.exports = router;
