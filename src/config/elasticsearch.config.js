const dotenv = require("dotenv");

dotenv.config();

const ELASTICSEARCH_URL = (
  process.env.ELASTICSEARCH_URL || "http://global-elasticsearch:9200"
).replace(/\/+$/, "");

const ELASTICSEARCH_TIMEOUT_MS = Number(
  process.env.ELASTICSEARCH_TIMEOUT_MS || 3000,
);

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

/**
 * Low-level HTTP wrapper for Elasticsearch REST API using native fetch.
 */
const esRequest = async (
  path,
  {
    method = "GET",
    body = null,
    headers = {},
    timeoutMs = ELASTICSEARCH_TIMEOUT_MS,
  } = {},
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestHeaders = {
      Accept: "application/json",
      ...headers,
    };

    let payload = body;
    if (body !== null && typeof body === "object" && !Buffer.isBuffer(body)) {
      requestHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const response = await fetch(`${ELASTICSEARCH_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: payload,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = text;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } finally {
    clearTimeout(timer);
  }
};

const pingElasticsearch = async () => {
  try {
    const res = await esRequest("/_cluster/health", { method: "GET" });
    return res.ok;
  } catch (error) {
    return false;
  }
};

const ensureIndex = async (indexName, indexConfig) => {
  const headRes = await esRequest(`/${indexName}`, { method: "HEAD" });
  if (headRes.status === 404) {
    const createRes = await esRequest(`/${indexName}`, {
      method: "PUT",
      body: indexConfig,
    });
    if (!createRes.ok) {
      throw new Error(
        `Gagal membuat index '${indexName}': ${JSON.stringify(createRes.data)}`,
      );
    }
    console.log(`[Elasticsearch] Index '${indexName}' berhasil dibuat.`);
  } else if (headRes.ok && indexConfig?.mappings) {
    await esRequest(`/${indexName}/_mapping`, {
      method: "PUT",
      body: indexConfig.mappings,
    });
  }
};

const countIndexDocuments = async (indexName) => {
  const res = await esRequest(`/${indexName}/_count`, { method: "GET" });
  if (!res.ok) return 0;
  return res.data?.count || 0;
};

const bulkRequest = async (ndjsonLines, { refresh = false } = {}) => {
  if (!ndjsonLines || ndjsonLines.length === 0) return { ok: true };
  const body = `${ndjsonLines.join("\n")}\n`;
  const query = refresh ? "?refresh=true" : "";
  const res = await esRequest(`/_bulk${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-ndjson" },
    body,
    timeoutMs: Math.max(ELASTICSEARCH_TIMEOUT_MS, 10000),
  });

  if (!res.ok) {
    throw new Error(
      `Elasticsearch bulk request gagal [${res.status}]: ${JSON.stringify(res.data)}`,
    );
  }
  return res;
};

const indexDocument = async (indexName, id, doc, { refresh = true } = {}) => {
  const query = refresh ? "?refresh=true" : "";
  const res = await esRequest(
    `/${indexName}/_doc/${encodeURIComponent(id)}${query}`,
    {
      method: "PUT",
      body: doc,
    },
  );
  if (!res.ok) {
    throw new Error(
      `Gagal mengindeks dokumen ${id} ke '${indexName}': ${JSON.stringify(res.data)}`,
    );
  }
  return res.data;
};

const deleteByQuery = async (indexName, queryBody, { refresh = true } = {}) => {
  const query = refresh ? "?refresh=true" : "";
  const res = await esRequest(`/${indexName}/_delete_by_query${query}`, {
    method: "POST",
    body: queryBody,
  });
  return res.data;
};

const searchIndex = async (indexName, searchBody) => {
  const res = await esRequest(`/${indexName}/_search`, {
    method: "POST",
    body: searchBody,
  });

  if (!res.ok) {
    throw new Error(
      `Elasticsearch search gagal pada '${indexName}' [${res.status}]: ${JSON.stringify(res.data)}`,
    );
  }

  return res.data;
};

const escapeWildcard = (str) =>
  String(str)
    .toLowerCase()
    .replace(/[\\*?]/g, "\\$&");

const levenshteinDistance = (a = "", b = "") => {
  const s1 = String(a).toLowerCase();
  const s2 = String(b).toLowerCase();
  const dp = Array.from({ length: s1.length + 1 }, () =>
    new Array(s2.length + 1).fill(0),
  );

  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[s1.length][s2.length];
};

const toTitleCase = (str = "") =>
  String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildTermSuggester = (cleanSearch, fieldName) => {
  if (!cleanSearch) return undefined;
  return {
    did_you_mean: {
      text: cleanSearch,
      term: {
        field: fieldName,
        suggest_mode: "popular",
        prefix_length: 0,
        min_word_length: 3,
        max_edits: 2,
        size: 3,
      },
    },
  };
};

const resolveDidYouMeanSuggestion = (
  cleanSearch,
  response,
  items = [],
  candidateFields = [],
) => {
  if (!cleanSearch || cleanSearch.length < 3) return null;
  const lowerQuery = cleanSearch.toLowerCase().trim();

  for (const item of items) {
    for (const field of candidateFields) {
      const val = String(item?.[field] || "").toLowerCase();
      if (val && val.includes(lowerQuery)) {
        return null;
      }
    }
  }

  const suggestEntries = response?.suggest?.did_you_mean;
  if (Array.isArray(suggestEntries) && suggestEntries.length > 0) {
    let hasCorrection = false;
    const correctedTokens = suggestEntries.map((entry) => {
      if (Array.isArray(entry.options) && entry.options.length > 0) {
        const bestOption = entry.options[0].text;
        if (
          bestOption &&
          bestOption.toLowerCase() !== entry.text.toLowerCase()
        ) {
          hasCorrection = true;
          return bestOption;
        }
      }
      return entry.text;
    });

    if (hasCorrection) {
      return toTitleCase(correctedTokens.join(" "));
    }
  }

  if (items.length > 0) {
    const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);
    const candidateNames = [];

    for (const item of items.slice(0, 5)) {
      for (const field of candidateFields) {
        if (item?.[field]) candidateNames.push(String(item[field]));
      }
    }

    const correctedQueryTokens = [];
    let anyTokenCorrected = false;

    for (const qToken of queryTokens) {
      let bestWord = qToken;
      let bestDist = Infinity;

      for (const fullName of candidateNames) {
        const words = fullName
          .split(/[\s,.-]+/)
          .map((w) => w.trim())
          .filter((w) => w.length >= 2);

        for (const word of words) {
          const lowerWord = word.toLowerCase();
          if (lowerWord.includes(qToken)) {
            bestWord = word;
            bestDist = 0;
            break;
          }
          const dist = levenshteinDistance(qToken, lowerWord);
          if (dist < bestDist && dist <= 2) {
            bestDist = dist;
            bestWord = word;
          }
        }
        if (bestDist === 0) break;
      }

      if (bestDist > 0 && bestDist <= 2) {
        anyTokenCorrected = true;
      }
      correctedQueryTokens.push(bestWord);
    }

    if (anyTokenCorrected) {
      return toTitleCase(correctedQueryTokens.join(" "));
    }
  }

  return null;
};

module.exports = {
  ELASTICSEARCH_URL,
  COMMON_ANALYSIS_SETTINGS,
  esRequest,
  pingElasticsearch,
  ensureIndex,
  countIndexDocuments,
  bulkRequest,
  indexDocument,
  deleteByQuery,
  searchIndex,
  escapeWildcard,
  buildTermSuggester,
  resolveDidYouMeanSuggestion,
};
