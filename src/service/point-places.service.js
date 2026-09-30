const { Op } = require("sequelize");
const { toGeoJSONFeature } = require("../validation/kabupaten.validation");
const { sequelize, TblPointPlace } = require("../models");

const AddPlaceService = async (data) => {
  let {
    name_place,
    description,
    kode_kabupaten,
    longitude,
    latitude,
    uuid_user,
  } = data;

  let lon = parseFloat(longitude);
  let lat = parseFloat(latitude);

  let [existingPlace] = await sequelize.query(
    `SELECT uuid, name_place 
     FROM tbl_geo_point_place 
     WHERE ST_Equals(
        geom,
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
     ) 
     LIMIT 1;`,
    {
      replacements: { lon, lat },
    },
  );

  if (existingPlace && existingPlace.length > 0) {
    throw new Error(
      `Data tempat dengan nama '${existingPlace[0].name_place}' sudah ada`,
    );
  }

  let [wilayahRows] = await sequelize.query(
    `SELECT 
        wilayah.kode_provinsi,
        wilayah.nama_provinsi,
        wilayah.kode_kabupaten,
        wilayah.nama_kabupaten,
        ST_Contains(
          wilayah.geom, 
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        ) AS is_inside
     FROM tbl_geo_wilayah AS wilayah
     WHERE wilayah.kode_kabupaten = :kode_kabupaten
     LIMIT 1;`,
    {
      replacements: { kode_kabupaten, lon, lat },
    },
  );

  if (!wilayahRows || wilayahRows.length === 0) {
    throw new Error(
      `Data wilayah dengan kode kabupaten '${kode_kabupaten}' tidak ditemukan`,
    );
  }

  let { kode_provinsi, nama_provinsi, nama_kabupaten, is_inside } =
    wilayahRows[0];

  if (!is_inside) {
    throw new Error(
      `Titik koordinat (${lat}, ${lon}) tidak valid karena berada di luar wilayah administratif ${nama_kabupaten} (${nama_provinsi})`,
    );
  }

  let [insertedRows] = await sequelize.query(
    `INSERT INTO tbl_geo_point_place (
        uuid,
        name_place,
        description,
        kode_provinsi,
        nama_provinsi,
        kode_kabupaten,
        nama_kabupaten,
        uuid_user,
        geom,
        "createdAt",
        "updatedAt"
     ) VALUES (
        gen_random_uuid(),
        :name_place,
        :description,
        :kode_provinsi,
        :nama_provinsi,
        :kode_kabupaten,
        :nama_kabupaten,
        :uuid_user,
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
        NOW(),
        NOW()
     )
     RETURNING 
        uuid,
        name_place,
        description,
        kode_provinsi,
        nama_provinsi,
        kode_kabupaten,
        nama_kabupaten,
        uuid_user,
        ST_AsGeoJSON(geom) AS geom,
        "createdAt",
        "updatedAt";`,
    {
      replacements: {
        name_place,
        description: description || null,
        kode_provinsi,
        nama_provinsi,
        kode_kabupaten,
        nama_kabupaten,
        uuid_user: uuid_user || null,
        lon,
        lat,
      },
    },
  );

  let placeData = insertedRows[0];
  if (placeData && typeof placeData.geom === "string") {
    placeData.geom = JSON.parse(placeData.geom);
  }

  return placeData;
};

const GetAllPlaceService = async ({ page = 1, size = 10, search = "" }) => {
  let limit = parseInt(size);
  let offset = (page - 1) * limit;
  let where = search
    ? {
      [Op.or]: [{ name_place: { [Op.like]: `%${search}%` } }],
    }
    : {};

  let { rows, count } = await TblPointPlace.findAndCountAll({
    attributes: [
      "uuid",
      "name_place",
      "description",
      "kode_provinsi",
      "nama_provinsi",
      "kode_kabupaten",
      "nama_kabupaten",
      "uuid_user",
      "geom",
      "createdAt",
      "updatedAt",
    ],
    where,
    limit,
    offset,
  });

  let totalPages = Math.ceil(count / limit);
  return {
    type: "FeatureCollection",
    features: rows.map(toGeoJSONFeature),
    size: limit,
    page: parseInt(page),
    totalPages,
    totalData: count,
  };
};

const UpdatePlaceService = async (uuid, body) => {
  let data = await TblPointPlace.findOne({
    where: { uuid },
  });
  if (!data) {
    throw new Error("Place Not Found");
  }

  let kode_kabupaten = body.kode_kabupaten || place.kode_kabupaten;
  let lon = body.longitude ? parseFloat(body.longitude) : null;
  let lat = body.latitude ? parseFloat(body.latitude) : null;

  const isLocationChanged = lon !== null && lat !== null;
  const isKabupatenChanged =
    body.kode_kabupaten && body.kode_kabupaten !== place.kode_kabupaten;

  if (isLocationChanged) {
    let [existingPlace] = await sequelize.query(
      `SELECT uuid, name_place 
       FROM tbl_geo_point_place 
       WHERE ST_Equals(geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)) 
         AND uuid != :uuid
       LIMIT 1;`,
      { replacements: { lon, lat, uuid } },
    );

    if (existingPlace && existingPlace.length > 0) {
      throw new Error(
        `Data tempat dengan nama '${existingPlace[0].name_place}' sudah ada di lokasi ini`,
      );
    }
  }

  let kode_provinsi = place.kode_provinsi;
  let nama_provinsi = place.nama_provinsi;
  let nama_kabupaten = place.nama_kabupaten;

  if (isLocationChanged || isKabupatenChanged) {
    if (!lon || !lat) {
      throw new Error(
        "Pembaruan kode_kabupaten wajib menyertakan koordinat longitude dan latitude yang baru.",
      );
    }

    let [wilayahRows] = await sequelize.query(
      `SELECT wilayah.kode_provinsi, wilayah.nama_provinsi, wilayah.kode_kabupaten, wilayah.nama_kabupaten,
              ST_Contains(wilayah.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)) AS is_inside
       FROM tbl_geo_wilayah AS wilayah 
       WHERE wilayah.kode_kabupaten = :kode_kabupaten 
       LIMIT 1;`,
      { replacements: { kode_kabupaten, lon, lat } },
    );

    if (!wilayahRows || wilayahRows.length === 0) {
      throw new Error(
        `Data wilayah dengan kode kabupaten '${kode_kabupaten}' tidak ditemukan`,
      );
    }

    let { is_inside } = wilayahRows[0];
    if (!is_inside) {
      throw new Error(
        `Titik koordinat (${lat}, ${lon}) tidak valid karena berada di luar wilayah administratif ${wilayahRows[0].nama_kabupaten} (${wilayahRows[0].nama_provinsi})`,
      );
    }

    kode_provinsi = wilayahRows[0].kode_provinsi;
    nama_provinsi = wilayahRows[0].nama_provinsi;
    nama_kabupaten = wilayahRows[0].nama_kabupaten;
  }
  place.name_place = body.name_place || place.name_place;
  place.description = Object.prototype.hasOwnProperty.call(body, "description")
    ? body.description
    : place.description;
  place.uuid_user = Object.prototype.hasOwnProperty.call(body, "uuid_user")
    ? body.uuid_user
    : place.uuid_user;

  place.kode_provinsi = kode_provinsi;
  place.nama_provinsi = nama_provinsi;
  place.kode_kabupaten = kode_kabupaten;
  place.nama_kabupaten = nama_kabupaten;

  if (isLocationChanged) {
    place.geom = sequelize.fn(
      "ST_SetSRID",
      sequelize.fn("ST_MakePoint", lon, lat),
      4326,
    );
  }
  await place.save();
  await place.reload();

  return place;
};

const SeacrhByNominatimService = async ({
  q,
  limit = 10,
  format = "geojson",
  viewbox = null,
  bounded = false,
}) => {
  if (!q || !q.trim()) {
    throw new Error("Kata kunci pencarian alamat tidak boleh kosong");
  }

  const nominatimBaseUrl = process.env.NOMINATIM_URL;

  const searchParams = {
    q: q.trim(),
    format: format === "geojson" ? "geojson" : "jsonv2",
    countrycodes: "id",
    addressdetails: "1",
    limit: String(limit),
  };

  if (viewbox) {
    searchParams.viewbox = viewbox;
    if (bounded) {
      searchParams.bounded = "1";
    }
  }

  const params = new URLSearchParams(searchParams);
  const url = `${nominatimBaseUrl}/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "GeoSandbox-GIS-Service/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data dari Nominatim: [${response.status}] ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (err) {
    if (
      err.message.includes("fetch failed") ||
      err.code === "ECONNREFUSED"
    ) {
      throw new Error(
        `Gagal terhubung ke Nominatim (${nominatimBaseUrl}). Container 'global-nominatim-search' sedang melakukan inisialisasi/import data OSM atau belum siap menerima request.`,
      );
    }
    throw err;
  }
};

const DirectionOSRMBackendService = async (options = {}) => {
  // Hardcoded default coordinates if not supplied:
  // Start Point (Banda Aceh): lat 5.5400, lon 95.3300
  // End Point (Bandar Lampung): lat -5.4300, lon 105.2600
  const startLat = options.startLat !== undefined && options.startLat !== "" ? parseFloat(options.startLat) : 5.5400;
  const startLon = options.startLon !== undefined && options.startLon !== "" ? parseFloat(options.startLon) : 95.3300;
  const endLat = options.endLat !== undefined && options.endLat !== "" ? parseFloat(options.endLat) : -5.4300;
  const endLon = options.endLon !== undefined && options.endLon !== "" ? parseFloat(options.endLon) : 105.2600;
  const profile = options.profile || "driving";

  const osrmBaseUrl = process.env.OSRM_URL;

  // OSRM API expects longitude,latitude;longitude,latitude
  const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
  const url = `${osrmBaseUrl}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data rute dari OSRM: [${response.status}] ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (err) {
    if (
      err.message.includes("fetch failed") ||
      err.code === "ECONNREFUSED"
    ) {
      throw new Error(
        `Gagal terhubung ke OSRM Backend (${osrmBaseUrl}). Pastikan container 'global-osrm-backend' sudah aktif.`
      );
    }
    throw err;
  }
};

const DirectionOSRMTwoWayPointService = async (data = {}) => {
  const {
    start_lat,
    start_lon,
    end_lat,
    end_lon,
    startLat,
    startLon,
    endLat,
    endLon,
    profile = "driving",
  } = data;

  const lat1 = start_lat !== undefined && start_lat !== "" ? parseFloat(start_lat) : (startLat !== undefined && startLat !== "" ? parseFloat(startLat) : null);
  const lon1 = start_lon !== undefined && start_lon !== "" ? parseFloat(start_lon) : (startLon !== undefined && startLon !== "" ? parseFloat(startLon) : null);
  const lat2 = end_lat !== undefined && end_lat !== "" ? parseFloat(end_lat) : (endLat !== undefined && endLat !== "" ? parseFloat(endLat) : null);
  const lon2 = end_lon !== undefined && end_lon !== "" ? parseFloat(end_lon) : (endLon !== undefined && endLon !== "" ? parseFloat(endLon) : null);

  if (lat1 === null || isNaN(lat1) || lon1 === null || isNaN(lon1)) {
    throw new Error("Koordinat titik asal (start_lat & start_lon) wajib diisi dengan angka valid");
  }

  if (lat2 === null || isNaN(lat2) || lon2 === null || isNaN(lon2)) {
    throw new Error("Koordinat titik tujuan (end_lat & end_lon) wajib diisi dengan angka valid");
  }

  const osrmBaseUrl = process.env.OSRM_URL;

  // OSRM API expects longitude,latitude;longitude,latitude
  const coordinates = `${lon1},${lat1};${lon2},${lat2}`;
  const url = `${osrmBaseUrl}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data rute dari OSRM: [${response.status}] ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (err) {
    if (
      err.message.includes("fetch failed") ||
      err.code === "ECONNREFUSED"
    ) {
      throw new Error(
        `Gagal terhubung ke OSRM Backend (${osrmBaseUrl}). Pastikan container 'global-osrm-backend' sudah aktif.`
      );
    }
    throw err;
  }
};

const DirectionOSRMMultipleWayPointService = async (data = {}) => {
  let { points, profile = "driving" } = data;

  if (!points) {
    throw new Error("Parameter 'points' wajib diisi (minimal 2 titik lokasi)");
  }

  let coordString = "";

  if (Array.isArray(points)) {
    if (points.length < 2) {
      throw new Error("Daftar titik lokasi 'points' harus berisi minimal 2 titik");
    }

    const formattedPoints = [];
    points.forEach((pt, index) => {
      let lat, lon;
      if (typeof pt === "object" && pt !== null) {
        lat = pt.lat !== undefined ? pt.lat : (pt.latitude !== undefined ? pt.latitude : null);
        lon = pt.lon !== undefined ? pt.lon : (pt.longitude !== undefined ? pt.longitude : null);
      } else if (typeof pt === "string") {
        const parts = pt.split(",");
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lon = parseFloat(parts[1]);
        }
      }

      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        throw new Error(`Titik lokasi pada indeks ${index} tidak valid (lat & lon wajib angka)`);
      }

      // OSRM API expects longitude,latitude
      formattedPoints.push(`${parsedLon},${parsedLat}`);
    });

    coordString = formattedPoints.join(";");
  } else if (typeof points === "string") {
    coordString = points.trim();
  }

  if (!coordString || coordString.split(";").length < 2) {
    throw new Error("Format 'points' tidak valid. Diperlukan minimal 2 titik lokasi.");
  }

  const osrmBaseUrl = process.env.OSRM_URL;
  const url = `${osrmBaseUrl}/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data rute multiple waypoint dari OSRM: [${response.status}] ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (err) {
    if (
      err.message.includes("fetch failed") ||
      err.code === "ECONNREFUSED"
    ) {
      throw new Error(
        `Gagal terhubung ke OSRM Backend (${osrmBaseUrl}). Pastikan container 'global-osrm-backend' sudah aktif.`
      );
    }
    throw err;
  }
};

module.exports = {
  AddPlaceService,
  GetAllPlaceService,
  UpdatePlaceService,
  SeacrhByNominatimService,
  DirectionOSRMBackendService,
  DirectionOSRMTwoWayPointService,
  DirectionOSRMMultipleWayPointService,
};
