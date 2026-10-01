const { validationResult } = require("express-validator");
const { formatError } = require("../pkg/error-formatter.pkg");
const {
  CreateFolderProjectService,
  GetAllFolderProjectService,
  GetDetailFolderProjectService,
  UpdateFolderProjectService,
  DeleteFolderProjectService,
} = require("../service/folder-project.service");

const CreateFolderProjectController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const uuid_user = req.user.uuid;
    const { name, detail } = req.body;

    const data = await CreateFolderProjectService({
      name,
      detail,
      uuid_user,
    });

    return res.status(201).json({
      message: "Folder project berhasil dibuat",
      status: 201,
      data,
    });
  } catch (error) {
    console.error("Error in CreateFolderProjectController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetAllFolderProjectController = async (req, res) => {
  try {
    const { page, size, search, user_only } = req.query;
    let uuid_user = null;

    if (user_only === "true" || user_only === "1") {
      uuid_user = req.user?.uuid || null;
    }

    const data = await GetAllFolderProjectService({
      page,
      size,
      search,
      uuid_user,
    });

    return res.status(200).json({
      message: "Berhasil mengambil data folder project",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in GetAllFolderProjectController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetDetailFolderProjectController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const data = await GetDetailFolderProjectService(uuid);

    return res.status(200).json({
      message: "Berhasil mengambil detail folder project",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in GetDetailFolderProjectController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const UpdateFolderProjectController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;
    const { name, detail } = req.body;

    const data = await UpdateFolderProjectService(
      uuid,
      { name, detail },
      uuid_user
    );

    return res.status(200).json({
      message: "Folder project berhasil diperbarui",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in UpdateFolderProjectController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const DeleteFolderProjectController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await DeleteFolderProjectService(uuid, uuid_user);

    return res.status(200).json({
      message: "Folder project berhasil dihapus",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DeleteFolderProjectController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

module.exports = {
  CreateFolderProjectController,
  GetAllFolderProjectController,
  GetDetailFolderProjectController,
  UpdateFolderProjectController,
  DeleteFolderProjectController,
};