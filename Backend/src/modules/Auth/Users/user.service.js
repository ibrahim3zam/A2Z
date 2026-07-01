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



export const registerUserService = async (userSignUpData,req,next) => {
    const { userName, email, password } = userSignUpData;

    const isEmailDuplicate = await UserModel.findOne({ email })
    if (isEmailDuplicate) {
       return next(new BadRequestError('Email already exists'))
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
        return next(new Error('fail to sign up', { cause: 400 }))
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


export const confirmEmailService = async (email, otp, req, next) => {
    
  const user = await UserModel.findOne({ email });

  if (!user) {
    return next(new NotFoundError('Invalid email'));
  }
  if (!user.emailOtp?.otp || user.emailOtp.expiredIn < new Date()) {
    return next(new NotFoundError('OTP expired'));
  }
  if (user.isConfirmed === true) {
    return next(new BadRequestError('Email already confirmed'));
  }

  if (!otp || !user.emailOtp?.otp) {
    return next(new Error('Invalid or expired OTP'));
  }

  const isMatch = await bcrypt.compare(otp, user.emailOtp.otp);

  if (!isMatch) {
    return next(new Error('Invalid OTP'));
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

export const logInService = async (email, password, req, next) => {
     const user = await UserModel.findOne({ email })
    if (!user) {
        return next(new BadRequestError('Invalid login credentials'))
    }

    if (user.isConfirmed == false) {
        return next(new BadRequestError('Please Verified your Account'))
    }
    if (!user.isActive) {
    return next(new BadRequestError(
      'Your account has been deactivated. Please contact support.'
    ));
  }
   const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new BadRequestError('Invalid email or password'));
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


export const resendCodeService = async ( email, req, next) => {
     const user = await UserModel.findOne({ email });
      if (!user) {
        return next(new Error('Invalid email'));
      }
      if (user.isConfirmed) {
        return next(new Error('Email already confirmed'));
      }
      if(user.isEmailSent){
       return next(new Error('OTP already sent. Please check your email or wait before requesting again.')); 
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



export const logOutService = async (userId, req, next) => {
    
  const existingUser = await UserModel.findById(userId);
  if (!existingUser) {
    return res.status(404).json({ message: 'invalid user id' });
  }

  if (req.tokenJti) {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = token ? jwt.decode(token) : null;
    const expiredIn = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    await RevokeToken.create({
      jti: req.tokenJti,
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
  return loggedOutUser
}