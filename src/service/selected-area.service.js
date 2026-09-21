const { sequelize } = require("../models");
const { toGeoJSONFeature } = require("../validation/selected-area.validation");

const getKabupatenByProvinsi = async (kodeProvinsi) => {
  const [rows] = await sequelize.query(
    `SELECT DISTINCT
        wilayah.kode_kabupaten,
        wilayah.nama_kabupaten,
        wilayah.kode_provinsi
     FROM tbl_geo_wilayah AS wilayah
     WHERE wilayah.kode_provinsi = :kodeProvinsi
       AND wilayah.kode_kabupaten IS NOT NULL
       AND wilayah.nama_kabupaten IS NOT NULL
     ORDER BY wilayah.nama_kabupaten ASC`,
    { replacements: { kodeProvinsi } },
  );

  return rows;
};

const getKabupatenByProvinsiAreaService = async (kodeProvinsi) => {
  let [rows] = await sequelize.query(
    `SELECT DISTINCT
        wilayah.kode_kabupaten,
        wilayah.nama_kabupaten,
        wilayah.kode_provinsi,
        ST_AsGeoJSON(wilayah.geom) AS geom
     FROM tbl_geo_wilayah AS wilayah
     WHERE wilayah.kode_provinsi = :kodeProvinsi
       AND wilayah.kode_kabupaten IS NOT NULL
       AND wilayah.nama_kabupaten IS NOT NULL
     ORDER BY wilayah.nama_kabupaten ASC`,
    { replacements: { kodeProvinsi } },
  );

  return {
    type: "FeatureCollection",
    features: rows.map(toGeoJSONFeature),
  };
};

module.exports = {
  getKabupatenByProvinsi,
  getKabupatenByProvinsiAreaService,
};