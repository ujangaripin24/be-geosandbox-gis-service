const { validationResult } = require("express-validator");
const { formatError } = require("../pkg/error-formatter.pkg");
const {
  CreateGeometryProjectService,
  GetGeometriesByProjectService,
  GetDetailGeometryProjectService,
  UpdateGeometryProjectService,
  DeleteGeometryProjectService,
} = require("../service/geometry-project.service");

const CreateGeometryProjectController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const uuid_user = req.user.uuid;
    const body = req.body;

    const data = await CreateGeometryProjectService({
      ...body,
      uuid_user,
    });

    return res.status(201).json({
      message: "Geometri project berhasil disimpan",
      status: 201,
      data,
    });
  } catch (error) {
    console.error("Error in CreateGeometryProjectController:", error.message);
    if (error.message.includes("di luar batas wilayah")) {
      return res.status(400).json(formatError(error.message, "geometry"));
    }
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "validation"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetGeometriesByProjectController = async (req, res) => {
  try {
    const { uuid_project_geo } = req.params;
    const uuid_user = req.user.uuid;

    const data = await GetGeometriesByProjectService(
      uuid_project_geo,
      uuid_user
    );

    return res.status(200).json({
      message: "Berhasil mengambil data geometri project",
      status: 200,
      data,
    });
  } catch (error) {
    console.error(
      "Error in GetGeometriesByProjectController:",
      error.message
    );
    if (error.message.includes("tidak ditemukan")) {
      return res
        .status(404)
        .json(formatError(error.message, "uuid_project_geo"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetDetailGeometryProjectController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await GetDetailGeometryProjectService(uuid, uuid_user);

    return res.status(200).json({
      message: "Berhasil mengambil detail geometri project",
      status: 200,
      data,
    });
  } catch (error) {
    console.error(
      "Error in GetDetailGeometryProjectController:",
      error.message
    );
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const UpdateGeometryProjectController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await UpdateGeometryProjectService(
      uuid,
      req.body,
      uuid_user
    );

    return res.status(200).json({
      message: "Geometri project berhasil diperbarui",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in UpdateGeometryProjectController:", error.message);
    if (error.message.includes("di luar batas wilayah")) {
      return res.status(400).json(formatError(error.message, "geometry"));
    }
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const DeleteGeometryProjectController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await DeleteGeometryProjectService(uuid, uuid_user);

    return res.status(200).json({
      message: "Geometri project berhasil dihapus",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DeleteGeometryProjectController:", error.message);
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
  CreateGeometryProjectController,
  GetGeometriesByProjectController,
  GetDetailGeometryProjectController,
  UpdateGeometryProjectController,
  DeleteGeometryProjectController,
};
