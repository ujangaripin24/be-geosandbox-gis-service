const { sequelize } = require("../models");

const getKecamatanByProvinsi = async (kodeProvinsi) => {
  const [rows] = await sequelize.query(
    `SELECT DISTINCT
        wilayah.kode_kecamatan,
        wilayah.nama_kecamatan,
        wilayah.kode_provinsi
     FROM tbl_geo_wilayah AS wilayah
     INNER JOIN tbl_geo_provinsi AS provinsi
       ON ST_Intersects(wilayah.geom, provinsi.geom)
     WHERE provinsi.kode_provinsi = :kodeProvinsi
       AND wilayah.kode_kecamatan IS NOT NULL
       AND wilayah.nama_kecamatan IS NOT NULL
       AND wilayah.geom IS NOT NULL
     ORDER BY wilayah.nama_kecamatan ASC`,
    { replacements: { kodeProvinsi } },
  );

  return rows;
};

module.exports = {
  getKecamatanByProvinsi,
};