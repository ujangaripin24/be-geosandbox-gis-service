const { sequelize } = require("../models");

const AddPlaceService = async (data) => {
  let { name_place, description, kode_kabupaten, longitude, latitude, uuid_user } = data;

  const lon = parseFloat(longitude);
  const lat = parseFloat(latitude);

  // 1. Validasi Spasial PostGIS: Cek apakah koordinat berada di dalam poligon wilayah
  const [wilayahRows] = await sequelize.query(
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
    }
  );

  if (!wilayahRows || wilayahRows.length === 0) {
    throw new Error(`Data wilayah dengan kode kabupaten '${kode_kabupaten}' tidak ditemukan`);
  }

  const { kode_provinsi, nama_provinsi, nama_kabupaten, is_inside } = wilayahRows[0];

  if (!is_inside) {
    throw new Error(
      `Titik koordinat (${lat}, ${lon}) tidak valid karena berada di luar wilayah administratif ${nama_kabupaten} (${nama_provinsi})`
    );
  }

  // 2. Query PostGIS: Simpan ke tabel tbl_geo_point_place
  const [insertedRows] = await sequelize.query(
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
    }
  );

  const placeData = insertedRows[0];
  if (placeData && typeof placeData.geom === "string") {
    placeData.geom = JSON.parse(placeData.geom);
  }

  return placeData;
};

module.exports = {
  AddPlaceService,
};