const { body } = require("express-validator");

const allowedGeomTypes = [
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
];

const isValidGeometry = (geom) => {
  if (!geom || typeof geom !== "object") return false;
  if (!allowedGeomTypes.includes(geom.type)) return false;
  if (geom.type === "GeometryCollection") {
    return Array.isArray(geom.geometries);
  }
  return Array.isArray(geom.coordinates);
};

const CreateMultiGeomValidation = [
  body("name")
    .optional({ checkFalsy: false })
    .isString()
    .withMessage("Name harus berupa string"),
  body("detail")
    .optional({ checkFalsy: false })
    .isString()
    .withMessage("Detail harus berupa string"),
  body().custom((value, { req }) => {
    if (req.body.type === "FeatureCollection") {
      if (!Array.isArray(req.body.features) || req.body.features.length === 0) {
        throw new Error(
          "FeatureCollection harus memiliki array features yang tidak kosong",
        );
      }
      for (let i = 0; i < req.body.features.length; i++) {
        const feat = req.body.features[i];
        if (!isValidGeometry(feat?.geometry)) {
          throw new Error(
            `Feature ke-${i + 1} tidak memiliki geometry yang valid`,
          );
        }
      }
      return true;
    }

    if (req.body.type === "Feature") {
      if (!isValidGeometry(req.body.geometry)) {
        throw new Error(
          "Feature GeoJSON harus memiliki geometry yang valid (Point, LineString, Polygon, dll.)",
        );
      }
      return true;
    }

    const geom = req.body.geometry;
    if (!geom) {
      throw new Error("Objek geometry wajib disertakan");
    }
    if (!isValidGeometry(geom)) {
      throw new Error(
        `Tipe geometry '${geom?.type}' tidak valid. Tipe yang didukung: ${allowedGeomTypes.join(", ")}`,
      );
    }

    return true;
  }),
];

const UpdateMultiGeomValidation = [
  body("name")
    .optional({ checkFalsy: false })
    .isString()
    .withMessage("Name harus berupa string"),
  body("detail")
    .optional({ checkFalsy: false })
    .isString()
    .withMessage("Detail harus berupa string"),
  body("geometry")
    .optional()
    .custom((geom) => {
      if (!isValidGeometry(geom)) {
        throw new Error(
          `Tipe geometry '${geom?.type}' tidak valid. Tipe yang didukung: ${allowedGeomTypes.join(", ")}`,
        );
      }
      return true;
    }),
];

module.exports = {
  allowedGeomTypes,
  isValidGeometry,
  CreateMultiGeomValidation,
  UpdateMultiGeomValidation,
};
