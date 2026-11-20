const { Op } = require("sequelize");
const { sequelize, TblGeoWilayah } = require("../models");
const {
  validateFeatureCollection,
  toGeoJSONFeature,
} = require("../validation/kabupaten.validation");
const {
  syncKabupatenToES,
  searchKabupatenES,
} = require("../pkg/elasticsearch/kabupaten-search.pkg");

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

    syncKabupatenToES(rows, { replace }).catch((esErr) => {
      console.warn(
        "[Elasticsearch Sync Warning] Gagal menyinkronkan import kabupaten ke ES:",
        esErr.message,
      );
    });

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
  const limit = parseInt(size) || 10;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * limit;
  const cleanSearch = String(search || "").trim();

  try {
    const esResult = await searchKabupatenES({
      page: currentPage,
      size: limit,
      search: cleanSearch,
    });

    if (esResult.items.length > 0) {
      const objectIds = esResult.items.map((item) => Number(item.object_id));
      const dbRows = await TblGeoWilayah.findAll({
        attributes: [
          "object_id",
          "kode_provinsi",
          "kode_kabupaten",
          "nama_kabupaten",
          "nama_provinsi",
          "geom",
        ],
        where: {
          object_id: {
            [Op.in]: objectIds,
          },
        },
      });

      const rowMap = new Map(
        dbRows.map((row) => [Number(row.object_id), row]),
      );
      const orderedRows = objectIds
        .map((id) => rowMap.get(Number(id)))
        .filter(Boolean);

      const totalPages = Math.ceil(esResult.totalData / limit);
      return {
        type: "FeatureCollection",
        features: orderedRows.map(toGeoJSONFeature),
        size: limit,
        page: currentPage,
        totalPages,
        totalData: esResult.totalData,
        suggestion: esResult.suggestion || null,
      };
    }

    if (cleanSearch && esResult.totalData === 0) {
      const allEs = await searchKabupatenES({ page: 1, size: 1, search: "" });
      if (allEs.totalData > 0) {
        return {
          type: "FeatureCollection",
          features: [],
          size: limit,
          page: currentPage,
          totalPages: 0,
          totalData: 0,
          suggestion: esResult.suggestion || null,
        };
      }
    }
  } catch (esError) {
    console.warn(
      "[Elasticsearch Fallback] getAllKabupaten beralih ke PostgreSQL:",
      esError.message,
    );
  }

  const where = cleanSearch
    ? {
      [Op.or]: [
        { nama_kabupaten: { [Op.iLike]: `%${cleanSearch}%` } },
        { nama_provinsi: { [Op.iLike]: `%${cleanSearch}%` } },
        { kode_kabupaten: { [Op.iLike]: `%${cleanSearch}%` } },
      ],
    }
    : {};

  const { rows, count } = await TblGeoWilayah.findAndCountAll({
    attributes: [
      "object_id",
      "kode_provinsi",
      "kode_kabupaten",
      "nama_kabupaten",
      "nama_provinsi",
      "geom",
    ],
    where,
    limit,
    offset,
    order: [["object_id", "ASC"]],
  });

  if (!cleanSearch && rows.length > 0) {
    TblGeoWilayah.findAll({
      attributes: [
        "object_id",
        "kode_provinsi",
        "kode_kabupaten",
        "nama_kabupaten",
        "nama_provinsi",
      ],
    })
      .then((allRows) => syncKabupatenToES(allRows))
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
    suggestion: null,
  };
};

const getKabupatenByCode = async (code) => {
  const kabupaten = await TblGeoWilayah.findOne({
    where: { object_id: code },
  });
  return kabupaten ? toGeoJSONFeature(kabupaten) : null;
};

module.exports = {
  importKabupaten,
  getAllKabupaten,
  getKabupatenByCode,
};