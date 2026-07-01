
import { successRes } from "../../../utils/success.res.js"

import * as adminService from './admin.service.js'; 


export const handleSignUp = async (req, res, next) => {
  try {
    const adminData = req.body;

    const savedAdmin = await adminService.registerAdminService(adminData);

    return successRes({
      res,
      message: "Admin Created Successfully",
      data: { savedAdmin },
      status: 201
    });

  } catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
};



export const loginWithPhone = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body; 

    if (!phoneNumber) {
      return next(new Error('Phone number is required', { cause: 400 }));
    }


    const serviceData = await adminService.requestLoginOtp(phoneNumber);

    return res.status(200).json({
      message: 'OTP processed successfully',
      yourOTP: serviceData
    });

  } catch (error) {
    return next(new Error(`Sign In Phase 1 Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const verifyOtp = async (req, res, next) => {
  try {
    const { OTP, phoneNumber } = req.body;

    if (!OTP || !phoneNumber) {
      return next(new Error('Phone number and OTP are required', { cause: 400 }));
    }

    const tokens = await adminService.verifyOtpAndGenerateTokens(phoneNumber, OTP);

    return res.status(200).json({ 
      message: 'Login Successful', 
      ...tokens
    });

  } catch (error) {
    return next(new Error(`Sign In Phase 2 Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bodyData = req.body;
    const file = req.file;

    const updatedAdmin = await adminService.updateAdminProfileService(userId, bodyData, file);

    return res.status(200).json({ message: 'Done', updatedAdmin });

  } catch (error) {
    return next(new Error(`Update Profile Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const getadminaccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const admin = await adminService.getAdminAccountService(userId);

    return res.status(200).json({ message: 'done', admin });

  } catch (error) {
    return next(new Error(`Get Account Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const createEngineer = async (req, res, next) => {
  try {
    const bodyData = req.body;
    const adminId = req.user._id;
    const { protocol, headers } = req;

    const saveEngineer = await adminService.createEngineerService(
      bodyData,
      adminId,
      protocol,
      headers.host
    );

    return successRes({
      res,
      message: "Engineer Created Successfully",
      data: { saveEngineer },
      status: 201
    });

  } catch (error) {
    return next(new Error(`Create Engineer Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const confirmEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const engineer = await adminService.confirmEmailService(token);

    return res.status(200).json({ 
      message: 'Email confirmed successfully', 
      engineer 
    });

  } catch (error) {
    return next(new Error(`Confirm Email Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const listEngineers = async (req, res, next) => {
  try {
    const adminId = req.user._id;

    const Engs = await adminService.listEngineersService(adminId);

    return res.status(200).json({ message: 'Done', Engs });

  } catch (error) {
    return next(new Error(`List Engineers Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const getEngineer = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const { engid } = req.query;

    const eng = await adminService.getEngineerService(adminId, engid);

    return res.status(200).json({ message: 'Done', eng });
  } catch (error) {
    return next(new Error(`Get Engineer Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const updateEngineer = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const { engId } = req.params;
    const bodyData = req.body;
    const file = req.file;

    const updatedEngineer = await adminService.updateEngineerService(engId, adminId, bodyData, file);

    return successRes({
      res,
      message: 'Engineer updated successfully',
      data: { engineer: updatedEngineer },
      status: 200
    });
  } catch (error) {
    return next(new Error(`Update Engineer Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const deleteEngineer = async (req, res, next) => {
  try {
    const { engId } = req.params;
    const adminId = req.user._id;

    await adminService.deleteEngineerService(engId, adminId);

    return res.status(200).json({ message: 'Deleted Done' });
  } catch (error) {
    return next(new Error(`Delete Engineer Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};


export const logOut = async (req, res, next) => {
  try {
    const requestingAdminId = req.user._id;
    const { userid } = req.params; 

    await adminService.logoutAdminService(requestingAdminId, userid);

    return res.status(200).json({ message: "log out done" });
  } catch (error) {
    return next(new Error(`Logout Error: ${error.message}`, { cause: error.cause || 500 }));
  }
};





// export const getAllUser = async (req, res, next) => {

//   const { id } = req.authAdmin

//   if (!await AdminModel.findById(id)) {
//     return next(
//       new Error('invaild id ', { cause: 400 }),
//     )
//   }
//   const user = await UserModel.find()
//   if (user) {
//     return res.status(200).json({ message: 'done', user })
//   }
//   res.status(404).json({ message: 'in-valid Id' })
// }



// export const deleteUser = async (req, res, next) => {
//   const { userId } = req.params
//   const { id } = req.authAdmin


//   const userExists = await UserModel.findById(userId)
//   if (!userExists) {
//     return next(new Error('invalid userId', { cause: 400 }))
//   }
//   await UserModel.deleteOne({ userExists })
//   userExists.deletedBy = id

//   await userExists.save()
//   res.status(200).json({ messsage: 'Deleted Done' })
// }


// export const getUserMessages = async (req, res, next) => {

//   const messages = await contactModel.find()
//   if (messages.length) {
//     return res.status(200).json({ messsage: 'Done', messages })
//   }
//   res.status(200).json({ messsage: 'empty inbox' })
// }


// export const getAllAdmin = async (req, res, next) => {

//   const admin = await AdminModel.find()
//   if (!admin) {
//     return next(new Error('admin not Found', { cause: 400 }))
//   }

//   res.status(200).json({ message: 'Done', admin })
// }




// export const getUserCount = async (req, res, next) => {
//   const user = await UserModel.find()
//   const count = user.length
//   if (user) {
//     return res.status(200).json({ message: 'done', count })
//   }
//   res.status(404).json({ message: 'in-valid Id' })
// }

// export const getEngCount = async (req, res, next) => {
//   const Eng = await EngineerModel.find()
//   const count = Eng.length
//   if (Eng) {
//     return res.status(200).json({ message: 'done', count })
//   }
//   res.status(404).json({ message: 'in-valid Id' })
// }




// export const getEngVerified = async (req, res, next) => {

//   const unverifiedEngineers = await EngineerModel.find({ isConfirmed: false });

//   res.status(200).json({ message: 'Done', unverifiedEngineers })
// }

// export const updateEngVerify = async (req, res, next) => {
//   const { engId } = req.params
//   const { Verify } = req.body

//   const Engineer = await EngineerModel.findByIdAndUpdate(
//     engId,
//     {
//       isConfirmed: Verify,
//     },
//     {
//       new: true,
//     },
//   )
//   if (!Engineer) {
//     return next(
//       new Error('Fail Update', { cause: 400 }),)
//   }
//   res.status(200).json({ message: 'Done', Engineer })

// }




