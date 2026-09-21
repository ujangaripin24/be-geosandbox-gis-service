const { sequelize } = require("../models");

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

module.exports = {
  getKabupatenByProvinsi,
};