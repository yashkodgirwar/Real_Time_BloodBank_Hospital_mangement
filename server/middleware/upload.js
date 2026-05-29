const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Cloudinary storage for licensing documents with local fallback
let clUpload;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  try {
    const clStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'bloodlink_licenses',
        allowedFormats: ['jpg', 'png', 'jpeg', 'pdf']
      }
    });
    clUpload = multer({ storage: clStorage });
  } catch (err) {
    console.warn("Cloudinary storage setup failed. Falling back to local disk storage for licenses:", err.message);
    clUpload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, path.join(__dirname, '..', 'uploads'));
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-license-' + file.originalname);
        }
      })
    });
  }
} else {
  console.warn("Cloudinary environment variables not fully set. Using local disk storage for licenses.");
  clUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-license-' + file.originalname);
      }
    })
  });
}

// 3. Local disk storage for patient approval documents and profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files under server/uploads
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB limit
  }
});

module.exports = {
  upload,
  clUpload,
  cloudinary
};
