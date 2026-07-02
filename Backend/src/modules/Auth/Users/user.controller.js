import { successRes } from "../../../utils/success.res.js";
import * as userService from './user.service.js';

export const handleSignUp = async (req, res, next) => {
  try { 

const registeredUser = await userService.registerUserService(req.body);
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
  
  const user = await userService.confirmEmailService(req.body);
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
    
   const { user, accessToken, refreshToken } = await userService.logInService(req.body);
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
  
  const user = await userService.resendCodeService(req.body);
 
  successRes({ res, data: 'OTP resent to email' });
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }}

export const getUserAccount = async (req, res, next) => {
try {
    
   const FindUser = await userService.getUserAccountService(req.user);
        return successRes({
          res,
          status: 200,
          message: 'Account found',
          data: { FindUser }
        });
    }
    catch (error) {
        throw new Error(`Get Account Error: ${error.message}`, { cause: error.cause || 500 });
      }
  }



export const logOut = async (req, res, next) => {
 try {
   const token = req.headers.authorization?.split(' ')[1] || null;
   const tokenJti = req.tokenJti || null;
   
   const loggedOutUser = await userService.logOutService(req.user._id, tokenJti, token);
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












