import { UserModel } from "../../../../DB/Models/user.model.js"
import {types} from "../../../middlewares/auth.js"
import bcrypt from 'bcrypt';
import { template } from "../../../services/sendEmail/generateHtml.js";
import jwt from 'jsonwebtoken';
import { BadRequestError, NotFoundError } from "../../../utils/appError.js"
import { emailEvent, generateOtp } from "../../../services/sendEmail/emailEvent.js"
import { successRes } from "../../../utils/success.res.js";
import { nanoid } from "nanoid";
import { RevokeToken } from "../../../../DB/Models/RevokeToken.model.js";



export const registerUserService = async (userSignUpData) => {
    const { userName, email, password } = userSignUpData;

    const isEmailDuplicate = await UserModel.findOne({ email })
    if (isEmailDuplicate) {
        throw new BadRequestError('Email already exists', { cause: 400 });
    }
    const saltRounds = parseInt(process.env.SALT) || 10;
  const hash = await bcrypt.hash(password, saltRounds);
  const otp = generateOtp();
  const hashOtp = await bcrypt.hash(otp, saltRounds);
  const newUser = new UserModel({
    userName,
    email,
    password: hash,
    emailOtp: {
      otp: hashOtp, 
      expiredIn: new Date(Date.now() + 10 * 60 * 1000), 
    },
  });

   
   
    const saveUser = await newUser.save()
    if (!saveUser) {
        throw new Error('fail to sign up', { cause: 400 });
    }
      emailEvent.emit('sendEmail', {
    to: email,
    subject: 'Email Verification',
    html: template(
      otp,
      'Email Verification',
      'Please use the following OTP to verify your email address.'
    ),
  });
  const safeUser = {
  _id: newUser._id,
  userName: newUser.userName,
  email: newUser.email,
  role: newUser.role,
}
return safeUser
}


export const confirmEmailService = async (confirmEmailData) => {
    const { email, otp } = confirmEmailData;
    const user = await UserModel.findOne({ email });

    if (!user) {
        throw new NotFoundError('Invalid email');

  }
  if (!user.emailOtp?.otp || user.emailOtp.expiredIn < new Date()) {
    throw new NotFoundError('OTP expired');
  }
  if (user.isConfirmed === true) {
    throw new BadRequestError('Email already confirmed');
  }

  if (!otp || !user.emailOtp?.otp) {
    throw new Error('Invalid or expired OTP');
  }

  const isMatch = await bcrypt.compare(otp, user.emailOtp.otp);

  if (!isMatch) {
    throw new Error('Invalid OTP');
  }

  await UserModel.updateOne(
    { _id: user._id },
    {
      isConfirmed: true,
      $unset: { emailOtp: '' },
    }
  );
return user;
}

export const logInService = async (logInData) => {
    const { email, password } = logInData;
    const user = await UserModel.findOne({ email })
    if (!user) {
        throw new BadRequestError('Invalid login credentials');
    }

    if (user.isConfirmed == false) {
        throw new BadRequestError('Please Verified your Account');
    }
    if (!user.isActive) {
        throw new BadRequestError(
            'Your account has been deactivated. Please contact support.'
        );
    }
   const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new BadRequestError('Invalid email or password');
  }
    
  const accessJti = nanoid();
  const refreshJti = nanoid();


  const accessToken = jwt.sign(
    {
      id: user._id,
      jti: accessJti,
      type: 'access',
      role: user.role,
    },

    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
      jti: refreshJti,
      type: types.refresh,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
    }
  );
return { user, accessToken, refreshToken };
}


export const resendCodeService = async (resendCodeData) => {
    const { email } = resendCodeData;
    const user = await UserModel.findOne({ email });
     if (!user) {
        throw new NotFoundError('Invalid email');
     }
     if (user.isConfirmed) {
        throw new BadRequestError('Email already confirmed');
      }
      if(user.isEmailSent){
       throw new BadRequestError('OTP already sent. Please check your email or wait before requesting again.'); 
      }
      const otp = generateOtp();
      const hashOtp = await bcrypt.hash(otp, 5);
      
      emailEvent.emit('sendEmail', {
        to: email,
        subject: 'Resend Email Verification',
        html: template(
          otp,
          'Resend Email Verification',
          'Please use the following OTP to verify your email address.'
        ),
      });
     const updateuser = await UserModel.updateOne(
        { _id: user._id },
        {
          emailOtp: {
            otp: hashOtp,
            expiredIn: new Date(Date.now() + 10 * 60 * 1000),
          },
            isEmailSent: true,
        })
         return updateuser; }



export const logOutService = async (userId, tokenJti, token) => {
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
        throw new NotFoundError('User not found');
    }

    
    if (tokenJti) {
        
        const decoded = token ? jwt.decode(token) : null;
        const expiredIn = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 60 * 60 * 1000);

        await RevokeToken.create({
            jti: tokenJti,
            expiredIn,
            userId: userId,
            onModel: 'User',
        }).catch(() => {}); 
    }

    const loggedOutUser = await UserModel.updateOne(
        { _id: userId },
        {
            isActive: false,
        }
    );
    
    return loggedOutUser;
};

export const getUserAccountService = async (user) => {
    const userCheck = await UserModel.findById(user._id).select('-password -emailOtp -isEmailSent -isDeleted -isActive');
    if (!userCheck) {
        throw new NotFoundError('User not found');
    }
    return userCheck;
}