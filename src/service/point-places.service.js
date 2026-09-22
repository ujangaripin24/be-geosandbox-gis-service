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

module.exports = {
  AddPlaceService,
  GetAllPlaceService,
  UpdatePlaceService,
};
