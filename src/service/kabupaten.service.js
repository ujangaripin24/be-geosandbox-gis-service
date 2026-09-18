const { Op } = require("sequelize");
const { sequelize, TblGeoWilayah } = require("../models");
const {
  validateFeatureCollection,
} = require("../validation/kabupaten.validation");

const importKabupaten = async (document, { replace = false } = {}) => {
  const rows = validateFeatureCollection(document);
  const transaction = await sequelize.transaction();

  try {
    for (const row of rows) {
      await TblGeoWilayah.upsert(row, { transaction });
    }
    if (replace) {
        await TblGeoWilayah.destroy({
          where: {
            object_id: {
              [Op.notIn]: rows.map((row) => row.object_id),
            },
          },
          transaction,
        });
      }
    await transaction.commit();
    return {
      imported: rows.length,
      mode: replace ? "replace" : "upsert",
      codes: rows.map((row) => row.object_id),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getAllKabupaten = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size);
  const offset = (page - 1) * limit;
  const where = search
    ? {
        [Op.or]: [{ nama_kabupaten: { [Op.like]: `%${search}%` } }],
      }
    : {};

  const { rows, count } = await TblGeoWilayah.findAndCountAll({
    attributes: ["object_id", "nama_kabupaten", "geom"],
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
  };
};

const getKabupatenByCode = async (code) => {
  const kabupaten = await TblGeoWilayah.findOne({
    where: { object_id: code },
  });
  return kabupaten;
};

module.exports = {
  importKabupaten,
  getAllKabupaten,
  getKabupatenByCode,
};