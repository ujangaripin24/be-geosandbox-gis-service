const { Op } = require("sequelize");
const { TblFolderProject, DetailUsers } = require("../models");

const userInclude = {
    model: DetailUsers,
    as: "user",
    attributes: ["uuid", "username", "email"],
};

const CreateFolderProjectService = async ({ name, detail, uuid_user }) => {
    const newFolder = await TblFolderProject.create({
        name,
        detail,
        uuid_user,
    });

    const folderWithUser = await TblFolderProject.findOne({
        where: { uuid: newFolder.uuid },
        include: [userInclude],
    });

    return folderWithUser;
};

const GetAllFolderProjectService = async ({
    page = 1,
    size = 10,
    search = "",
    uuid_user = null,
}) => {
    const limit = parseInt(size, 10) || 10;
    const currentPage = parseInt(page, 10) || 1;
    const offset = (currentPage - 1) * limit;

    const where = {};

    if (search) {
        where.name = {
            [Op.iLike || Op.like]: `%${search}%`,
        };
    }

    if (uuid_user) {
        where.uuid_user = uuid_user;
    }

    const { rows, count } = await TblFolderProject.findAndCountAll({
        where,
        include: [userInclude],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    return {
        folders: rows,
        total_items: count,
        total_pages: totalPages,
        current_page: currentPage,
        size: limit,
    };
};

const GetDetailFolderProjectService = async (uuid) => {
    const folder = await TblFolderProject.findOne({
        where: { uuid },
        include: [userInclude],
    });

    if (!folder) {
        throw new Error("Folder project tidak ditemukan");
    }

    return folder;
};

const UpdateFolderProjectService = async (uuid, { name, detail }, uuid_user) => {
    const folder = await TblFolderProject.findOne({
        where: { uuid },
    });

    if (!folder) {
        throw new Error("Folder project tidak ditemukan");
    }

    if (uuid_user && folder.uuid_user !== uuid_user) {
        throw new Error("Anda tidak memiliki akses untuk mengubah folder project ini");
    }

    if (name !== undefined) folder.name = name;
    if (detail !== undefined) folder.detail = detail;

    await folder.save();

    const updatedFolder = await TblFolderProject.findOne({
        where: { uuid },
        include: [userInclude],
    });

    return updatedFolder;
};

const DeleteFolderProjectService = async (uuid, uuid_user) => {
    const folder = await TblFolderProject.findOne({
        where: { uuid },
    });

    if (!folder) {
        throw new Error("Folder project tidak ditemukan");
    }

    if (uuid_user && folder.uuid_user !== uuid_user) {
        throw new Error("Anda tidak memiliki akses untuk menghapus folder project ini");
    }

    await folder.destroy();

    return { uuid };
};

module.exports = {
    CreateFolderProjectService,
    GetAllFolderProjectService,
    GetDetailFolderProjectService,
    UpdateFolderProjectService,
    DeleteFolderProjectService,
};