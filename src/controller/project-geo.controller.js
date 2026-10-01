const { validationResult } = require("express-validator");
const { formatError } = require("../pkg/error-formatter.pkg");
const {
  CreateProjectGeoService,
  GetAllProjectGeoService,
  GetDetailProjectGeoService,
  UpdateProjectGeoService,
  DeleteProjectGeoService,
} = require("../service/project-geo.service");

const CreateProjectGeoController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const uuid_user = req.user.uuid;
    const { name, detail, uuid_folder, kode_provinsi, kode_kabupaten } = req.body;

    const data = await CreateProjectGeoService({
      name,
      detail,
      uuid_folder,
      uuid_user,
      kode_provinsi,
      kode_kabupaten,
    });

    return res.status(201).json({
      message: "Project geo berhasil dibuat",
      status: 201,
      data,
    });
  } catch (error) {
    console.error("Error in CreateProjectGeoController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "validation"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetAllProjectGeoController = async (req, res) => {
  try {
    const { page, size, search, uuid_folder } = req.query;
    const uuid_user = req.user.uuid;

    const data = await GetAllProjectGeoService({
      page,
      size,
      search,
      uuid_folder,
      uuid_user,
    });

    return res.status(200).json({
      message: "Berhasil mengambil data project geo",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in GetAllProjectGeoController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetDetailProjectGeoController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await GetDetailProjectGeoService(uuid, uuid_user);

    return res.status(200).json({
      message: "Berhasil mengambil detail project geo",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in GetDetailProjectGeoController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const UpdateProjectGeoController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;
    const { name, detail, kode_provinsi, kode_kabupaten } = req.body;

    const data = await UpdateProjectGeoService(
      uuid,
      { name, detail, kode_provinsi, kode_kabupaten },
      uuid_user
    );

    return res.status(200).json({
      message: "Project geo berhasil diperbarui",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in UpdateProjectGeoController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    if (error.message.includes("tidak memiliki akses")) {
      return res.status(403).json(formatError(error.message, "forbidden"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const DeleteProjectGeoController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await DeleteProjectGeoService(uuid, uuid_user);

    return res.status(200).json({
      message: "Project geo berhasil dihapus",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DeleteProjectGeoController:", error.message);
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
  CreateProjectGeoController,
  GetAllProjectGeoController,
  GetDetailProjectGeoController,
  UpdateProjectGeoController,
  DeleteProjectGeoController,
};
