const {
  COMMON_ANALYSIS_SETTINGS,
  pingElasticsearch,
  ensureIndex,
  countIndexDocuments,
  bulkRequest,
  indexDocument,
  searchIndex,
  escapeWildcard,
  buildTermSuggester,
  resolveDidYouMeanSuggestion,
} = require("../../config/elasticsearch.config");
const { TblPointPlace, DetailUsers } = require("../../models");

const INDICES = {
  POINT_PLACES: "gis_point_places",
};

const POINT_PLACES_MAPPING = {
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
          standard: {
            type: "text",
            analyzer: "autocomplete_search_analyzer",
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
          standard: {
            type: "text",
            analyzer: "autocomplete_search_analyzer",
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
          standard: {
            type: "text",
            analyzer: "autocomplete_search_analyzer",
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
};

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
 * Sync a single Point Place to Elasticsearch
 */
const syncPointPlaceToES = async (placeRow) => {
  if (!placeRow) return;
  await ensureIndex(INDICES.POINT_PLACES, POINT_PLACES_MAPPING);
  const doc = toPointPlaceESDoc(placeRow);
  await indexDocument(INDICES.POINT_PLACES, doc.uuid, doc, { refresh: true });
};

/**
 * Bulk sync multiple Point Places to Elasticsearch
 */
const bulkSyncPointPlacesToES = async (placeRows) => {
  if (!placeRows || placeRows.length === 0) return;
  await ensureIndex(INDICES.POINT_PLACES, POINT_PLACES_MAPPING);

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
 * Initialize Point Places index & seed from DB if out of sync
 */
const initPointPlacesIndexAndSeed = async () => {
  const isAlive = await pingElasticsearch();
  if (!isAlive) {
    console.warn(
      "[Elasticsearch - PointPlaces] Cluster belum aktif. Menggunakan fallback PostgreSQL.",
    );
    return false;
  }

  try {
    await ensureIndex(INDICES.POINT_PLACES, POINT_PLACES_MAPPING);

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
    return true;
  } catch (error) {
    console.warn(
      "[Elasticsearch - PointPlaces] Gagal inisialisasi/seeding:",
      error.message,
    );
    return false;
  }
};

/**
 * Search Point Places in Elasticsearch
 */
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
    ...(cleanSearch
      ? { suggest: buildTermSuggester(cleanSearch, "name_place.standard") }
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
    ["name_place", "nama_kabupaten", "nama_provinsi"],
  );

  return {
    items,
    totalData,
    suggestion,
  };
};

module.exports = {
  INDICES,
  POINT_PLACES_MAPPING,
  toPointPlaceESDoc,
  initPointPlacesIndexAndSeed,
  syncPointPlaceToES,
  bulkSyncPointPlacesToES,
  searchPointPlacesES,
};
