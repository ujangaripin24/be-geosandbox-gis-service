const express = require("express");
const { validationResult } = require("express-validator");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");
const {
  CreateFolderProjectValidation,
  UpdateFolderProjectValidation,
} = require("../validation/folder-project.validation");
const {
  CreateFolderProjectController,
  GetAllFolderProjectController,
  GetDetailFolderProjectController,
  UpdateFolderProjectController,
  DeleteFolderProjectController,
} = require("../controller/folder-project.controller");

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/gis/folder-project/create",
  authenticateTokenGuard,
  CreateFolderProjectValidation,
  handleValidation,
  CreateFolderProjectController
);

router.get(
  "/gis/folder-project/get-all",
  authenticateTokenGuard,
  GetAllFolderProjectController
);

router.get(
  "/gis/folder-project/get/:uuid",
  authenticateTokenGuard,
  GetDetailFolderProjectController
);

router.put(
  "/gis/folder-project/update/:uuid",
  authenticateTokenGuard,
  UpdateFolderProjectValidation,
  handleValidation,
  UpdateFolderProjectController
);

router.delete(
  "/gis/folder-project/delete/:uuid",
  authenticateTokenGuard,
  DeleteFolderProjectController
);

module.exports = router;