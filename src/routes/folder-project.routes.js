const express = require("express");
const { CreateFolderProjectController } = require("../controller/folder-project.controller");
const { authenticateTokenGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/gis/folder-project/create", authenticateTokenGuard, CreateFolderProjectController);

module.exports = router;