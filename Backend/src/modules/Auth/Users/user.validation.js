import Joi from 'joi';
import { generateValidation } from '../../../middlewares/validation.js';

export const loginSchema = Joi.object({
  email: generateValidation.email,
  password: generateValidation.password,
});

export const confirmEmailSchema = Joi.object({
  email: generateValidation.email,
  otp: Joi.string().length(6).required(),
});

export const signUpSchema = Joi.object({
  name: generateValidation.name,
  email: generateValidation.email,
  password: generateValidation.password,
  age: generateValidation.age,
  phone: generateValidation.phone,
  gender: generateValidation.gender,
});

export const uploadImageSchema = Joi.object({
  file: generateValidation.file.required(),
});

export const updateCoverImagesSchema = Joi.object({
  files: Joi.array().items(generateValidation.file).max(5).required(),
});
