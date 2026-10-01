const { TblProjectGeo } = require("../models");
const { formatError } = require("../pkg/error-formatter.pkg");

const checkProjectGeoOwnership = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user?.uuid;

    if (!uuid) {
      return res
        .status(400)
        .json(formatError("Parameter UUID tidak ditemukan", "uuid"));
    }

    if (!uuid_user) {
      return res.status(401).json(formatError("Unauthorized access", "auth"));
    }

    const project = await TblProjectGeo.findOne({
      where: { uuid },
    });

    if (!project) {
      return res
        .status(404)
        .json(formatError("Project geo tidak ditemukan", "uuid"));
    }

    if (project.uuid_user !== uuid_user) {
      return res
        .status(403)
        .json(
          formatError("Anda tidak memiliki akses untuk project geo ini", "forbidden")
        );
    }

    req.projectGeo = project;
    next();
  } catch (error) {
    console.error("Error in checkProjectGeoOwnership middleware:", error.message);
    return res
      .status(500)
      .json(formatError("Terjadi kesalahan pada server", "server"));
  }
};

module.exports = {
  checkProjectGeoOwnership,
};
