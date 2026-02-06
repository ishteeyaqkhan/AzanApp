const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

let storage;
if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'azan-audio',
      resource_type: 'video', // Cloudinary treats audio as video type
      allowed_formats: ['mp3', 'wav', 'm4a'],
    }
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
}

const allowedMimetypes = [
  'audio/mpeg',       // .mp3
  'audio/mp3',        // .mp3 (some browsers)
  'audio/wav',        // .wav
  'audio/wave',       // .wav
  'audio/x-wav',      // .wav
  'audio/x-m4a',      // .m4a
  'audio/mp4',        // .m4a
  'audio/aac',        // .m4a
];

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(mp3|wav|m4a)$/i;
    const extValid = allowedExtensions.test(file.originalname);
    const mimeValid = allowedMimetypes.includes(file.mimetype);

    if (extValid && mimeValid) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

module.exports = upload;
