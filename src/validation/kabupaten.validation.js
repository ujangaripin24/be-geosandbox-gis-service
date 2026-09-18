const normalizeGeometry = (geometry) => {
	if (!geometry || Object.keys(geometry).length === 0) {
		return null;
	}

	if (!["Polygon", "MultiPolygon"].includes(geometry.type)) {
		throw new Error("geometry harus bertipe Polygon atau MultiPolygon");
	}

	if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
		throw new Error("geometry.coordinates tidak boleh kosong");
	}

	return geometry.type === "Polygon"
		? { type: "MultiPolygon", coordinates: [geometry.coordinates] }
		: geometry;
};

const getProperty = (properties, names) => {
		const propertyName = Object.keys(properties).find((name) =>
			names.includes(name.toLowerCase()),
		);
	return propertyName === undefined ? undefined : properties[propertyName];
};

const validateFeatureCollection = (document) => {
	if (!document || document.type !== "FeatureCollection" || !Array.isArray(document.features)) {
		throw new Error("File harus berupa GeoJSON FeatureCollection");
	}

	if (document.features.length === 0) {
		throw new Error("FeatureCollection tidak boleh kosong");
	}

	const seenObjectIds = new Set();
	const features = document.features
		.map((feature, index) => ({ feature, index }))
		.filter(({ feature }) => {
			const properties = feature?.properties || {};
			const code = getProperty(properties, ["kdpkab"]);
			const name = getProperty(properties, ["wadmkk"]);
			return code != null && String(code).trim() && name != null && String(name).trim();
		});

	return features.map(({ feature, index }) => {
		const properties = feature?.properties || {};
		const objectId = Number(getProperty(properties, ["objectid"]));
		const code = String(
			getProperty(properties, ["kdpkab"]) ?? "",
		).trim();
		const name = String(
			getProperty(properties, ["wadmkk"]) ?? "",
		).trim();
		const provinceCode = String(
			getProperty(properties, ["kdppum"]) ?? "",
		).trim();
		const provinceName = String(
			getProperty(properties, ["wadmpr"]) ?? "",
		).trim();

		if (!Number.isInteger(objectId)) {
			throw new Error(`OBJECTID pada feature ${index + 1} harus berupa bilangan bulat`);
		}
		if (seenObjectIds.has(objectId)) {
			throw new Error(`OBJECTID duplikat: ${objectId}`);
		}
		if (!code || code.length > 20) {
			throw new Error(
				`Kode kabupaten pada feature ${index + 1} tidak valid. ` +
				"Field KDPKAB wajib diisi.",
			);
		}
		if (!name || name.length > 100) {
			throw new Error(`WADMKK pada feature ${index + 1} tidak valid`);
		}

		seenObjectIds.add(objectId);
		return {
			object_id: objectId,
			kode_provinsi: provinceCode || null,
			kode_kabupaten: code,
			nama_kabupaten: name,
			nama_provinsi: provinceName,
			geom: normalizeGeometry(feature.geometry),
		};
	});
};

module.exports = {
	normalizeGeometry,
	validateFeatureCollection,
};
