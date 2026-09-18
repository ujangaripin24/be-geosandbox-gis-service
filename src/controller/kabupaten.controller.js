const { formatError } = require("../pkg/error-formatter.pkg");
const { importKabupaten, getKabupatenByCode, getAllKabupaten } = require("../service/kabupaten.service");

const importKabupatenController = async (req, res) => {
  try {
    let document = req.body;

    if (req.file) {
      document = JSON.parse(req.file.buffer.toString("utf8"));
    }
    const result = await importKabupaten(document, {
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

const getAllKabupatenController = async (req, res) => {
  try {
    const { page, size, search } = req.query;
    const result = await getAllKabupaten({ page, size, search });

    return res.status(200).json({
      message: "Data kabupaten berhasil diambil",
      data: result,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const getKabupatenByCodeController = async (req, res) => {
  try {
    const { code } = req.params;
    const result = await getKabupatenByCode(code);

    if (!result) {
      return res.status(404).json(formatError("Kabupaten tidak ditemukan", "not_found"));
    }

    return res.status(200).json({
      message: "Data kabupaten berhasil diambil",
      data: result,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
}
module.exports = {
    importKabupatenController,
    getAllKabupatenController,
    getKabupatenByCodeController,
}