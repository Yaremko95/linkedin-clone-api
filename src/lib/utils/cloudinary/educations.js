const cloudinary = require("./config");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "educations",
  },
});
const parser = multer({ storage });

module.exports = parser;
