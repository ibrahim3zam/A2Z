import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { BadRequestError } from '../../utils/appError.js';

export const fileType = {
  Image: ['image/jpeg', 'image/png', 'image/gif'],
  Video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  Document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const multerUploadFile = ({ type = fileType.Image } = {}) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dest = 'uploads/temp';
      req.dest = dest;
      const fullpath = path.resolve('.', dest);

      if (!fs.existsSync(fullpath)) {
        fs.mkdirSync(fullpath, { recursive: true });
      }

      cb(null, fullpath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const name = uniqueSuffix + '-' + file.originalname;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (type.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError(
          'Invalid file type. Only JPEG, PNG, and GIF are allowed.'
        ),
        false
      );
    }
  };
  return multer({ storage: storage, fileFilter: fileFilter });
};
