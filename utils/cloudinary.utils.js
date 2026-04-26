const fs = require("fs");
const { cloudinaryUpload } = require("../config/cloudinary.config");

/**
 * Uploads a local file to Cloudinary and removes the temp file.
 * Returns the Cloudinary result object (has .url, .public_id, etc.)
 */
const uploadToCloudinary = async (localPath, folder = "image") => {
  const result = await cloudinaryUpload(localPath, folder);
  fs.unlinkSync(localPath);
  return result;
};

module.exports = { uploadToCloudinary };
