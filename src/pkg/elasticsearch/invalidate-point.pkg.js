const RedisClient = require("../../config/data-cache.config");

const invalidatePointPlacesCache = async () => {
    try {
        const keys = await RedisClient.keys("cache:point-places:*");
        if (keys && keys.length > 0) {
            await RedisClient.del(keys);
        }
    } catch (err) {
        console.warn("[Redis Warning] Gagal menghapus cache point-places:", err.message);
    }
};

module.exports = {
    invalidatePointPlacesCache
}