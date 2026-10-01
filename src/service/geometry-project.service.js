const { sequelize, TblProjectGeo, TblFolderProject } = require("../models");

const validateGeometryInsideKabupaten = async (
  geomObj,
  kode_provinsi,
  kode_kabupaten
) => {
  const geomJson = JSON.stringify(geomObj);

  const [rows] = await sequelize.query(
    `SELECT 
        w.nama_kabupaten,
        ST_Covers(
          w.geom, 
          ST_SetSRID(ST_GeomFromGeoJSON(:geomJson), 4326)
        ) AS is_inside
     FROM tbl_geo_wilayah AS w
     WHERE w.kode_kabupaten = :kode_kabupaten AND w.kode_provinsi = :kode_provinsi
     LIMIT 1;`,
    {
      replacements: { geomJson, kode_kabupaten, kode_provinsi },
    }
  );

  if (!rows || rows.length === 0) {
    throw new Error(
      `Batas wilayah kabupaten dengan kode '${kode_kabupaten}' tidak ditemukan`
    );
  }

  const { nama_kabupaten, is_inside } = rows[0];

  if (!is_inside) {
    const geomType = geomObj.type || "Geometri";
    throw new Error(
      `${geomType} berada di luar batas wilayah kabupaten '${nama_kabupaten}'`
    );
  }

  return { nama_kabupaten };
};

const CreateGeometryProjectService = async ({
  uuid_project_geo,
  uuid_user,
  name,
  detail,
  geometry,
  properties,
  type,
  features,
}) => {
  const project = await TblProjectGeo.findOne({
    where: { uuid: uuid_project_geo },
  });

  if (!project) {
    throw new Error("Project geo tidak ditemukan");
  }

  if (project.uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses ke project geo ini");
  }

  const { kode_provinsi, kode_kabupaten } = project;

  let itemsToProcess = [];

  if (type === "FeatureCollection" && Array.isArray(features)) {
    itemsToProcess = features.map((feat) => ({
      name: feat.properties?.name || name || null,
      detail: feat.properties?.detail || detail || null,
      geometry: feat.geometry,
    }));
  } else if (Array.isArray(features)) {
    itemsToProcess = features.map((feat) => ({
      name: feat.properties?.name || name || null,
      detail: feat.properties?.detail || detail || null,
      geometry: feat.geometry || feat,
    }));
  } else if (geometry) {
    itemsToProcess.push({
      name: name || properties?.name || null,
      detail: detail || properties?.detail || null,
      geometry,
    });
  } else if (type === "Feature" && geometry) {
    itemsToProcess.push({
      name: properties?.name || name || null,
      detail: properties?.detail || detail || null,
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
        throw new Error("Struktur objek geometri tidak memiliki type/coordinates");
      }

      await validateGeometryInsideKabupaten(
        item.geometry,
        kode_provinsi,
        kode_kabupaten
      );

      const geomJson = JSON.stringify(item.geometry);

      const [insertedRows] = await sequelize.query(
        `INSERT INTO tbl_geometry_project (
            uuid,
            name,
            detail,
            uuid_project_geo,
            uuid_user,
            geom,
            "createdAt",
            "updatedAt"
         ) VALUES (
            gen_random_uuid(),
            :name,
            :detail,
            :uuid_project_geo,
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
            uuid_project_geo,
            uuid_user,
            geomJson,
          },
          transaction,
        }
      );

      if (insertedRows && insertedRows[0]) {
        createdUuids.push(insertedRows[0].uuid);
      }
    }

    await transaction.commit();

    return GetGeometriesByProjectService(uuid_project_geo, uuid_user);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const GetGeometriesByProjectService = async (uuid_project_geo, uuid_user) => {
  const project = await TblProjectGeo.findOne({
    where: { uuid: uuid_project_geo },
  });

  if (!project) {
    throw new Error("Project geo tidak ditemukan");
  }

  if (uuid_user && project.uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses ke project geo ini");
  }

  const [rows] = await sequelize.query(
    `SELECT 
        g.uuid,
        g.name,
        g.detail,
        g.uuid_project_geo,
        p.name AS nama_project,
        p.uuid_folder,
        f.name AS nama_folder,
        g.uuid_user,
        u.username,
        u.email,
        p.kode_provinsi,
        p.nama_provinsi,
        p.kode_kabupaten,
        p.nama_kabupaten,
        g."createdAt",
        g."updatedAt",
        ST_AsGeoJSON(g.geom) AS geom_json
     FROM tbl_geometry_project g
     JOIN tbl_project_geo p ON g.uuid_project_geo = p.uuid
     JOIN tbl_folder_project f ON p.uuid_folder = f.uuid
     LEFT JOIN tbl_users u ON g.uuid_user = u.uuid
     WHERE g.uuid_project_geo = :uuid_project_geo
     ORDER BY g."createdAt" ASC;`,
    {
      replacements: { uuid_project_geo },
    }
  );

  const features = rows.map((row) => {
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
        uuid_project_geo: row.uuid_project_geo,
        nama_project: row.nama_project,
        uuid_folder: row.uuid_folder,
        nama_folder: row.nama_folder,
        uuid_user: row.uuid_user,
        username: row.username || null,
        email: row.email || null,
        kode_provinsi: row.kode_provinsi,
        nama_provinsi: row.nama_provinsi,
        kode_kabupaten: row.kode_kabupaten,
        nama_kabupaten: row.nama_kabupaten,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      geometry,
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
};

const GetDetailGeometryProjectService = async (uuid, uuid_user) => {
  const [rows] = await sequelize.query(
    `SELECT 
        g.uuid,
        g.name,
        g.detail,
        g.uuid_project_geo,
        p.name AS nama_project,
        p.uuid_folder,
        f.name AS nama_folder,
        g.uuid_user,
        u.username,
        u.email,
        p.kode_provinsi,
        p.nama_provinsi,
        p.kode_kabupaten,
        p.nama_kabupaten,
        g."createdAt",
        g."updatedAt",
        ST_AsGeoJSON(g.geom) AS geom_json
     FROM tbl_geometry_project g
     JOIN tbl_project_geo p ON g.uuid_project_geo = p.uuid
     JOIN tbl_folder_project f ON p.uuid_folder = f.uuid
     LEFT JOIN tbl_users u ON g.uuid_user = u.uuid
     WHERE g.uuid = :uuid
     LIMIT 1;`,
    {
      replacements: { uuid },
    }
  );

  if (!rows || rows.length === 0) {
    throw new Error("Detail geometri project tidak ditemukan");
  }

  const row = rows[0];

  if (uuid_user && row.uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses ke geometri project ini");
  }

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
      uuid_project_geo: row.uuid_project_geo,
      nama_project: row.nama_project,
      uuid_folder: row.uuid_folder,
      nama_folder: row.nama_folder,
      uuid_user: row.uuid_user,
      username: row.username || null,
      email: row.email || null,
      kode_provinsi: row.kode_provinsi,
      nama_provinsi: row.nama_provinsi,
      kode_kabupaten: row.kode_kabupaten,
      nama_kabupaten: row.nama_kabupaten,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    geometry,
  };
};

const UpdateGeometryProjectService = async (
  uuid,
  { name, detail, geometry },
  uuid_user
) => {
  const [existingRows] = await sequelize.query(
    `SELECT g.uuid, g.uuid_user, g.uuid_project_geo, p.kode_provinsi, p.kode_kabupaten 
     FROM tbl_geometry_project g
     JOIN tbl_project_geo p ON g.uuid_project_geo = p.uuid
     WHERE g.uuid = :uuid
     LIMIT 1;`,
    {
      replacements: { uuid },
    }
  );

  if (!existingRows || existingRows.length === 0) {
    throw new Error("Geometri project tidak ditemukan");
  }

  const existing = existingRows[0];

  if (uuid_user && existing.uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses untuk mengubah geometri ini");
  }

  let geomSqlClause = "";
  const replacements = {
    uuid,
    name: name !== undefined ? name : null,
    detail: detail !== undefined ? detail : null,
  };

  if (geometry) {
    await validateGeometryInsideKabupaten(
      geometry,
      existing.kode_provinsi,
      existing.kode_kabupaten
    );
    const geomJson = JSON.stringify(geometry);
    geomSqlClause = `, geom = ST_SetSRID(ST_GeomFromGeoJSON(:geomJson), 4326)`;
    replacements.geomJson = geomJson;
  }

  let nameClause = name !== undefined ? `name = :name,` : "";
  let detailClause = detail !== undefined ? `detail = :detail,` : "";

  await sequelize.query(
    `UPDATE tbl_geometry_project 
     SET ${nameClause} ${detailClause} "updatedAt" = NOW() ${geomSqlClause}
     WHERE uuid = :uuid;`,
    {
      replacements,
    }
  );

  return GetDetailGeometryProjectService(uuid, uuid_user);
};

const DeleteGeometryProjectService = async (uuid, uuid_user) => {
  const [existingRows] = await sequelize.query(
    `SELECT uuid, uuid_user FROM tbl_geometry_project WHERE uuid = :uuid LIMIT 1;`,
    {
      replacements: { uuid },
    }
  );

  if (!existingRows || existingRows.length === 0) {
    throw new Error("Geometri project tidak ditemukan");
  }

  if (uuid_user && existingRows[0].uuid_user !== uuid_user) {
    throw new Error("Anda tidak memiliki akses untuk menghapus geometri ini");
  }

  await sequelize.query(
    `DELETE FROM tbl_geometry_project WHERE uuid = :uuid;`,
    {
      replacements: { uuid },
    }
  );

  return { uuid };
};

module.exports = {
  CreateGeometryProjectService,
  GetGeometriesByProjectService,
  GetDetailGeometryProjectService,
  UpdateGeometryProjectService,
  DeleteGeometryProjectService,
};
