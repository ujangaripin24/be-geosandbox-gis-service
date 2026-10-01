const { TblFolderProject } = require("../models");
const { formatError } = require("../pkg/error-formatter.pkg");

const checkFolderOwnership = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const uuid_user = req.user?.uuid;

    if (!uuid) {
      return res.status(400).json(formatError("Parameter UUID tidak ditemukan", "uuid"));
    }

    if (!uuid_user) {
      return res.status(401).json(formatError("Unauthorized access", "auth"));
    }

    const folder = await TblFolderProject.findOne({
      where: { uuid },
    });

    if (!folder) {
      return res.status(404).json(formatError("Folder project tidak ditemukan", "uuid"));
    }

    if (folder.uuid_user !== uuid_user) {
      return res.status(403).json(formatError("Anda tidak memiliki akses untuk folder project ini", "forbidden"));
    }

    req.folder = folder;
    next();
  } catch (error) {
    console.error("Error in checkFolderOwnership middleware:", error.message);
    return res.status(500).json(formatError("Terjadi kesalahan pada server", "server"));
  }
};

module.exports = {
  checkFolderOwnership,
};
