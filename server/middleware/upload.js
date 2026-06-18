const path = require('path');
const fs = require('fs');
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
          const uploadPath = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
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
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-license-' + file.originalname);
      }
    })
  });
}

// 3. Cloudinary storage for profile pictures with local fallback
let profileUpload;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  try {
    const profileStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'bloodlink_profiles',
        allowedFormats: ['jpg', 'png', 'jpeg']
      }
    });
    profileUpload = multer({ storage: profileStorage });
  } catch (err) {
    profileUpload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-profile-' + file.originalname);
        }
      })
    });
  }
} else {
  profileUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-profile-' + file.originalname);
      }
    })
  });
}

// 4. Local disk storage for patient approval documents and profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files under server/uploads (auto-create if missing)
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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
  profileUpload,
  cloudinary
};
