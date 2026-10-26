const { body } = require("express-validator");


/**
 * Normalisasi nama tempat:
 * - Menghilangkan spasi di awal dan akhir (trim)
 * - Mengubah spasi berurutan menjadi 1 spasi
 * - Mengubah format teks menjadi Title Case (Capitalize each word)
 * @param {string} name 
 * @returns {string}
 */
const normalizeName = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Parser file CSV (Buffer atau String)
 * Mendukung delimiter koma (,) dan titik koma (;) serta quoted values
 * @param {Buffer|string} csvContent 
 * @returns {Array<{ rowNumber: number, data: object }>}
 */
const parseCSV = (csvContent) => {
  if (!csvContent) return [];
  const text = typeof csvContent === "string" ? csvContent : csvContent.toString("utf8");

  // Deteksi delimiter
  const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse baris header (hilangkan tanda kutip & lowercase)
  const rawHeaders = lines[0].split(delimiter).map((h) =>
    h.trim().toLowerCase().replace(/^["']|["']$/g, "")
  );

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let insideQuotes = false;
    let currentValue = "";

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        values.push(currentValue.trim().replace(/^["']|["']$/g, ""));
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^["']|["']$/g, ""));

    const rowObj = {};
    rawHeaders.forEach((header, idx) => {
      rowObj[header] = values[idx] !== undefined ? values[idx] : "";
    });
    records.push({ rowNumber: i + 1, data: rowObj });
  }

  return records;
};

/**
 * Service untuk memproses upload CSV titik lokasi tempat
 * Format kolom CSV: name_place, kode_kabupaten, longitude, latitude
 * Menggunakan pendekatan "Soft Unique" / Composite Unique Index:
 * - Menjalankan normalizeName() untuk merapikan nama dan perbandingan case-insensitive
 * - Menangani deduplikasi baik di level file CSV (in-batch) maupun database
 * - Validasi batas administratif wilayah via ST_Contains
 * @param {Buffer|string|object} fileInput
 * @param {{ uuid_user?: string }} options
 */

const CreatePlaceValidation = [
  body("name_place").notEmpty().withMessage("Nama tempat tidak boleh kosong"),
  body("kode_kabupaten")
    .notEmpty()
    .withMessage("Kode kabupaten tidak boleh kosong"),
  body("longitude")
    .notEmpty()
    .withMessage("Longitude tidak boleh kosong")
    .isFloat({ min: -180, max: 180 })
    .withMessage(
      "Longitude harus berupa angka koordinat valid (-180 sampai 180)",
    ),
  body("latitude")
    .notEmpty()
    .withMessage("Latitude tidak boleh kosong")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude harus berupa angka koordinat valid (-90 sampai 90)"),
];

const UpdatePlaceValidation = [
  body("name_place").notEmpty().withMessage("Nama tempat tidak boleh kosong"),
  body("kode_kabupaten")
    .notEmpty()
    .withMessage("Kode kabupaten tidak boleh kosong"),
  body("longitude")
    .notEmpty()
    .withMessage("Longitude tidak boleh kosong")
    .isFloat({ min: -180, max: 180 })
    .withMessage(
      "Longitude harus berupa angka koordinat valid (-180 sampai 180)",
    ),
  body("latitude")
    .notEmpty()
    .withMessage("Latitude tidak boleh kosong")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude harus berupa angka koordinat valid (-90 sampai 90)"),
];

module.exports = {
  CreatePlaceValidation,
  UpdatePlaceValidation,
  parseCSV,
  normalizeName,
};
