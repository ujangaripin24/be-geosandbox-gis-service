const normalizeGeometry = (geometry) => {
	if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
		throw new Error("geometry harus bertipe Polygon atau MultiPolygon");
	}

	if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
		throw new Error("geometry.coordinates tidak boleh kosong");
	}

	return geometry.type === "Polygon"
		? { type: "MultiPolygon", coordinates: [geometry.coordinates] }
		: geometry;
};

const validateFeatureCollection = (document) => {
	if (!document || document.type !== "FeatureCollection" || !Array.isArray(document.features)) {
		throw new Error("File harus berupa GeoJSON FeatureCollection");
	}

	if (document.features.length === 0) {
		throw new Error("FeatureCollection tidak boleh kosong");
	}

	const seenCodes = new Set();
	return document.features.map((feature, index) => {
		const code = String(feature?.properties?.KODE_PROV ?? feature?.properties?.kode_provinsi ?? "").trim();
		const name = String(feature?.properties?.PROVINSI ?? feature?.properties?.nama_provinsi ?? "").trim();

		if (!/^\d{2}$/.test(code)) {
			throw new Error(`KODE_PROV pada feature ${index + 1} harus dua digit`);
		}
		if (!name || name.length > 100) {
			throw new Error(`PROVINSI pada feature ${index + 1} tidak valid`);
		}
		if (seenCodes.has(code)) {
			throw new Error(`KODE_PROV duplikat: ${code}`);
		}

		seenCodes.add(code);
		return {
			kode_provinsi: code,
			nama_provinsi: name,
			geom: normalizeGeometry(feature.geometry),
		};
	});
};

const toGeoJSONFeature = (row) => {
  const values = row.toJSON ? row.toJSON() : row;
  const { geom, ...properties } = values;

  return {
	type: "Feature",
	geometry: geom,
	properties,
  };
};

module.exports = {
	normalizeGeometry,
	validateFeatureCollection,
	toGeoJSONFeature
};
