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
const { TblGeoProvinsi } = require("../../models");

const INDICES = {
    PROVINSI: "gis_provinsi",
};

const PROVINSI_MAPPING = {
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
 * Sync Provinsi rows to Elasticsearch
 */
const syncProvinsiToES = async (rows, { replace = false } = {}) => {
    if (!rows || rows.length === 0) return;
    await ensureIndex(INDICES.PROVINSI, PROVINSI_MAPPING);

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
 * Initialize Provinsi index & seed from DB if out of sync
 */
const initProvinsiIndexAndSeed = async () => {
    const isAlive = await pingElasticsearch();
    if (!isAlive) {
        console.warn(
            "[Elasticsearch - Provinsi] Cluster belum aktif. Menggunakan fallback PostgreSQL.",
        );
        return false;
    }

    try {
        await ensureIndex(INDICES.PROVINSI, PROVINSI_MAPPING);

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
        return true;
    } catch (error) {
        console.warn(
            "[Elasticsearch - Provinsi] Gagal inisialisasi/seeding:",
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
        ...(cleanSearch
            ? { suggest: buildTermSuggester(cleanSearch, "nama_provinsi.standard") }
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
        ["nama_provinsi"],
    );

    return {
        items,
        totalData,
        suggestion,
    };
};

module.exports = {
    INDICES,
    PROVINSI_MAPPING,
    initProvinsiIndexAndSeed,
    syncProvinsiToES,
    searchProvinsiES,
};