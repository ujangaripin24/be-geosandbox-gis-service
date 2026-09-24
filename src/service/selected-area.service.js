const { sequelize } = require("../models");
const { toGeoJSONFeature } = require("../validation/selected-area.validation");

const getKabupatenByProvinsi = async (kodeProvinsi) => {
  const [rows] = await sequelize.query(
    `SELECT DISTINCT
        wilayah.kode_kabupaten,
        wilayah.nama_kabupaten,
        wilayah.kode_provinsi
     FROM tbl_geo_wilayah AS wilayah
     WHERE wilayah.kode_provinsi = :kodeProvinsi
       AND wilayah.kode_kabupaten IS NOT NULL
       AND wilayah.nama_kabupaten IS NOT NULL
     ORDER BY wilayah.nama_kabupaten ASC`,
    { replacements: { kodeProvinsi } },
  );

  return rows;
};

const getKabupatenByProvinsiAreaService = async (kodeProvinsi) => {
  let [rows] = await sequelize.query(
    `SELECT DISTINCT
        wilayah.kode_kabupaten,
        wilayah.nama_kabupaten,
        wilayah.kode_provinsi,
        ST_AsGeoJSON(wilayah.geom) AS geom
     FROM tbl_geo_wilayah AS wilayah
     WHERE wilayah.kode_provinsi = :kodeProvinsi
       AND wilayah.kode_kabupaten IS NOT NULL
       AND wilayah.nama_kabupaten IS NOT NULL
     ORDER BY wilayah.nama_kabupaten ASC`,
    { replacements: { kodeProvinsi } },
  );

  return {
    type: "FeatureCollection",
    features: rows.map(toGeoJSONFeature),
  };
};

const getSelectedAreaPointerService = async ({
  min_lon,
  min_lat,
  max_lon,
  max_lat,
}) => {
  const minLon = parseFloat(min_lon);
  const minLat = parseFloat(min_lat);
  const maxLon = parseFloat(max_lon);
  const maxLat = parseFloat(max_lat);

  const [rows] = await sequelize.query(
    `SELECT 
        point.uuid,
        point.name_place,
        point.description,
        point.kode_provinsi,
        point.nama_provinsi,
        point.kode_kabupaten,
        point.nama_kabupaten,
        point.uuid_user,
        ST_AsGeoJSON(point.geom) AS geom,
        COALESCE(
          json_agg(
            json_build_object('uuid', img.uuid, 'link_img', img.link_img)
          ) FILTER (WHERE img.uuid IS NOT NULL),
          '[]'
        ) AS images,
        point."createdAt",
        point."updatedAt"
     FROM tbl_geo_point_place AS point
     LEFT JOIN tbl_geo_point_place_image AS img ON img.uuid_place = point.uuid
     WHERE ST_Intersects(
        point.geom,
        ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)
     )
     GROUP BY point.uuid
     ORDER BY point."createdAt" DESC;`,
    {
      replacements: { minLon, minLat, maxLon, maxLat },
    },
  );

  return {
    type: "FeatureCollection",
    features: rows.map(toGeoJSONFeature),
    // bbox: [minLon, minLat, maxLon, maxLat],
    totalData: rows.length,
  };
};

module.exports = {
  getKabupatenByProvinsi,
  getKabupatenByProvinsiAreaService,
  getSelectedAreaPointerService,
};
