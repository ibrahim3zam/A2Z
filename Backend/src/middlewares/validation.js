import Joi from 'joi';
import { isValidObjectId } from 'mongoose';
import { BadRequestError } from '../utils/appError.js';
const data = ['body', 'query', 'params', 'file', 'files'];

export const validation = (schema) => {
  return (req, res, next) => {
    const data = {
      ...req.body,
      ...req.query,
      ...req.params,
    };
    if (req.file) {
      data.file = req.file;
    }
    if (req.files) {
      data.files = req.files;
    }

    const validationErrors = [];

    const result = schema?.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (result?.error) {
      validationErrors.push(result.error);
    }

    if (validationErrors.length > 0) {
      return next(new BadRequestError(validationErrors.join(', ')));
    } else {
      next();
    }
  };
};

export const generateValidation = {
  email: Joi.string().email().required(),
  password: Joi.string().min(4).max(20).required(),
  name: Joi.string().required(),
  age: Joi.number().required(),
  phone: Joi.string()
    .regex(/^[0-9]{10,15}$/)
    .required(),
  role: Joi.string().valid('admin', 'user').required(),
  gender: Joi.string().valid('male', 'female').required(),
  id: Joi.string()
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new BadRequestError('Invalid ID format');
      }
      return value;
    })
    .required(),


  file: Joi.object({
    fieldname: Joi.string().valid('image', 'images').required(),
    filename: Joi.string().required(),
    encoding: Joi.string().required(),
    path: Joi.string().required(),
    destination: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string()
      .valid('image/jpeg', 'image/png', 'image/gif')
      .required(),
    size: Joi.number()
      .max(5 * 1024 * 1024)
      .required(), // Max file size of 5MB
  }).required(),

  
  messageBody: Joi.string().max(1000).allow('').optional(),

};
