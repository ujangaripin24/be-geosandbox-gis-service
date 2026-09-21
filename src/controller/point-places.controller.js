const { validationResult } = require("express-validator");
const { formatError } = require("../pkg/error-formatter.pkg");
const { AddPlaceService } = require("../service/point-places.service");

const CreatePlaceController = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let body = req.body;
  console.log("Data controller: ", body);

  try {
    let uuid_user = req.user.uuid;

    const placeData = await AddPlaceService({
      ...body,
      uuid_user,
    });

    return res.status(201).json({
      message: "Tempat berhasil ditambahkan",
      data: placeData,
    });
  } catch (error) {
    console.error("Error in CreatePlaceController:", error.message);
    if (error.message.includes("tidak valid karena berada di luar wilayah")) {
      return res.status(400).json(formatError(error.message, "geom"));
    }
    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json(formatError(error.message, "kode_kabupaten"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

module.exports = {
  CreatePlaceController,
};