import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { log } from 'console';
import { BadRequestError } from '../../utils/appError.js';

export const uploadFile = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const folderName = req.user
        ? `${req.user._id}_!${req.user.name}`
        : 'temp';
      const dest = `uploads/${folderName}`;
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
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
