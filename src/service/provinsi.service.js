const { Op } = require("sequelize");
const { TblGeoProvinsi, sequelize } = require("../models");
const {
  validateFeatureCollection,
  toGeoJSONFeature,
} = require("../validation/provinsi.validation");
const {
  syncProvinsiToES,
  searchProvinsiES,
} = require("../pkg/elasticsearch/wilayah-search.pkg");

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

    syncProvinsiToES(rows, { replace }).catch((esErr) => {
      console.warn(
        "[Elasticsearch Sync Warning] Gagal menyinkronkan import provinsi ke ES:",
        esErr.message,
      );
    });

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
  const limit = parseInt(size) || 10;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * limit;
  const cleanSearch = String(search || "").trim();

  try {
    const esResult = await searchProvinsiES({
      page: currentPage,
      size: limit,
      search: cleanSearch,
    });

    if (esResult.items.length > 0) {
      const codes = esResult.items.map((item) => item.kode_provinsi);
      const dbRows = await TblGeoProvinsi.findAll({
        attributes: ["kode_provinsi", "nama_provinsi", "geom"],
        where: {
          kode_provinsi: {
            [Op.in]: codes,
          },
        },
      });

      const rowMap = new Map(
        dbRows.map((row) => [String(row.kode_provinsi), row]),
      );
      const orderedRows = codes
        .map((code) => rowMap.get(String(code)))
        .filter(Boolean);

      const totalPages = Math.ceil(esResult.totalData / limit);
      return {
        type: "FeatureCollection",
        features: orderedRows.map(toGeoJSONFeature),
        size: limit,
        page: currentPage,
        totalPages,
        totalData: esResult.totalData,
      };
    }

    // Jika hasil pencarian kosong karena memang tidak ada kata kunci yang cocok (bukan karena index kosong)
    if (cleanSearch && esResult.totalData === 0) {
      const allEs = await searchProvinsiES({ page: 1, size: 1, search: "" });
      if (allEs.totalData > 0) {
        return {
          type: "FeatureCollection",
          features: [],
          size: limit,
          page: currentPage,
          totalPages: 0,
          totalData: 0,
        };
      }
    }
  } catch (esError) {
    console.warn(
      "[Elasticsearch Fallback] getAllProvinsi beralih ke PostgreSQL:",
      esError.message,
    );
  }

  // 2. Fallback ke PostgreSQL jika Elasticsearch mati atau index belum ter-seed
  const where = cleanSearch
    ? {
      [Op.or]: [
        { nama_provinsi: { [Op.iLike]: `%${cleanSearch}%` } },
        { kode_provinsi: { [Op.iLike]: `%${cleanSearch}%` } },
      ],
    }
    : {};

  const { rows, count } = await TblGeoProvinsi.findAndCountAll({
    attributes: ["kode_provinsi", "nama_provinsi", "geom"],
    where,
    limit,
    offset,
    order: [["kode_provinsi", "ASC"]],
  });

  if (!cleanSearch && rows.length > 0) {
    TblGeoProvinsi.findAll({
      attributes: ["kode_provinsi", "nama_provinsi"],
    })
      .then((allRows) => syncProvinsiToES(allRows))
      .catch(() => { });
  }

  const totalPages = Math.ceil(count / limit);
  return {
    type: "FeatureCollection",
    features: rows.map(toGeoJSONFeature),
    size: limit,
    page: currentPage,
    totalPages,
    totalData: count,
  };
};

const getProvinsiByName = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size) || 10;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * limit;
  const cleanSearch = String(search || "").trim();

  try {
    const esResult = await searchProvinsiES({
      page: currentPage,
      size: limit,
      search: cleanSearch,
    });

    if (esResult.items.length > 0 || (cleanSearch && esResult.totalData === 0)) {
      const checkIndex =
        esResult.items.length > 0
          ? esResult
          : await searchProvinsiES({ page: 1, size: 1, search: "" });

      if (checkIndex.totalData > 0) {
        return {
          count: esResult.totalData,
          rows: esResult.items,
        };
      }
    }
  } catch (esError) {
    console.warn(
      "[Elasticsearch Fallback] getProvinsiByName beralih ke PostgreSQL:",
      esError.message,
    );
  }

  const where = cleanSearch
    ? {
      [Op.or]: [{ nama_provinsi: { [Op.iLike]: `%${cleanSearch}%` } }],
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
