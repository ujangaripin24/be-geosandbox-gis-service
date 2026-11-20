const {
  COMMON_ANALYSIS_SETTINGS,
  pingElasticsearch,
  ensureIndex,
  countIndexDocuments,
  bulkRequest,
  deleteByQuery,
  searchIndex,
  escapeWildcard,
  buildTermSuggester,
  resolveDidYouMeanSuggestion,
} = require("../../config/elasticsearch.config");
const { TblGeoWilayah } = require("../../models");

const INDICES = {
  KABUPATEN: "gis_kabupaten",
};

const KABUPATEN_MAPPING = {
  settings: COMMON_ANALYSIS_SETTINGS,
  mappings: {
    properties: {
      object_id: { type: "integer" },
      kode_provinsi: { type: "keyword" },
      kode_kabupaten: { type: "keyword" },
      nama_kabupaten: {
        type: "text",
        analyzer: "autocomplete_index_analyzer",
        search_analyzer: "autocomplete_search_analyzer",
        fields: {
          keyword: {
            type: "keyword",
            normalizer: "lowercase_normalizer",
          },
          standard: {
            type: "text",
            analyzer: "autocomplete_search_analyzer",
          },
        },
      },
      nama_provinsi: {
        type: "text",
        analyzer: "autocomplete_index_analyzer",
        search_analyzer: "autocomplete_search_analyzer",
        fields: {
          keyword: {
            type: "keyword",
            normalizer: "lowercase_normalizer",
          },
          standard: {
            type: "text",
            analyzer: "autocomplete_search_analyzer",
          },
        },
      },
    },
  },
};

/**
 * Sync Kabupaten rows to Elasticsearch
 */
const syncKabupatenToES = async (rows, { replace = false } = {}) => {
  if (!rows || rows.length === 0) return;
  await ensureIndex(INDICES.KABUPATEN, KABUPATEN_MAPPING);

  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const lines = [];
    for (const row of slice) {
      const plain = row.toJSON ? row.toJSON() : row;
      lines.push(
        JSON.stringify({
          index: {
            _index: INDICES.KABUPATEN,
            _id: String(plain.object_id),
          },
        }),
      );
      lines.push(
        JSON.stringify({
          object_id: Number(plain.object_id),
          kode_provinsi: plain.kode_provinsi || null,
          kode_kabupaten: plain.kode_kabupaten || null,
          nama_kabupaten: plain.nama_kabupaten || "",
          nama_provinsi: plain.nama_provinsi || "",
        }),
      );
    }
    await bulkRequest(lines, { refresh: i + batchSize >= rows.length });
  }

  if (replace) {
    const ids = rows.map((r) => Number(r.object_id));
    await deleteByQuery(INDICES.KABUPATEN, {
      query: {
        bool: {
          must_not: [{ terms: { object_id: ids } }],
        },
      },
    });
  }
};

/**
 * Initialize Kabupaten index & seed from DB if out of sync
 */
const initKabupatenIndexAndSeed = async () => {
  const isAlive = await pingElasticsearch();
  if (!isAlive) {
    console.warn(
      "[Elasticsearch - Kabupaten] Cluster belum aktif. Menggunakan fallback PostgreSQL.",
    );
    return false;
  }

  try {
    await ensureIndex(INDICES.KABUPATEN, KABUPATEN_MAPPING);

    const [dbKabCount, esKabCount] = await Promise.all([
      TblGeoWilayah.count(),
      countIndexDocuments(INDICES.KABUPATEN),
    ]);

    if (dbKabCount > 0 && dbKabCount !== esKabCount) {
      const kabRows = await TblGeoWilayah.findAll({
        attributes: [
          "object_id",
          "kode_provinsi",
          "kode_kabupaten",
          "nama_kabupaten",
          "nama_provinsi",
        ],
      });
      await syncKabupatenToES(kabRows);
      console.log(
        `[Elasticsearch Seed] Berhasil menyinkronkan ${kabRows.length} data kabupaten dari DB.`,
      );
    }
    return true;
  } catch (error) {
    console.warn(
      "[Elasticsearch - Kabupaten] Gagal inisialisasi/seeding:",
      error.message,
    );
    return false;
  }
};

/**
 * Search Kabupaten in Elasticsearch
 */
const searchKabupatenES = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size) || 10;
  const from = (parseInt(page) - 1) * limit;
  const cleanSearch = String(search || "").trim();

  const query = cleanSearch
    ? {
        bool: {
          should: [
            { term: { kode_kabupaten: { value: cleanSearch, boost: 5 } } },
            {
              match_phrase_prefix: {
                nama_kabupaten: { query: cleanSearch, boost: 4 },
              },
            },
            {
              multi_match: {
                query: cleanSearch,
                fields: ["nama_kabupaten^3", "nama_provinsi"],
                fuzziness: "AUTO",
                operator: "and",
                boost: 2,
              },
            },
            {
              wildcard: {
                "nama_kabupaten.keyword": {
                  value: `*${escapeWildcard(cleanSearch)}*`,
                  boost: 3,
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      }
    : { match_all: {} };

  const sort = cleanSearch
    ? ["_score", { object_id: "asc" }]
    : [{ object_id: "asc" }];

  const response = await searchIndex(INDICES.KABUPATEN, {
    from,
    size: limit,
    track_total_hits: true,
    query,
    sort,
    ...(cleanSearch
      ? { suggest: buildTermSuggester(cleanSearch, "nama_kabupaten.standard") }
      : {}),
  });

  const hits = response?.hits?.hits || [];
  const items = hits.map((h) => h._source);
  const totalData =
    typeof response?.hits?.total === "object"
      ? response.hits.total.value
      : response?.hits?.total || 0;

  const suggestion = resolveDidYouMeanSuggestion(
    cleanSearch,
    response,
    items,
    ["nama_kabupaten", "nama_provinsi"],
  );

  return {
    items,
    totalData,
    suggestion,
  };
};

module.exports = {
  INDICES,
  KABUPATEN_MAPPING,
  initKabupatenIndexAndSeed,
  syncKabupatenToES,
  searchKabupatenES,
};
