const { Op } = require("sequelize");
const { TblGeoProvinsi, sequelize } = require("../models");
const {
  validateFeatureCollection,
} = require("../validation/provinsi.validation");

const importProvinsi = async (document, { replace = false } = {}) => {
  const rows = validateFeatureCollection(document);
  const transaction = await sequelize.transaction();

  try {
    for (const row of rows) {
      await TblGeoProvinsi.upsert(row, { transaction });
    }

    if (replace) {
      await TblGeoProvinsi.destroy({
        where: {
          kode_provinsi: {
            [Op.notIn]: rows.map((row) => row.kode_provinsi),
          },
        },
        transaction,
      });
    }

    await transaction.commit();
    return {
      imported: rows.length,
      mode: replace ? "replace" : "upsert",
      codes: rows.map((row) => row.kode_provinsi),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getAllProvinsi = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size);
  const offset = (page - 1) * limit;
  const where = search
    ? {
        [Op.or]: [{ nama_provinsi: { [Op.like]: `%${search}%` } }],
      }
    : {};

  const { rows, count } = await TblGeoProvinsi.findAndCountAll({
    attributes: ["kode_provinsi", "nama_provinsi", "geom"],
    where,
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);
  return {
    data: rows,
    size: limit,
    page: parseInt(page),
    totalPages,
    totalData: count,
  };
};

const getProvinsiByName = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size);
  const offset = (page - 1) * limit;

  const where = search
    ? {
        [Op.or]: [{ nama_provinsi: { [Op.like]: `%${search}%` } }],
      }
    : {};

  const provinsi = await TblGeoProvinsi.findAndCountAll({
    attributes: ["kode_provinsi", "nama_provinsi"],
    where,
    limit,
    offset,
  });

  return provinsi;
};

const getProvinsiByCode = async (kode_provinsi) => {
  const provinsi = await TblGeoProvinsi.findOne({
    where: { kode_provinsi },
    attributes: ["kode_provinsi", "nama_provinsi", "geom"],
  });

  return provinsi;
}

module.exports = {
  importProvinsi,
  getProvinsiByName,
  getAllProvinsi,
  getProvinsiByCode,
};
