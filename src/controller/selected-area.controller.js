const { formatError } = require("../pkg/error-formatter.pkg");
const {
  getKabupatenByProvinsi,
  getKabupatenByProvinsiAreaService,
  getSelectedAreaPointerService,
} = require("../service/selected-area.service");

const getKabupatenByProvinsiController = async (req, res) => {
  try {
    const { kode_provinsi: kodeProvinsi } = req.params;

    if (!kodeProvinsi || !/^\d{2}$/.test(kodeProvinsi)) {
      return res
        .status(400)
        .json(
          formatError("Kode provinsi harus terdiri dari 2 digit", "validation"),
        );
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

const getKabupatenByProvinsiAreaController = async (req, res) => {
  try {
    const { kode_provinsi: kodeProvinsi } = req.params;

    if (!kodeProvinsi || !/^\d{2}$/.test(kodeProvinsi)) {
      return res
        .status(400)
        .json(
          formatError("Kode provinsi harus terdiri dari 2 digit", "validation"),
        );
    }

    const data = await getKabupatenByProvinsiAreaService(kodeProvinsi);
    return res.status(200).json({
      message: "Data kabupaten/kota berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const getSelectedAreaPointerController = async (req, res) => {
  try {
    const { min_lon, min_lat, max_lon, max_lat } = req.query;

    if (
      min_lon === undefined ||
      min_lat === undefined ||
      max_lon === undefined ||
      max_lat === undefined
    ) {
      return res
        .status(400)
        .json(
          formatError(
            "Query parameter min_lon, min_lat, max_lon, dan max_lat wajib diisi",
            "validation",
          ),
        );
    }

    const minLon = parseFloat(min_lon);
    const minLat = parseFloat(min_lat);
    const maxLon = parseFloat(max_lon);
    const maxLat = parseFloat(max_lat);

    if (isNaN(minLon) || isNaN(minLat) || isNaN(maxLon) || isNaN(maxLat)) {
      return res
        .status(400)
        .json(
          formatError(
            "Parameter min_lon, min_lat, max_lon, dan max_lat harus berupa angka koordinat",
            "validation",
          ),
        );
    }

    if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
      return res
        .status(400)
        .json(
          formatError(
            "Longitude harus berada dalam rentang -180 hingga 180",
            "validation",
          ),
        );
    }

    if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
      return res
        .status(400)
        .json(
          formatError(
            "Latitude harus berada dalam rentang -90 hingga 90",
            "validation",
          ),
        );
    }

    if (minLon > maxLon || minLat > maxLat) {
      return res
        .status(400)
        .json(
          formatError(
            "min_lon tidak boleh lebih besar dari max_lon dan min_lat tidak boleh lebih besar dari max_lat",
            "validation",
          ),
        );
    }

    const data = await getSelectedAreaPointerService({
      min_lon: minLon,
      min_lat: minLat,
      max_lon: maxLon,
      max_lat: maxLat,
    });

    return res.status(200).json({
      message: "Data point berdasarkan area (bounding box) berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(500).json(formatError(error.message, "server"));
  }
};

module.exports = {
  getKabupatenByProvinsiController,
  getKabupatenByProvinsiAreaController,
  getSelectedAreaPointerController,
};
