import { successRes } from "../../../utils/success.res.js";
import * as userService from './user.service.js';

export const handleSignUp = async (req, res, next) => {
  try { 
  const userSignUpData = req.body

const registeredUser = await userService.registerUserService(userSignUpData, req, next);
successRes({
  res,
  status: 201,
  message: 'Account created. Check email for OTP.',
  data: registeredUser,
});}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
}

    
export const confirmEmail = async (req, res, next) => {
 try {
  const { email, otp } = req.body;
  const user = await userService.confirmEmailService(email, otp, req, next);
  return successRes({
    res,
    status: 200,
    message: 'Email confirmed successfully',
    data: { user },
  });
}
 catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
};


export const logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body
   const { user, accessToken, refreshToken } = await userService.logInService(email, password, req, next);
  successRes({
    res,
    data: { user, accessToken, refreshToken },
  });
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
};

export const resendCode = async (req, res, next) => {
  try {
  const { email } = req.body;
  const user = await userService.resendCodeService(email, req, next);
 
  successRes({ res, data: 'OTP resent to email' });
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }}

export const getUserAccount = async (req, res, next) => {

    const user =req.user
    const FindUser = await UserModel.findById(user._id)
     if (FindUser && FindUser._id.toString() === user._id.toString()) {
        return res.status(200).json({ message: 'done', FindUser })
    }
    res.status(404).json({ message: 'in-valid Id' })
}

export const logOut = async (req, res, next) => {
 try {
   const userId = req.user._id;
   const loggedOutUser = await userService.logOutService(userId, req, next);
    successRes({
      res,
      status: 200,
      message: 'log out done',
      data: { loggedOutUser },
    });
  }
  catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }

 }












