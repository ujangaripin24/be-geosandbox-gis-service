const { Op } = require("sequelize");
const {
    TblProjectGeo,
    TblFolderProject,
    DetailUsers,
    TblGeoProvinsi,
    TblGeoWilayah,
} = require("../models");

const defaultIncludes = [
    {
        model: TblFolderProject,
        as: "folder",
        attributes: ["uuid", "name", "detail"],
    },
    {
        model: DetailUsers,
        as: "user",
        attributes: ["uuid", "username", "email"],
    },
];

const CreateProjectGeoService = async ({
    name,
    detail,
    uuid_folder,
    uuid_user,
    kode_provinsi,
    kode_kabupaten,
}) => {
    const folder = await TblFolderProject.findOne({
        where: { uuid: uuid_folder },
    });

    if (!folder) {
        throw new Error("Folder project tidak ditemukan");
    }

    if (folder.uuid_user !== uuid_user) {
        throw new Error("Anda tidak memiliki akses ke folder project ini");
    }

    const provinsi = await TblGeoProvinsi.findOne({
        where: { kode_provinsi },
    });

    if (!provinsi) {
        throw new Error(`Kode provinsi '${kode_provinsi}' tidak ditemukan`);
    }

    const wilayah = await TblGeoWilayah.findOne({
        where: {
            kode_kabupaten,
            kode_provinsi,
        },
    });

    if (!wilayah) {
        throw new Error(
            `Kode kabupaten/kota '${kode_kabupaten}' tidak ditemukan atau tidak berada di provinsi '${provinsi.nama_provinsi}'`
        );
    }

    const newProject = await TblProjectGeo.create({
        name,
        detail,
        uuid_folder,
        uuid_user,
        kode_provinsi,
        nama_provinsi: provinsi.nama_provinsi,
        kode_kabupaten,
        nama_kabupaten: wilayah.nama_kabupaten,
    });

    const projectWithUser = await TblProjectGeo.findOne({
        where: { uuid: newProject.uuid },
        include: defaultIncludes,
    });

    return projectWithUser;
};

const GetAllProjectGeoService = async ({
    page = 1,
    size = 10,
    search = "",
    uuid_folder = null,
    uuid_user,
}) => {
    const limit = parseInt(size, 10) || 10;
    const currentPage = parseInt(page, 10) || 1;
    const offset = (currentPage - 1) * limit;

    const where = {
        uuid_user,
    };

    if (uuid_folder) {
        where.uuid_folder = uuid_folder;
    }

    if (search) {
        where.name = {
            [Op.iLike || Op.like]: `%${search}%`,
        };
    }

    const { rows, count } = await TblProjectGeo.findAndCountAll({
        where,
        include: defaultIncludes,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    return {
        projects: rows,
        total_items: count,
        total_pages: totalPages,
        current_page: currentPage,
        size: limit,
    };
};

const GetDetailProjectGeoService = async (uuid, uuid_user) => {
    const project = await TblProjectGeo.findOne({
        where: { uuid },
        include: defaultIncludes,
    });

    if (!project) {
        throw new Error("Project geo tidak ditemukan");
    }


    return project;
};

const UpdateProjectGeoService = async (
    uuid,
    { name, detail, kode_provinsi, kode_kabupaten },
    uuid_user
) => {
    const project = await TblProjectGeo.findOne({
        where: { uuid },
    });

    if (!project) {
        throw new Error("Project geo tidak ditemukan");
    }


    if (name !== undefined) project.name = name;
    if (detail !== undefined) project.detail = detail;

    const targetProvinsiCode = kode_provinsi || project.kode_provinsi;
    const targetKabupatenCode = kode_kabupaten || project.kode_kabupaten;

    if (kode_provinsi || kode_kabupaten) {
        const provinsi = await TblGeoProvinsi.findOne({
            where: { kode_provinsi: targetProvinsiCode },
        });

        if (!provinsi) {
            throw new Error(`Kode provinsi '${targetProvinsiCode}' tidak ditemukan`);
        }

        const wilayah = await TblGeoWilayah.findOne({
            where: {
                kode_kabupaten: targetKabupatenCode,
                kode_provinsi: targetProvinsiCode,
            },
        });

        if (!wilayah) {
            throw new Error(
                `Kode kabupaten/kota '${targetKabupatenCode}' tidak ditemukan atau tidak berada di provinsi '${provinsi.nama_provinsi}'`
            );
        }

        project.kode_provinsi = targetProvinsiCode;
        project.nama_provinsi = provinsi.nama_provinsi;
        project.kode_kabupaten = targetKabupatenCode;
        project.nama_kabupaten = wilayah.nama_kabupaten;
    }

    await project.save();

    const updatedProject = await TblProjectGeo.findOne({
        where: { uuid },
        include: defaultIncludes,
    });

    return updatedProject;
};

const DeleteProjectGeoService = async (uuid, uuid_user) => {
    const project = await TblProjectGeo.findOne({
        where: { uuid },
    });

    if (!project) {
        throw new Error("Project geo tidak ditemukan");
    }

    await project.destroy();

    return { uuid };
};

module.exports = {
    CreateProjectGeoService,
    GetAllProjectGeoService,
    GetDetailProjectGeoService,
    UpdateProjectGeoService,
    DeleteProjectGeoService,
};
