const { Op } = require("sequelize");
const { TblGeoProvinsi, sequelize } = require("../models");
const { validateFeatureCollection } = require("../validation/provinsi.validation");

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

module.exports = {
	importProvinsi,
};
