const { validationResult } = require("express-validator");
const { formatError } = require("../pkg/error-formatter.pkg");
const {
  AddPlaceService,
  GetAllPlaceService,
  UpdatePlaceService,
  SeacrhByNominatimService,
  DirectionOSRMBackendService,
  DirectionOSRMTwoWayPointService,
  DirectionOSRMMultipleWayPointService,
} = require("../service/point-places.service");

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
      message: "Success",
      status: 200,
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

const GetAllPlaceController = async (req, res, next) => {
  try {
    let { page, size, search } = req.query;
    let placeData = await GetAllPlaceService({ page, size, search });

    return res.status(200).json({
      message: "Success",
      status: 200,
      data: placeData,
    });
  } catch (error) {
    console.error("Error in GetAllPlaceController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const UpdatePlaceController = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let body = req.body;
  let uuid = req.params.uuid;

  try {
    let updatedPlace = await UpdatePlaceService(uuid, body);

    return res.status(200).json({
      message: "Success",
      status: 200,
      data: updatedPlace,
    });
  } catch (error) {
    console.error("Error in UpdatePlaceController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const SearchPlaceByNominatimController = async (req, res) => {
  try {
    const { q, limit, format, viewbox, bounded } = req.query;

    if (!q || !q.trim()) {
      return res
        .status(400)
        .json(formatError("Query pencarian 'q' wajib diisi", "validation"));
    }

    const data = await SeacrhByNominatimService({
      q,
      limit: limit ? parseInt(limit) : 10,
      format: format || "geojson",
      viewbox,
      bounded: bounded === "1" || bounded === "true",
    });

    return res.status(200).json({
      message: "Berhasil mencari alamat via Nominatim",
      data,
    });
  } catch (error) {
    console.error("Error in SearchPlaceByNominatimController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const DirectionOSRMController = async (req, res) => {
  try {
    const { startLat, startLon, endLat, endLon, profile } = req.query;

    const data = await DirectionOSRMBackendService({
      startLat,
      startLon,
      endLat,
      endLon,
      profile,
    });

    return res.status(200).json({
      message: "Success",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DirectionOSRMController:", error.message);
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const DirectionOSRMTwoWayPointController = async (req, res) => {
  try {
    const { start_lat, start_lon, end_lat, end_lon, startLat, startLon, endLat, endLon, profile } = req.query;

    const data = await DirectionOSRMTwoWayPointService({
      start_lat,
      start_lon,
      end_lat,
      end_lon,
      startLat,
      startLon,
      endLat,
      endLon,
      profile,
    });

    return res.status(200).json({
      message: "Success",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DirectionOSRMTwoWayPointController:", error.message);
    if (error.message.includes("wajib diisi dengan angka valid")) {
      return res.status(400).json(formatError(error.message, "validation"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

const DirectionOSRMMultipleWayPointController = async (req, res) => {
  try {
    let points = req.body?.points || req.query?.points;
    let profile = req.body?.profile || req.query?.profile;

    if (typeof points === "string" && (points.startsWith("[") || points.startsWith("{"))) {
      try {
        points = JSON.parse(points);
      } catch (e) {
        // Keep string format
      }
    }

    const data = await DirectionOSRMMultipleWayPointService({
      points,
      profile,
    });

    return res.status(200).json({
      message: "Success",
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Error in DirectionOSRMMultipleWayPointController:", error.message);
    if (
      error.message.includes("wajib diisi") ||
      error.message.includes("minimal 2 titik") ||
      error.message.includes("tidak valid")
    ) {
      return res.status(400).json(formatError(error.message, "validation"));
    }
    return res.status(500).json(formatError(error.message, "server"));
  }
};

module.exports = {
  CreatePlaceController,
  GetAllPlaceController,
  UpdatePlaceController,
  SearchPlaceByNominatimController,
  DirectionOSRMController,
  DirectionOSRMTwoWayPointController,
  DirectionOSRMMultipleWayPointController,
};
