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

module.exports = {
  importKabupaten,
};