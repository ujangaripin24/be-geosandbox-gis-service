const {
  pingElasticsearch,
  ensureIndex,
  countIndexDocuments,
  bulkRequest,
  indexDocument,
  deleteByQuery,
  searchIndex,
} = require("../../config/elasticsearch.config");
const {
  TblGeoProvinsi,
  TblGeoWilayah,
  TblPointPlace,
  DetailUsers,
} = require("../../models");

const INDICES = {
  PROVINSI: "gis_provinsi",
  KABUPATEN: "gis_kabupaten",
  POINT_PLACES: "gis_point_places",
};

const COMMON_ANALYSIS_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 0,
  analysis: {
    filter: {
      autocomplete_edge_ngram: {
        type: "edge_ngram",
        min_gram: 2,
        max_gram: 20,
      },
    },
    analyzer: {
      autocomplete_index_analyzer: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "asciifolding", "autocomplete_edge_ngram"],
      },
      autocomplete_search_analyzer: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "asciifolding"],
      },
    },
    normalizer: {
      lowercase_normalizer: {
        type: "custom",
        filter: ["lowercase", "asciifolding"],
      },
    },
  },
};

const INDEX_MAPPINGS = {
  [INDICES.PROVINSI]: {
    settings: COMMON_ANALYSIS_SETTINGS,
    mappings: {
      properties: {
        kode_provinsi: { type: "keyword" },
        nama_provinsi: {
          type: "text",
          analyzer: "autocomplete_index_analyzer",
          search_analyzer: "autocomplete_search_analyzer",
          fields: {
            keyword: {
              type: "keyword",
              normalizer: "lowercase_normalizer",
            },
          },
        },
      },
    },
  },

  [INDICES.KABUPATEN]: {
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
          },
        },
      },
    },
  },

  [INDICES.POINT_PLACES]: {
    settings: COMMON_ANALYSIS_SETTINGS,
    mappings: {
      properties: {
        uuid: { type: "keyword" },
        name_place: {
          type: "text",
          analyzer: "autocomplete_index_analyzer",
          search_analyzer: "autocomplete_search_analyzer",
          fields: {
            keyword: {
              type: "keyword",
              normalizer: "lowercase_normalizer",
            },
          },
        },
        description: {
          type: "text",
          analyzer: "autocomplete_search_analyzer",
        },
        kode_provinsi: { type: "keyword" },
        nama_provinsi: {
          type: "text",
          analyzer: "autocomplete_index_analyzer",
          search_analyzer: "autocomplete_search_analyzer",
          fields: {
            keyword: {
              type: "keyword",
              normalizer: "lowercase_normalizer",
            },
          },
        },
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
          },
        },
        uuid_user: { type: "keyword" },
        user: {
          properties: {
            uuid: { type: "keyword" },
            username: { type: "keyword" },
            email: { type: "keyword" },
          },
        },
        location: { type: "geo_point" },
        geom: { type: "object", enabled: false },
        createdAt: { type: "date" },
        updatedAt: { type: "date" },
      },
    },
  },
};

/**
 * Helper to escape wildcard special characters
 */
const escapeWildcard = (str) =>
  String(str)
    .toLowerCase()
    .replace(/[\\*?]/g, "\\$&");

/**
 * Format a TblPointPlace row into an Elasticsearch document
 */
const toPointPlaceESDoc = (row) => {
  const plain = row.toJSON ? row.toJSON() : row;
  let geomObj = plain.geom;
  if (typeof geomObj === "string") {
    try {
      geomObj = JSON.parse(geomObj);
    } catch (_) {
      geomObj = null;
    }
  }

  let location = null;
  if (
    geomObj &&
    geomObj.type === "Point" &&
    Array.isArray(geomObj.coordinates) &&
    geomObj.coordinates.length >= 2
  ) {
    const lon = Number(geomObj.coordinates[0]);
    const lat = Number(geomObj.coordinates[1]);
    if (!isNaN(lat) && !isNaN(lon)) {
      location = { lat, lon };
    }
  }

  return {
    uuid: plain.uuid,
    name_place: plain.name_place || "",
    description: plain.description || null,
    kode_provinsi: plain.kode_provinsi || null,
    nama_provinsi: plain.nama_provinsi || null,
    kode_kabupaten: plain.kode_kabupaten || null,
    nama_kabupaten: plain.nama_kabupaten || null,
    uuid_user: plain.uuid_user || plain.user?.uuid || null,
    user: plain.user
      ? {
        uuid: plain.user.uuid,
        email: plain.user.email,
        username: plain.user.username,
      }
      : null,
    location,
    geom: geomObj,
    createdAt: plain.createdAt || new Date().toISOString(),
    updatedAt: plain.updatedAt || new Date().toISOString(),
  };
};

/**
 * Sync Provinsi rows to Elasticsearch
 */
const syncProvinsiToES = async (rows, { replace = false } = {}) => {
  if (!rows || rows.length === 0) return;
  await ensureIndex(INDICES.PROVINSI, INDEX_MAPPINGS[INDICES.PROVINSI]);

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const lines = [];
    for (const row of slice) {
      const plain = row.toJSON ? row.toJSON() : row;
      lines.push(
        JSON.stringify({
          index: {
            _index: INDICES.PROVINSI,
            _id: String(plain.kode_provinsi),
          },
        }),
      );
      lines.push(
        JSON.stringify({
          kode_provinsi: String(plain.kode_provinsi),
          nama_provinsi: plain.nama_provinsi,
        }),
      );
    }
    await bulkRequest(lines, { refresh: i + batchSize >= rows.length });
  }

  if (replace) {
    const codes = rows.map((r) => String(r.kode_provinsi));
    await deleteByQuery(INDICES.PROVINSI, {
      query: {
        bool: {
          must_not: [{ terms: { kode_provinsi: codes } }],
        },
      },
    });
  }
};

/**
 * Sync Kabupaten rows to Elasticsearch
 */
const syncKabupatenToES = async (rows, { replace = false } = {}) => {
  if (!rows || rows.length === 0) return;
  await ensureIndex(INDICES.KABUPATEN, INDEX_MAPPINGS[INDICES.KABUPATEN]);

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
 * Sync a single Point Place or batch of Point Places to Elasticsearch
 */
const syncPointPlaceToES = async (placeRow) => {
  if (!placeRow) return;
  await ensureIndex(INDICES.POINT_PLACES, INDEX_MAPPINGS[INDICES.POINT_PLACES]);
  const doc = toPointPlaceESDoc(placeRow);
  await indexDocument(INDICES.POINT_PLACES, doc.uuid, doc, { refresh: true });
};

const bulkSyncPointPlacesToES = async (placeRows) => {
  if (!placeRows || placeRows.length === 0) return;
  await ensureIndex(INDICES.POINT_PLACES, INDEX_MAPPINGS[INDICES.POINT_PLACES]);

  const batchSize = 200;
  for (let i = 0; i < placeRows.length; i += batchSize) {
    const slice = placeRows.slice(i, i + batchSize);
    const lines = [];
    for (const row of slice) {
      const doc = toPointPlaceESDoc(row);
      lines.push(
        JSON.stringify({
          index: {
            _index: INDICES.POINT_PLACES,
            _id: String(doc.uuid),
          },
        }),
      );
      lines.push(JSON.stringify(doc));
    }
    await bulkRequest(lines, { refresh: i + batchSize >= placeRows.length });
  }
};

/**
 * Initialize indices and perform initial seeding from PostgreSQL if out of sync
 */
const initElasticsearchAndSeed = async () => {
  const isAlive = await pingElasticsearch();
  if (!isAlive) {
    console.warn(
      "[Elasticsearch] Cluster belum aktif atau tidak terjangkau. Menggunakan fallback PostgreSQL.",
    );
    return false;
  }

  try {
    // 1. Ensure all 3 indices exist
    await ensureIndex(INDICES.PROVINSI, INDEX_MAPPINGS[INDICES.PROVINSI]);
    await ensureIndex(INDICES.KABUPATEN, INDEX_MAPPINGS[INDICES.KABUPATEN]);
    await ensureIndex(
      INDICES.POINT_PLACES,
      INDEX_MAPPINGS[INDICES.POINT_PLACES],
    );

    // 2. Seed Provinsi if DB count != ES count
    const [dbProvCount, esProvCount] = await Promise.all([
      TblGeoProvinsi.count(),
      countIndexDocuments(INDICES.PROVINSI),
    ]);
    if (dbProvCount > 0 && dbProvCount !== esProvCount) {
      const provRows = await TblGeoProvinsi.findAll({
        attributes: ["kode_provinsi", "nama_provinsi"],
      });
      await syncProvinsiToES(provRows);
      console.log(
        `[Elasticsearch Seed] Berhasil menyinkronkan ${provRows.length} data provinsi dari DB.`,
      );
    }

    // 3. Seed Kabupaten if DB count != ES count
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

    // 4. Seed Point Places if DB count != ES count
    const [dbPlaceCount, esPlaceCount] = await Promise.all([
      TblPointPlace.count(),
      countIndexDocuments(INDICES.POINT_PLACES),
    ]);
    if (dbPlaceCount > 0 && dbPlaceCount !== esPlaceCount) {
      const placeRows = await TblPointPlace.findAll({
        attributes: [
          "uuid",
          "name_place",
          "description",
          "kode_provinsi",
          "nama_provinsi",
          "kode_kabupaten",
          "nama_kabupaten",
          "uuid_user",
          "geom",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: DetailUsers,
            as: "user",
            attributes: ["uuid", "email", "username"],
          },
        ],
      });
      await bulkSyncPointPlacesToES(placeRows);
      console.log(
        `[Elasticsearch Seed] Berhasil menyinkronkan ${placeRows.length} data point places dari DB.`,
      );
    }

    console.log("[Elasticsearch] Inisialisasi & sinkronisasi index selesai.");
    return true;
  } catch (error) {
    console.warn(
      "[Elasticsearch Warning] Gagal saat inisialisasi/seeding:",
      error.message,
    );
    return false;
  }
};

/**
 * Search Provinsi in Elasticsearch
 */
const searchProvinsiES = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size) || 10;
  const from = (parseInt(page) - 1) * limit;
  const cleanSearch = String(search || "").trim();

  const query = cleanSearch
    ? {
      bool: {
        should: [
          { term: { kode_provinsi: { value: cleanSearch, boost: 5 } } },
          {
            match_phrase_prefix: {
              nama_provinsi: { query: cleanSearch, boost: 4 },
            },
          },
          {
            match: {
              nama_provinsi: {
                query: cleanSearch,
                fuzziness: "AUTO",
                operator: "and",
                boost: 2,
              },
            },
          },
          {
            wildcard: {
              "nama_provinsi.keyword": {
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
    ? ["_score", { kode_provinsi: "asc" }]
    : [{ kode_provinsi: "asc" }];

  const response = await searchIndex(INDICES.PROVINSI, {
    from,
    size: limit,
    track_total_hits: true,
    query,
    sort,
  });

  const hits = response?.hits?.hits || [];
  const totalData =
    typeof response?.hits?.total === "object"
      ? response.hits.total.value
      : response?.hits?.total || 0;

  return {
    items: hits.map((h) => h._source),
    totalData,
  };
};


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
  });

  const hits = response?.hits?.hits || [];
  const totalData =
    typeof response?.hits?.total === "object"
      ? response.hits.total.value
      : response?.hits?.total || 0;

  return {
    items: hits.map((h) => h._source),
    totalData,
  };
};

const searchPointPlacesES = async ({ page = 1, size = 10, search = "" }) => {
  const limit = parseInt(size) || 10;
  const from = (parseInt(page) - 1) * limit;
  const cleanSearch = String(search || "").trim();

  const query = cleanSearch
    ? {
      bool: {
        should: [
          {
            match_phrase_prefix: {
              name_place: { query: cleanSearch, boost: 4 },
            },
          },
          {
            multi_match: {
              query: cleanSearch,
              fields: [
                "name_place^3",
                "description^2",
                "nama_kabupaten^2",
                "nama_provinsi",
              ],
              fuzziness: "AUTO",
              operator: "and",
              boost: 2,
            },
          },
          {
            wildcard: {
              "name_place.keyword": {
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
    ? ["_score", { createdAt: "desc" }]
    : [{ createdAt: "desc" }];

  const response = await searchIndex(INDICES.POINT_PLACES, {
    from,
    size: limit,
    track_total_hits: true,
    query,
    sort,
  });

  const hits = response?.hits?.hits || [];
  const totalData =
    typeof response?.hits?.total === "object"
      ? response.hits.total.value
      : response?.hits?.total || 0;

  return {
    items: hits.map((h) => h._source),
    totalData,
  };
};

module.exports = {
  INDICES,
  initElasticsearchAndSeed,
  syncProvinsiToES,
  syncKabupatenToES,
  syncPointPlaceToES,
  bulkSyncPointPlacesToES,
  searchProvinsiES,
  searchKabupatenES,
  searchPointPlacesES,
};
