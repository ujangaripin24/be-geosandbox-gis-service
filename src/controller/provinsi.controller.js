const { formatError } = require("../pkg/error-formatter.pkg");
const {
  importProvinsi,
  getAllProvinsi,
  getProvinsiByCode,
  getProvinsiByName,
} = require("../service/provinsi.service");

const importProvinsiController = async (req, res) => {
  try {
    let document = req.body;

    if (req.file) {
      document = JSON.parse(req.file.buffer.toString("utf8"));
    }

    const result = await importProvinsi(document, {
      replace: req.query.replace === "true",
    });

    return res.status(200).json({
      message: "Data provinsi berhasil diimport",
      data: result,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const getAllProvinsiController = async (req, res) => {
  try {
    const { page, size, search } = req.query;
    const result = await getAllProvinsi({ page, size, search });
    return res.status(200).json({
      message: "Data provinsi berhasil diambil",
      data: result,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const getProvinsiByCodeController = async (req, res) => {
  try {
    const { kode_provinsi } = req.params;
    const result = await getProvinsiByCode(kode_provinsi);
    if (!result) {
      return res.status(404).json({
        message: `Provinsi dengan kode ${kode_provinsi} tidak ditemukan`,
      });
    }
    return res.status(200).json({
      message: "Data provinsi berhasil diambil",
      data: result,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const getProvinsiByNameController = async (req, res) => {
  try {
    const { page, size, search } = req.query;
    const result = await getProvinsiByName({ page, size, search });
    return res.status(200).json({
      message: "Data provinsi berhasil diambil",
      data: result,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

module.exports = {
  importProvinsiController,
  getAllProvinsiController,
  getProvinsiByCodeController,
  getProvinsiByNameController,
};
