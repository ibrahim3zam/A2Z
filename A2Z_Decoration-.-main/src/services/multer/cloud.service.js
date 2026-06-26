import { cloudConfig } from './cloudinary.js';
import fs from 'fs/promises';

export const uploadSingleFile = async ({ path, folder = 'others' }) => {
  const { secure_url, public_id } = await cloudConfig().uploader.upload(path, {
    folder: `${process.env.CLOUDINARY_CLOUD_NAME}/${folder}`,
  });
  
  await fs.unlink(path).catch(() => {}); // Silently ignore if already gone
  
  return { secure_url, public_id };
};

export const destroyFile = async (public_id) => {
  await cloudConfig().uploader.destroy(public_id);
};
export const destroyMultipleFiles = async (publicIds) => {
  for (const public_id of publicIds) {
    await cloudConfig().uploader.destroy(public_id);
  }
};
export const uploadMultipleFiles = async (files, folder = 'others') => {
  const uploadedFiles = [];
  for (const file of files) {
    const { secure_url, public_id } = await uploadSingleFile({
      path: file.path,
      folder,
    });
    uploadedFiles.push({ secure_url, public_id });
  }
  return uploadedFiles;
};
