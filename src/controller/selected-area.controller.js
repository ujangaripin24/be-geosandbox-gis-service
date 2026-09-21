const { formatError } = require("../pkg/error-formatter.pkg");
const {
  getKabupatenByProvinsi,
} = require("../service/selected-area.service");

const getKabupatenByProvinsiController = async (req, res) => {
  try {
    const { kode_provinsi: kodeProvinsi } = req.params;

    if (!kodeProvinsi || !/^\d{2}$/.test(kodeProvinsi)) {
      return res.status(400).json(formatError(
        "Kode provinsi harus terdiri dari 2 digit",
        "validation",
      ));
    }

    const data = await getKabupatenByProvinsi(kodeProvinsi);
    return res.status(200).json({
      message: "Data kabupaten/kota berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

module.exports = {
  getKabupatenByProvinsiController,
};