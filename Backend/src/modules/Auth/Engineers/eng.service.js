import { EngineerModel } from '../../../../DB/Models/Engineer.model.js'
import { UserModel } from '../../../../DB/Models/user.model.js'
import bcrypt from 'bcrypt';
import { customAlphabet } from "nanoid"
import { emailEvent, generateOtp } from '../../../services/sendEmail/emailEvent.js';
import { template } from '../../../services/sendEmail/generateHtml.js';
import { successRes } from '../../../utils/success.res.js';
import jwt from 'jsonwebtoken';
import { types } from '../../../middlewares/auth.js';
import { BadRequestError, NotFoundError } from '../../../utils/appError.js';
import { RevokeToken } from '../../../../DB/Models/RevokeToken.model.js';
import { destroyFile, destroyMultipleFiles, uploadMultipleFiles, uploadSingleFile } from '../../../services/multer/cloud.service.js';
const nanoid = customAlphabet('12345_abcdjfh', 5)




export const registerEngineerService = async (engineerSignUpData,file) => {
    const { userName,
        email,
        password,
        phoneNumber}=engineerSignUpData

         if (!file) {
        throw new BadRequestError('plz upload identifier pic', { cause: 400 })
    }


    const isEmailDuplicate = await EngineerModel.findOne({ email })
    if (isEmailDuplicate) {
       throw new BadRequestError('Email already exists')
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
        throw new Error('fail to sign up', { cause: 400 })
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

export const confirmEmailService = async (engineerData) => {
    const {email, otp} = engineerData
    
  const user = await EngineerModel.findOne({ email });

  if (!user) {
    throw new NotFoundError('Invalid email');
  }
  if (user.emailOtp.expiredIn < new Date()) {
    throw new NotFoundError('OTP expired');
  }
  if (user.isConfirmed === true) {
    throw new BadRequestError('Email already confirmed');
  }

  if (!otp || !user.emailOtp?.otp) {
    throw new Error('Invalid or expired OTP');}

  const isMatch = await bcrypt.compare(otp, user.emailOtp.otp);

  if (!isMatch) {
    throw new Error('Invalid OTP');}

 const UpdatedEngineer = await EngineerModel.updateOne(
    { _id: user._id },
    {
      isConfirmed: true,
      $unset: { emailOtp: '' },
    }
  );
  return UpdatedEngineer;
}

export const logInService = async (engineerSignInData) => {
    const { email, password } = engineerSignInData
    const user = await EngineerModel.findOne({ email })
    if (!user) {
        throw new NotFoundError('Invalid email or password');}

    if (user.isConfirmed == false) {
        throw new BadRequestError('Please Verified your Account')
    }
    if (!user.isActive) {
    throw new BadRequestError(
      'Your account has been deactivated. Please contact support.'
    );
  }
   const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
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
export const createPostService = async (user, files) => {
     if (!files?.length) {
      throw new BadRequestError('please upload pictures', { cause: 400 })
    }
    const userId = user._id;
    if (!userId) {
        throw new UnauthorizedError('Unauthorized or user not found in request', { cause: 401 });
    }
    const engineer = await EngineerModel.findById(userId);
    if (!engineer) {
        throw new NotFoundError('Engineer not found', { cause: 404 });
    }

    const Images = await uploadMultipleFiles(
        files,
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


export const updatePostService = async (user, files) => {

     if (!files?.length) {
      throw new BadRequestError('please upload pictures', { cause: 400 })
    }

    const engineer = await EngineerModel.findById(user._id);
    if (!engineer) {
        throw new NotFoundError('Engineer not found', { cause: 404 });
    }

    const oldPublicIds = engineer.Gallery
        ?.map((image) => image.public_id)
        .filter(Boolean) || []

    const Images = await uploadMultipleFiles(
        files,
        `Engineer/communityPage/${engineer._id}`,
    )

    const updatePosts = await EngineerModel.findByIdAndUpdate(
        user._id,
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


export const getEngAccountService = async (userId) => {
    const engineer = await EngineerModel.findById(userId);
    
    if (!engineer) {
        throw new NotFoundError('Engineer not found', { cause: 404 });
    }
    
    return engineer;    
};


export const deletePostService = async ( userId) => {

   const engineer = await EngineerModel.findById(userId);
    if (!engineer) {
        throw new NotFoundError('Engineer not found', { cause: 404 });
    }

    const publicIds = engineer.Gallery
        ?.map((image) => image.public_id)
        .filter(Boolean) || []

    if (!publicIds.length) {
        throw new BadRequestError('No images found to delete', { cause: 400 });
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

export const logOutService = async (userId, req, accessJti, refreshJti) => {
  
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
        throw new NotFoundError('Invalid user id', { cause: 404 })
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

export const listAllPostsService = async ( userId) => {
    const engineer = await EngineerModel.findById(userId)
      if (!engineer) {
        throw new NotFoundError('Engineer not found', { cause: 404 });
      }
  
      const posts = await EngineerModel.find(
          { 'Gallery.0': { $exists: true } },
          { userName: 1, profilePic: 1, specialization: 1, Gallery: 1 },
      )
    return posts;
}

export const updateProfileService = async (engineerUpdatingData, targetId) => {
    const { userName, phoneNumber, address, specialization, gender, age, userRole, updaterId } = engineerUpdatingData;

    if (userRole !== 'admin' && targetId.toString() !== updaterId.toString()) {
        throw new ForbiddenError('You are not authorized to update this profile', { cause: 403 });
    }

    const engineer = await EngineerModel.findById(targetId);
    if (!engineer) {
        throw new NotFoundError('Engineer not found', { cause: 404 });
    }

    const updateData = {};
    if (userName !== undefined) updateData.userName = userName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = Array.isArray(address) ? address : [address];
    if (specialization !== undefined) updateData.specialization = specialization;
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age;

    if (!Object.keys(updateData).length) {
        throw new BadRequestError('No valid fields provided for update', { cause: 400 });
    }

    updateData.updatedBy = updaterId; 

    const engineerUpdated = await EngineerModel.findByIdAndUpdate(
        targetId,
        updateData,
        {
            new: true,
            runValidators: true,
        },
    );
    
    return engineerUpdated;
};