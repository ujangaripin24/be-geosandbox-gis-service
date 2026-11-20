const dotenv = require("dotenv");

dotenv.config();

const ELASTICSEARCH_URL = (
  process.env.ELASTICSEARCH_URL || "http://global-elasticsearch:9200"
).replace(/\/+$/, "");

const ELASTICSEARCH_TIMEOUT_MS = Number(
  process.env.ELASTICSEARCH_TIMEOUT_MS || 3000,
);

/**
 * Low-level HTTP wrapper for Elasticsearch REST API using native fetch.
 */
const esRequest = async (
  path,
  { method = "GET", body = null, headers = {}, timeoutMs = ELASTICSEARCH_TIMEOUT_MS } = {},
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

module.exports = {
  ELASTICSEARCH_URL,
  esRequest,
  pingElasticsearch,
  ensureIndex,
  countIndexDocuments,
  bulkRequest,
  indexDocument,
  deleteByQuery,
  searchIndex,
};
