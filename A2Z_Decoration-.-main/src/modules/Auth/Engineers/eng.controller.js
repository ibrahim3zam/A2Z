
import DBService from '../../../../DB/DbService.js'
import { EngineerModel } from '../../../../DB/Models/Engineer.model.js'
import { UserModel } from '../../../../DB/Models/user.model.js'
import bcrypt from 'bcrypt';
import { customAlphabet } from "nanoid"
import { emailEvent, generateOtp } from '../../../services/sendEmail/emailEvent.js';
import { template } from '../../../services/sendEmail/generateHtml.js';
import { successRes } from '../../../utils/success.res.js';
const nanoid = customAlphabet('12345_abcdjfh', 5)
import jwt from 'jsonwebtoken';
import { types } from '../../../middlewares/auth.js';
import { BadRequestError } from '../../../utils/appError.js';
import { RevokeToken } from '../../../../DB/Models/RevokeToken.model.js';
import { destroyFile, destroyMultipleFiles, uploadMultipleFiles, uploadSingleFile } from '../../../services/multer/cloud.service.js';




const engineerDB = new DBService(EngineerModel);



export const SignUp = async (req, res, next) => {
    const { userName,
        email,
        password,
        phoneNumber,
    } = req.body

    if (!req.file) {
        return next(new Error('plz upload identifier pic', { cause: 400 }))
    }


    const isEmailDuplicate = await engineerDB.findOne({ email })
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
      otp: hashOtp, // تخزين ال OTP كهاش
      expiredIn: new Date(Date.now() + 10 * 60 * 1000), // صلاحية ال OTP لمدة 10 دقائق
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
successRes({
  res,
  status: 201,
  message: 'Account created. Check email for OTP.',
  data: safeEngineer,
});};

    
export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await engineerDB.findOne({ email });

  if (!user) {
    return next(new NotFoundError('Invalid email'));
  }
  if (user.emailOtp.expiredIn < new Date()) {
    return next(new NotFoundError('OTP expired'));
  }
  // لو confirmed قبل كده
  if (user.isConfirmed === true) {
    return next(new BadRequestError('Email already confirmed'));
  }

  // تأكد إن فيه otp
  if (!otp || !user.emailOtp?.otp) {
    return next(new Error('Invalid or expired OTP'));
  }

  // 🔥 المقارنة الصح (تم التعديل لأن الـ otp محفوظ كنص عادي)
  const isMatch = await bcrypt.compare(otp, user.emailOtp.otp);

  if (!isMatch) {
    return next(new Error('Invalid OTP'));
  }

  // ✅ بعد ما نتأكد نعمل update
  await engineerDB.updateOne(
    { _id: user._id },
    {
      isConfirmed: true,
      $unset: { emailOtp: '' },
    }
  );

  return res.json({ message: 'Email confirmed successfully' });
};


export const logIn = async (req, res, next) => {
    const { email, password } = req.body
    const user = await engineerDB.findOne({ email })
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

  // const payload = { id: user._id, role: user.role };

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

  successRes({
    res,
    data: { user, accessToken, refreshToken },
  });
};

export const communityPage = async (req, res, next) => {

    const user = req.user

    if (!req.files?.length) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }
    const engineer = await engineerDB.findById(user._id);
    if (!engineer) {
        return res.status(404).json({ error: 'engineer not found' });
    }

    const Images = await uploadMultipleFiles(
        req.files,
        `Engineer/communityPage/${engineer._id}`,
    )

    const engNew = await engineerDB.findByIdAndUpdate(
        user._id,
        {
            Gallery: Images,
        },
        {
            new: true,
        },
    )
    res.status(200).json({ message: 'Done', engNew })
}


export const updateGallery = async (req, res, next) => {
    const user = req.user

    if (!req.files?.length) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }

    const engineer = await engineerDB.findById(user._id);
    if (!engineer) {
        return res.status(404).json({ error: 'engineer not found' });
    }

    const oldPublicIds = engineer.Gallery
        ?.map((image) => image.public_id)
        .filter(Boolean) || []

    const Images = await uploadMultipleFiles(
        req.files,
        `Engineer/communityPage/${engineer._id}`,
    )

    const engNew = await engineerDB.findByIdAndUpdate(
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

    return res.status(200).json({ message: 'UpdateDone', engNew });
}


export const getEngAccount = async (req, res, next) => {
    const user = req.user

    const engineer = await engineerDB.findById(user._id)
    if (engineer) {
        return res.status(200).json({ message: 'done', engineer })
    }

    return res.status(404).json({ message: 'in-valid Id' })
}


export const profilePic = async (req, res, next) => {
    const user = req.user

    if (!req.file) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }

    const engineer = await engineerDB.findById(user._id);
    if (!engineer) {
        return res.status(404).json({ error: 'engineer not found' });
    }

    const oldPublicId = engineer.profilePic?.public_id
    const { secure_url, public_id } = await uploadSingleFile({
        path: req.file.path,
        folder: `Engineer/ProfilePic/${engineer._id}`,
    })

    const engNew = await engineerDB.findByIdAndUpdate(
        user._id,
        {
          profilePic: {
            secure_url,
            public_id,
          },
        },
        {
          new: true,
        },
    )

    if (oldPublicId) {
        await destroyFile(oldPublicId)
    }

    return res.status(200).json({ message: 'Done', engNew });
}

export const deleteGallery = async (req, res, next) => {
    const user = req.user

    const engineer = await engineerDB.findById(user._id);
    if (!engineer) {
        return res.status(404).json({ error: 'engineer not found' });
    }

    const publicIds = engineer.Gallery
        ?.map((image) => image.public_id)
        .filter(Boolean) || []

    if (!publicIds.length) {
        return next(new Error('Not pic Found', { cause: 400 }))
    }

    await destroyMultipleFiles(publicIds)

    const engNew = await engineerDB.findByIdAndUpdate(
        user._id,
        {
            Gallery: [],
        },
        {
            new: true,
        },
    )

    return res.status(200).json({ message: 'Deleted Done', engNew })
}


export const logOut = async (req, res, next) => {
    const user = req.user

    const engineer = await engineerDB.findByIdAndUpdate(
        user._id,
        {
            status: 'Offline',
        },
        {
            new: true,
        },
    )

    if (!engineer) {
        return res.status(404).json({ message: 'invaled user id' })
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
            user: user._id,
            onModel: 'Engineer',
        }).catch(() => {})
    }

    return res.status(200).json({ message: 'log out done' })
}

export const getAllPosts = async (req, res, next) => {
    const engineer = await engineerDB.findById(req.user._id)
    if (!engineer) {
        return next(new Error('invaild id ', { cause: 400 }))
    }

    const posts = await EngineerModel.find(
        { 'Gallery.0': { $exists: true } },
        { userName: 1, profilePic: 1, specialization: 1, Gallery: 1 },
    )

    return res.status(200).json({ message: 'Done', posts })
}

export const updateProfile = async (req, res, next) => {
    const targetId = req.params.userid || req.user._id
    const { userName, phoneNumber, address, specialization, gender, age } = req.body

    if (req.userRole !== 'admin' && targetId.toString() !== req.user._id.toString()) {
        return next(new Error('can not take this action', { cause: 403 }))
    }

    const engineer = await engineerDB.findById(targetId)
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

    const eng = await engineerDB.findByIdAndUpdate(
        targetId,
        updateData,
        {
            new: true,
            runValidators: true,
        },
    )

    return res.status(200).json({ message: 'Updated Done', eng })
}

export const getuserBy = async (req, res, next) => {
    const { userid } = req.params

    const eng = await engineerDB.findById(req.user._id);
    if (!eng) {
      return res.status(404).json({ error: 'eng not found' });
    }

    const user = await UserModel.findById(userid);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    return res.status(200).json({ message: 'Done', user })
}
