
import { AdminModel } from "../../../../DB/Models/Admin.model.js"
import { EngineerModel } from "../../../../DB/Models/Engineer.model.js"
import { UserModel } from "../../../../DB/Models/user.model.js"
import jwt from 'jsonwebtoken';
import pkg from 'bcrypt'
import { customAlphabet } from "nanoid"
import slugify from "slugify"
import twilio from 'twilio'
import { sendSMS } from '../../../services/sendSms/twilio.js';
import { adminOtpTemplate } from '../../../services/sendSms/smsTemplates.js'; 
import { types } from "../../../middlewares/auth.js";
import { emailEvent } from "../../../services/sendEmail/emailEvent.js";
import { template } from "../../../services/sendEmail/generateHtml.js";
import { multerUploadFile } from "../../../services/multer/multer.cloud.js";
import { uploadSingleFile } from "../../../services/multer/cloud.service.js";
import {v2 as cloudinary} from 'cloudinary'
const nanoid = customAlphabet('1234567890', 6)




export const registerAdminService=async(adminData)=>{
    const { phoneNumber, OTP, userName, email, age, gender } = adminData;
    const isPhoneDuplicate = await AdminModel.findOne({ phoneNumber });
  if (isPhoneDuplicate) {
    throw new Error('Phone already exists');
  }

  const isEmailDuplicate = await AdminModel.findOne({ email });
  if (isEmailDuplicate) {
    throw new Error('Email already exists');
  }

  const isOTPDuplicate = await AdminModel.findOne({ OTP });
  if (isOTPDuplicate) {
    throw new Error('OTP Duplicated');
  }


  const newlyCreatedAdmin = new AdminModel({
    phoneNumber,
    OTP,
    userName,
    email,
    age,
    gender,
  });

  const savedAdmin = await newlyCreatedAdmin.save();
  return savedAdmin;
};



export const requestLoginOtp = async (phoneNumber) => {
  const admin = await AdminModel.findOne({ phoneNumber });
  if (!admin) {
    const error = new Error('Admin Not Found');
    error.cause = 404;
    throw error;
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  admin.OTP = generatedOtp;
  admin.isVerify = true; 
  await admin.save();

  let smsStatus = "Bypassed (Twilio Restricted)";
  try {
    await sendSMS(phoneNumber, ` Your Admin Login OTP is ${generatedOtp}`);
    smsStatus = "Sent via Twilio";
  } catch (smsError) {
  }

  const result = { sms_status: smsStatus };
  

  return generatedOtp;
};


 
export const verifyOtpAndGenerateTokens = async (phoneNumber, OTP) => {
  const admin = await AdminModel.findOne({ phoneNumber });
  if (!admin) {
    const error = new Error('Admin Not Found, try again');
    error.cause = 404;
    throw error;
  }

  if (!admin.OTP || admin.OTP.toString() !== OTP.toString()) {
    const error = new Error('In-valid OTP');
    error.cause = 400;
    throw error;
  }

  if (admin.isVerify === false) {
    const error = new Error('Please Verify your Account first');
    error.cause = 400;
    throw error;
  }

  const accessJti = nanoid();
  const refreshJti = nanoid();

  const accessToken = jwt.sign(
    {
      id: admin._id,
      jti: accessJti,
      type: 'access',
      role: admin.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      id: admin._id,
      jti: refreshJti,
      type: 'refresh', 
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  admin.OTP = null;
  await admin.save();

  return { accessToken, refreshToken };
};



export const updateAdminProfileService = async (userId, bodyData, file) => {
  const { email, userName } = bodyData;

  const admin = await AdminModel.findById(userId);
  if (!admin) {
    const error = new Error('Admin Not Found');
    error.cause = 404;
    throw error;
  }

  if (!file) {
    const error = new Error('please upload a Admin pic');
    error.cause = 400;
    throw error;
  }

  const oldPublicId = admin.profilePic?.public_id;

  const { secure_url, public_id } = await uploadSingleFile({
    path: file.path,
    folder: `Admin/ProfilePic/${admin._id}`,
  });

  const updatedAdmin = await AdminModel.findByIdAndUpdate(
    userId,
    {
      profilePic: { secure_url, public_id },
      email,
      userName,
    },
    { new: true }
  );

  return updatedAdmin;
};


export const getAdminAccountService = async (userId) => {
  const admin = await AdminModel.findById(userId);
  if (!admin) {
    const error = new Error('in-valid Id');
    error.cause = 404;
    throw error;
  }
  return admin;
};




export const createEngineerService = async (bodyData, adminId, protocol, host) => {
  const { userName, email, password, age, gender, phoneNumber, address, spicalAt } = bodyData;

  const engineer = await EngineerModel.findOne({ email });
  if (engineer) {
    const error = new Error('email is already exist');
    error.cause = 400;
    throw error;
  }

  const token = jwt.sign(
    { Email: email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  const confirmationLink = `${protocol}://${host}/admin/confirm/${token}`;
  const isEmailSent = emailEvent.emit('sendEmail', {
    to: email,
    subject: 'Email Verification',
    html: template(
      confirmationLink,
      'Email Verification',
      'Please use the following Link to verify your email address.'
    ),
  });

  if (!isEmailSent) {
    const error = new Error('fail to sent confirmation email');
    error.cause = 400;
    throw error;
  }

  const hashedPassword = pkg.hashSync(password, +process.env.SALT);
  const newlyCreatedEngineer = new EngineerModel({
    userName,
    email,
    password: hashedPassword,
    age,
    gender,
    phoneNumber,
    address,
    spicalAt,
    addedBy: adminId,
  });

  return await newlyCreatedEngineer.save();
};

 
export const confirmEmailService = async (token) => {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  if (!decoded || !decoded.Email) {
    const error = new Error('Invalid or expired token');
    error.cause = 400;
    throw error;
  }

  const engineer = await EngineerModel.findOneAndUpdate(
    { email: decoded.Email },
    { isConfirmed: true },
    { new: true }
  );

  if (!engineer) {
    const error = new Error('Engineer not found');
    error.cause = 404;
    throw error;
  }

  return engineer;
};

export const listEngineersService = async (adminId) => {
  const admin = await AdminModel.findById(adminId);
  if (!admin) {
    const error = new Error('admin not found');
    error.cause = 404;
    throw error;
  }

  return await EngineerModel.find();
};



export const getEngineerService = async (adminId, engId) => {
  const admin = await AdminModel.findById(adminId);
  if (!admin) {
    const error = new Error('admin not found');
    error.cause = 404;
    throw error;
  }

  const engineer = await EngineerModel.findById(engId);
  if (!engineer) {
    const error = new Error('engineer not found');
    error.cause = 404;
    throw error;
  }

  return engineer;
};


export const updateEngineerService = async (engId, adminId, bodyData, file) => {
  const { userName, age, gender, phoneNumber, address, password } = bodyData;

  const engineer = await EngineerModel.findById(engId);
  if (!engineer) {
    const error = new Error('Engineer Not Found');
    error.cause = 404;
    throw error;
  }

  if (userName) engineer.userName = userName;
  if (age) engineer.age = age;
  if (gender) engineer.gender = gender;
  if (phoneNumber) engineer.phoneNumber = phoneNumber;
  if (address) engineer.address = address;

  if (password) {
    engineer.password = pkg.hashSync(password, +process.env.SALT);
  }

  if (file) {
    if (engineer.profilePic && engineer.profilePic.public_id) {
      await cloudinary.uploader.destroy(engineer.profilePic.public_id);
    }

    const { secure_url, public_id } = await multerUploadFile(file.path, {
      folder: `${process.env.PROJECT_FOLDER}/Engineer/ProfilePic/${engineer.customId || engineer._id}`,
    });

    engineer.profilePic = { secure_url, public_id };
  }

  engineer.UpdatedBy = adminId;
  return await engineer.save();
};


export const deleteEngineerService = async (engId, adminId) => {
  const engExists = await EngineerModel.findById(engId);
  if (!engExists) {
    const error = new Error('invalid engineerId');
    error.cause = 400;
    throw error;
  }

  engExists.deletedBy = adminId;
  engExists.isDeleted = true; 
  engExists.deletedAt = new Date();
  await engExists.save(); 
  

  if (engExists.customId) {
    await cloudinary.api.delete_all_resources(`${process.env.PROJECT_FOLDER}/Engineer/ProfilePic/${engExists.customId}`);
    await cloudinary.api.delete_folder(`${process.env.PROJECT_FOLDER}/Engineer/ProfilePic/${engExists.customId}`);
  }

  return true;
};

export const logoutAdminService = async (requestingAdminId, targetUserId) => {
  const userExist = await AdminModel.findById(targetUserId);
  if (!userExist) {
    const error = new Error('invalid admin id');
    error.cause = 404;
    throw error;
  }

  if (requestingAdminId.toString() !== targetUserId.toString()) {
    const error = new Error('can not take this action');
    error.cause = 400;
    throw error;
  }

  return await adminDB.findByIdAndUpdate(
    targetUserId,
    { status: 'Offline' },
    { new: true }
  );
};