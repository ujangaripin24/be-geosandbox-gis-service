const { formatError } = require("../pkg/error-formatter.pkg");
const { importKabupaten } = require("../service/kabupaten.service");

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

module.exports = {
    importKabupatenController
}