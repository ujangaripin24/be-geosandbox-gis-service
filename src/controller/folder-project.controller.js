const { CreateFolderProjectService } = require("../service/folder-project.service");
const { formatError } = require("../pkg/error-formatter.pkg");

const CreateFolderProjectController = async (req, res, next) => {
    let uuid = req.user.uuid
    console.log("Profile Controller: ", uuid)

    try {
        const data = await CreateFolderProjectService(uuid);
        return res.status(200).json({ message: "Success", status: 200, data });
    } catch (error) {
        console.error("Error in CreateFolderProjectController:", error);
        res.status(500).json(formatError(error.message, "server"));
    }
}

module.exports = {
    CreateFolderProjectController
}