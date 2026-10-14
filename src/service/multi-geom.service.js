const { sequelize } = require("../models");

/**
 * Format baris query database menjadi GeoJSON Feature
 */
const toGeoJsonFeature = (row) => {
  const geometry =
    typeof row.geom_json === "string"
      ? JSON.parse(row.geom_json)
      : row.geom_json;

  return {
    type: "Feature",
    properties: {
      uuid: row.uuid,
      name: row.name || null,
      detail: row.detail || null,
      uuid_user: row.uuid_user,
      username: row.username || null,
      email: row.email || null,
      user: {
        uuid: row.uuid_user,
        username: row.username || null,
        email: row.email || null,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    geometry,
  };
};

/**
 * CREATE Multi Geometry
 * Mendukung single feature, direct geometry, maupun FeatureCollection dari Mapbox Draw
 */
const CreateMultiGeomService = async ({
  uuid_user,
  name,
  detail,
  geometry,
  properties,
  type,
  features,
}) => {
  if (!uuid_user) {
    throw new Error("UUID user tidak ditemukan");
  }

  let itemsToProcess = [];

  if (type === "FeatureCollection" && Array.isArray(features)) {
    itemsToProcess = features.map((feat) => ({
      name: feat.properties?.name || name || null,
      detail: feat.properties?.detail || detail || null,
      geometry: feat.geometry,
    }));
  } else if (type === "Feature" && geometry) {
    itemsToProcess.push({
      name: properties?.name || name || null,
      detail: properties?.detail || detail || null,
      geometry,
    });
  } else if (geometry) {
    itemsToProcess.push({
      name: name || properties?.name || null,
      detail: detail || properties?.detail || null,
      geometry,
    });
  } else {
    throw new Error("Format objek geometri tidak valid");
  }

  const transaction = await sequelize.transaction();

  try {
    const createdUuids = [];

    for (const item of itemsToProcess) {
      if (!item.geometry || !item.geometry.type || !item.geometry.coordinates) {
        throw new Error(
          "Struktur objek geometri tidak memiliki properti type/coordinates",
        );
      }

      const geomJson = JSON.stringify(item.geometry);

      const [insertedRows] = await sequelize.query(
        `INSERT INTO tbl_multi_geom (
            uuid,
            name,
            detail,
            uuid_user,
            geom,
            "createdAt",
            "updatedAt"
         ) VALUES (
            gen_random_uuid(),
            :name,
            :detail,
            :uuid_user,
            ST_SetSRID(ST_GeomFromGeoJSON(:geomJson), 4326),
            NOW(),
            NOW()
         )
         RETURNING uuid;`,
        {
          replacements: {
            name: item.name,
            detail: item.detail,
            uuid_user,
            geomJson,
          },
          transaction,
        },
      );

      if (insertedRows && insertedRows.length > 0) {
        createdUuids.push(insertedRows[0].uuid);
      }
    }

    await transaction.commit();

    if (createdUuids.length === 1) {
      return await GetDetailMultiGeomService(createdUuids[0]);
    }

    const [rows] = await sequelize.query(
      `SELECT 
          m.uuid,
          m.name,
          m.detail,
          m.uuid_user,
          u.username,
          u.email,
          m."createdAt",
          m."updatedAt",
          ST_AsGeoJSON(m.geom) AS geom_json
       FROM tbl_multi_geom m
       LEFT JOIN tbl_users u ON m.uuid_user = u.uuid
       WHERE m.uuid IN (:createdUuids)
       ORDER BY m."createdAt" ASC;`,
      {
        replacements: { createdUuids },
      },
    );

    return {
      type: "FeatureCollection",
      features: rows.map(toGeoJsonFeature),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * GET ALL Multi Geometries (FeatureCollection)
 */
const GetAllMultiGeomService = async ({ uuid_user } = {}) => {
  let whereClause = "";
  const replacements = {};

  if (uuid_user) {
    whereClause = "WHERE m.uuid_user = :uuid_user";
    replacements.uuid_user = uuid_user;
  }

  const [rows] = await sequelize.query(
    `SELECT 
        m.uuid,
        m.name,
        m.detail,
        m.uuid_user,
        u.username,
        u.email,
        m."createdAt",
        m."updatedAt",
        ST_AsGeoJSON(m.geom) AS geom_json
     FROM tbl_multi_geom m
     LEFT JOIN tbl_users u ON m.uuid_user = u.uuid
     ${whereClause}
     ORDER BY m."createdAt" DESC;`,
    {
      replacements,
    },
  );

  return {
    type: "FeatureCollection",
    features: rows.map(toGeoJsonFeature),
  };
};

/**
 * GET DETAIL Multi Geometry By UUID (Feature)
 */
const GetDetailMultiGeomService = async (uuid) => {
  const [rows] = await sequelize.query(
    `SELECT 
        m.uuid,
        m.name,
        m.detail,
        m.uuid_user,
        u.username,
        u.email,
        m."createdAt",
        m."updatedAt",
        ST_AsGeoJSON(m.geom) AS geom_json
     FROM tbl_multi_geom m
     LEFT JOIN tbl_users u ON m.uuid_user = u.uuid
     WHERE m.uuid = :uuid
     LIMIT 1;`,
    {
      replacements: { uuid },
    },
  );

  if (!rows || rows.length === 0) {
    throw new Error("Data multi geometry tidak ditemukan");
  }

  return toGeoJsonFeature(rows[0]);
};

/**
 * UPDATE Multi Geometry
 */
const UpdateMultiGeomService = async (
  uuid,
  { name, detail, geometry, properties },
  uuid_user,
) => {
  const [existingRows] = await sequelize.query(
    `SELECT uuid, uuid_user FROM tbl_multi_geom WHERE uuid = :uuid LIMIT 1;`,
    {
      replacements: { uuid },
    },
  );

  if (!existingRows || existingRows.length === 0) {
    throw new Error("Data multi geometry tidak ditemukan");
  }

  const existing = existingRows[0];

  if (uuid_user && existing.uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses untuk mengubah multi geometry ini");
  }

  const finalName = name !== undefined ? name : properties?.name;
  const finalDetail = detail !== undefined ? detail : properties?.detail;

  const replacements = {
    uuid,
    name: finalName !== undefined ? finalName : null,
    detail: finalDetail !== undefined ? finalDetail : null,
  };

  let updateSql = `
    UPDATE tbl_multi_geom
    SET
      name = COALESCE(:name, name),
      detail = COALESCE(:detail, detail),
      "updatedAt" = NOW()
  `;

  if (geometry) {
    if (!geometry.type || !geometry.coordinates) {
      throw new Error("Struktur geometri tidak valid");
    }
    replacements.geomJson = JSON.stringify(geometry);
    updateSql += `, geom = ST_SetSRID(ST_GeomFromGeoJSON(:geomJson), 4326)`;
  }

  updateSql += ` WHERE uuid = :uuid;`;

  await sequelize.query(updateSql, {
    replacements,
  });

  return await GetDetailMultiGeomService(uuid);
};

/**
 * DELETE Multi Geometry
 */
const DeleteMultiGeomService = async (uuid, uuid_user) => {
  const [existingRows] = await sequelize.query(
    `SELECT uuid, uuid_user FROM tbl_multi_geom WHERE uuid = :uuid LIMIT 1;`,
    {
      replacements: { uuid },
    },
  );

  if (!existingRows || existingRows.length === 0) {
    throw new Error("Data multi geometry tidak ditemukan");
  }

  const existing = existingRows[0];

  if (uuid_user && existing.uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses untuk menghapus multi geometry ini");
  }

  await sequelize.query(`DELETE FROM tbl_multi_geom WHERE uuid = :uuid;`, {
    replacements: { uuid },
  });

  return {
    uuid,
    message: "Multi geometry berhasil dihapus",
  };
};

module.exports = {
  toGeoJsonFeature,
  CreateMultiGeomService,
  GetAllMultiGeomService,
  GetDetailMultiGeomService,
  UpdateMultiGeomService,
  DeleteMultiGeomService,
};
