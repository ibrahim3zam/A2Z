import { EngineerModel } from '../../../../DB/Models/Engineer.model.js'
import { UserModel } from '../../../../DB/Models/user.model.js'
import bcrypt from 'bcrypt';
import { customAlphabet } from "nanoid"
import { emailEvent, generateOtp } from '../../../services/sendEmail/emailEvent.js';
import { template } from '../../../services/sendEmail/generateHtml.js';
import { successRes } from '../../../utils/success.res.js';
import jwt from 'jsonwebtoken';
import { types } from '../../../middlewares/auth.js';
import { BadRequestError } from '../../../utils/appError.js';
import { RevokeToken } from '../../../../DB/Models/RevokeToken.model.js';
import { destroyFile, destroyMultipleFiles, uploadMultipleFiles, uploadSingleFile } from '../../../services/multer/cloud.service.js';
const nanoid = customAlphabet('12345_abcdjfh', 5)




export const registerEngineerService = async (engineerSignUpData,req,next) => {
    const { userName,
        email,
        password,
        phoneNumber}=engineerSignUpData

         if (!req.file) {
        return next(new Error('plz upload identifier pic', { cause: 400 }))
    }


    const isEmailDuplicate = await EngineerModel.findOne({ email })
    if (isEmailDuplicate) {
       return next(new BadRequestError('Email already exists'))
    }
    const saltRounds = parseInt(process.env.SALT) || 10;
  const hash = await bcrypt.hash(password, saltRounds);
  const otp = generateOtp();
  const hashOtp = await bcrypt.hash(otp, saltRounds);
  const newEngineer = new EngineerModel({
    userName,
    email,
    phoneNumber,
    password: hash,
    emailOtp: {
      otp: hashOtp, 
      expiredIn: new Date(Date.now() + 10 * 60 * 1000), 
    },
  });

   
   
    const saveEngineer = await newEngineer.save()
    if (!saveEngineer) {
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
  const safeEngineer = {
  _id: newEngineer._id,
  userName: newEngineer.userName,
  email: newEngineer.email,
  role: newEngineer.role,
  phoneNumber: newEngineer.phoneNumber,
};
return safeEngineer;
}

export const confirmEmailService = async (engineerData,req,next) => {
    const {email, otp} = req.body
    
  const user = await EngineerModel.findOne({ email });

  if (!user) {
    return next(new NotFoundError('Invalid email'));
  }
  if (user.emailOtp.expiredIn < new Date()) {
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

 const UpdatedEngineer = await EngineerModel.updateOne(
    { _id: user._id },
    {
      isConfirmed: true,
      $unset: { emailOtp: '' },
    }
  );
  return UpdatedEngineer;
}

export const logInService = async (engineerSignInData,next) => {
    const { email, password } = engineerSignInData
    const user = await EngineerModel.findOne({ email })
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
   const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
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
export const createPostService = async ( req,next) => {
     if (!req.files?.length) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }
    const userId = req.user?._id; 
    if (!userId) {
        return next(new Error('Unauthorized or user not found in request', { cause: 401 }));
    }
    const engineer = await EngineerModel.findById(userId);
    if (!engineer) {
        return next(new Error('Engineer not found', { cause: 404 }))    ;
    }

    const Images = await uploadMultipleFiles(
        req.files,
        `Engineer/communityPage/${engineer._id}`,
    )

    const updatePost = await EngineerModel.findByIdAndUpdate(
        userId,
        {
            Gallery: Images,
        },
        {
            new: true,
        },
    )
    return updatePost;
}


export const updatePostService = async (req, next) => {

     if (!req.files?.length) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }

    const engineer = await EngineerModel.findById(req.user._id);
    if (!engineer) {
        return next(new Error('Engineer not found', { cause: 404 }));
    }

    const oldPublicIds = engineer.Gallery
        ?.map((image) => image.public_id)
        .filter(Boolean) || []

    const Images = await uploadMultipleFiles(
        req.files,
        `Engineer/communityPage/${engineer._id}`,
    )

    const updatePosts = await EngineerModel.findByIdAndUpdate(
        req.user._id,
        {
            Gallery: Images,
        },
        {
            new: true,
        },
    )

    if (oldPublicIds.length) {
        await destroyMultipleFiles(oldPublicIds)
    }
return updatePosts;
}


export const getEngAccountService = async (userId, next) => {
    const engineer = await EngineerModel.findById(userId);
    
    if (!engineer) {
        return next(new Error('Engineer account not found', { cause: 404 }));
    }
    
    return engineer;    
};


export const deletePostService = async (req, userId, next) => {

   const engineer = await EngineerModel.findById(userId);
    if (!engineer) {
        return next(new Error('Engineer not found', { cause: 404 }));
    }

    const publicIds = engineer.Gallery
        ?.map((image) => image.public_id)
        .filter(Boolean) || []

    if (!publicIds.length) {
        return next(new Error('Not pic Found', { cause: 400 }))
    }

    await destroyMultipleFiles(publicIds)

    const updatePost = await EngineerModel.findByIdAndUpdate(
        userId,
        {
            Gallery: [],
        },
        {
            new: true,
        },
    )
    return updatePost;
  }

export const logOutService = async (userId, req, accessJti, refreshJti, next) => {
  
    const engineer = await EngineerModel.findByIdAndUpdate(
        userId,
        {
            status: 'Offline',
        },
        {
            new: true,
        },
    )

    if (!engineer) {
        return next(new Error('Invalid user id', { cause: 404 }))
    }

    if (req.tokenJti) {
        const token = req.headers.authorization?.split(' ')[1]
        const decoded = token ? jwt.decode(token) : null
        const expiredIn = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 60 * 60 * 1000)

        await RevokeToken.create({
            jti: req.tokenJti,
            expiredIn,
            user: userId,
            onModel: 'Engineer',
        }).catch(() => {})
    }
return engineer;
}  

export const listAllPostsService = async (req, userId, next) => {
    const engineer = await EngineerModel.findById(userId)
      if (!engineer) {
          return next(new Error('invaild id ', { cause: 400 }))
      }
  
      const posts = await EngineerModel.find(
          { 'Gallery.0': { $exists: true } },
          { userName: 1, profilePic: 1, specialization: 1, Gallery: 1 },
      )
    return posts;
}

export const updateProfileService = async (req, targetId, next) => {
   const { userName, phoneNumber, address, specialization, gender, age } = req.body

    if (req.userRole !== 'admin' && targetId.toString() !== req.user._id.toString()) {
        return next(new Error('can not take this action', { cause: 403 }))
    }

    const engineer = await EngineerModel.findById(targetId)
    if (!engineer) {
        return next(new Error('invalud ENg Id', { cause: 400 }))
    }

    const updateData = {}
    if (userName !== undefined) updateData.userName = userName
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (address !== undefined) updateData.address = Array.isArray(address) ? address : [address]
    if (specialization !== undefined) updateData.specialization = specialization
    if (gender !== undefined) updateData.gender = gender
    if (age !== undefined) updateData.age = age

    if (!Object.keys(updateData).length) {
        return next(new BadRequestError('please enter data to update'))
    }

    updateData.updatedBy = req.user._id

    const enginnerUpdated = await EngineerModel.findByIdAndUpdate(
        targetId,
        updateData,
        {
            new: true,
            runValidators: true,
        },
    )
return enginnerUpdated;
  }