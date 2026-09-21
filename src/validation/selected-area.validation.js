const toGeoJSONFeature = (row) => {
  const values = row.toJSON ? row.toJSON() : row;
  const { geom, ...properties } = values;

  return {
	type: "Feature",
	geometry: JSON.parse(geom),
	properties,
  };
};

module.exports = {
    toGeoJSONFeature
};