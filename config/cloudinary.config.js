const cloudinary = require("cloudinary");
const {
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryName,
} = require("./constants.config");

cloudinary.config({
  cloud_name: cloudinaryName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
});

const cloudinaryUpload = async (file) => {
  console.log("file uploading");
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(file, (error, result) => {
      resolve(
        {
          url: result.secure_url,
        },
        {
          resource_type: "auto",
        }
      );
    });
  });
};

module.exports = { cloudinaryUpload };
