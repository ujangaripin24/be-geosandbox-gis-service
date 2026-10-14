const { validationResult } = require("express-validator");
const { formatError } = require("../pkg/error-formatter.pkg");
const {
  CreateMultiGeomService,
  GetAllMultiGeomService,
  GetDetailMultiGeomService,
  UpdateMultiGeomService,
  DeleteMultiGeomService,
} = require("../service/multi-geom.service");

const CreateMultiGeomController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const uuid_user = req.user.uuid;
    const data = await CreateMultiGeomService({
      ...req.body,
      uuid_user,
    });

    return res.status(201).json({
      message: "Multi geometry berhasil disimpan",
      status: 201,
      data,
    });
  } catch (error) {
    console.error("Error in CreateMultiGeomController:", error.message);
    if (
      error.message.includes("tidak valid") ||
      error.message.includes("tidak memiliki properti")
    ) {
      return res.status(400).json(formatError(error.message, "geometry"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetAllMultiGeomController = async (req, res) => {
  try {
    const uuid_user =
      req.query.user_only === "true" ? req.user?.uuid : undefined;

    const data = await GetAllMultiGeomService({ uuid_user });

    return res.status(200).json({
      message: "Berhasil mengambil data multi geometry",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in GetAllMultiGeomController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const GetDetailMultiGeomController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const data = await GetDetailMultiGeomService(uuid);

    return res.status(200).json({
      message: "Berhasil mengambil detail multi geometry",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in GetDetailMultiGeomController:", error.message);
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "uuid"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const UpdateMultiGeomController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await UpdateMultiGeomService(uuid, req.body, uuid_user);

    return res.status(200).json({
      message: "Multi geometry berhasil diperbarui",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in UpdateMultiGeomController:", error.message);
    if (error.message.includes("tidak valid")) {
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

const DeleteMultiGeomController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user.uuid;

    const data = await DeleteMultiGeomService(uuid, uuid_user);

    return res.status(200).json({
      message: "Multi geometry berhasil dihapus",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DeleteMultiGeomController:", error.message);
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
  CreateMultiGeomController,
  GetAllMultiGeomController,
  GetDetailMultiGeomController,
  UpdateMultiGeomController,
  DeleteMultiGeomController,
};
