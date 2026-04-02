import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'medflow/labs',
    resource_type: 'auto',
  },
});

export const uploadLabFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    if (!ok) {
      cb(new Error('Only PDF or image files (JPEG, PNG, GIF, WebP) are allowed.'));
      return;
    }
    cb(null, true);
  },
});
