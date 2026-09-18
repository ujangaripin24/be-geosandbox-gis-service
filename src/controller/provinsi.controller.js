const { importProvinsi } = require("../service/provinsi.service");

const importProvinsiController = async (req, res) => {
	try {
		let document = req.body;

		if (req.file) {
			document = JSON.parse(req.file.buffer.toString("utf8"));
		}

		const result = await importProvinsi(document, {
			replace: req.query.replace === "true",
		});

		return res.status(200).json({
			message: "Data provinsi berhasil diimport",
			data: result,
		});
	} catch (error) {
		const status = error instanceof SyntaxError || error.message.includes("Feature") || error.message.includes("KODE_PROV") || error.message.includes("PROVINSI") || error.message.includes("geometry")
			? 400
			: 500;

		return res.status(status).json({
			message: error.message,
		});
	}
};

module.exports = {
	importProvinsiController,
};
