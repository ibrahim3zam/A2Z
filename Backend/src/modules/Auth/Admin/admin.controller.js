
import { AdminModel } from "../../../../DB/Models/Admin.model.js"
import { EngineerModel } from "../../../../DB/Models/Engineer.model.js"
import jwt from 'jsonwebtoken';
import DBService from "../../../../DB/DBService.js"
import pkg from 'bcrypt'
import { customAlphabet } from "nanoid"
import { paginationFunction } from "../../../utils/pagination.js"
// import { categoryModel } from "../../../../DB/Models/Category.model.js"
import { productModel } from "../../../../DB/Models/Product.model.js"
import slugify from "slugify"
import { UserModel } from "../../../../DB/Models/user.model.js"
// import { contactModel } from "../../../../DB/Models/contact.model.js"
// import { orderModel } from "../../../../DB/Models/order.model.js"
import { successRes } from "../../../utils/success.res.js"
import twilio from 'twilio'
import { sendSMS } from '../../../services/sendSms/twilio.js';
import { adminOtpTemplate } from '../../../services/sendSms/smsTemplates.js'; 
import { types } from "../../../middlewares/auth.js";
import { uploadSingleFile } from "../../../services/multer/cloud.service.js";
import { emailEvent } from "../../../services/sendEmail/emailEvent.js";
import { template } from "../../../services/sendEmail/generateHtml.js";
import { multerUploadFile } from "../../../services/multer/multer.cloud.js";
const nanoid = customAlphabet('1234567890', 6)

const adminDB = new DBService(AdminModel);
const engineerDB = new DBService(EngineerModel);

export const handleSignUp = async (req, res, next) => {
  const {
    phoneNumber,
    OTP,
    userName,
    email,
    age,
    gender,
  } = req.body

  // phone check
  const isPhoneDuplicate = await adminDB.findOne({ phoneNumber })
  if (isPhoneDuplicate) {
    return next(new Error('phone is already exist', { cause: 400 }))
  }

  const isEmailDuplicate = await adminDB.findOne({ email })
  if (isEmailDuplicate) {
    return next(new Error('email is already exist', { cause: 400 }))
  }


  const isOTPDuplicate = await adminDB.findOne({ OTP })
  if (isOTPDuplicate) {
    return next(new Error('OTP Duplicated', { cause: 400 }))
  }
 
  const objAdmin = new AdminModel({
    phoneNumber,
    OTP,
    userName,
    email,
    age,
    gender,

  })
  const saveAdmin = await objAdmin.save()
return successRes({
    res,                            
    message: "Admin Created Successfully",
    data: { saveAdmin },
    status: 201
})
}

export const signInP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return next(new Error('Phone number is required', { cause: 400 }));
    }

    const admin = await AdminModel.findOne({ phoneNumber });
    if (!admin) {
      return next(new Error('Admin Not Found', { cause: 404 }));
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.OTP = generatedOtp;
    await admin.save();

    let responsePayload = { message: 'OTP processed successfully' };
    
    try {
    
      await sendSMS(phoneNumber, ` Your Admin Login OTP is ${generatedOtp}`);
      responsePayload.sms_status = "Sent via Twilio";
    } catch (smsError) {
      responsePayload.sms_status = "Bypassed (Twilio Restricted)";
    }

    if (process.env.NODE_ENV === 'development') {
      responsePayload.development_otp = generatedOtp;
    }
  const  updateAdmin = await adminDB.findByIdAndUpdate(admin._id, { isVerify: true }, { new: true });


    return res.status(200).json(responsePayload);

  } catch (error) {
    return next(new Error(`Sign In Phase 1 Error: ${error.message}`, { cause: 500 }));
  }
};


// ==========================================
// 2️⃣ الخطوة الثانية: التحقق من الـ OTP وتوليد التوكن
// ==========================================
export const signInO = async (req, res, next) => {
  try {
    const { OTP, phoneNumber } = req.body;

    if (!OTP || !phoneNumber) {
      return next(new Error('Phone number and OTP are required', { cause: 400 }));
    }

    const admin = await adminDB.findOne({ phoneNumber });
    if (!admin) {
      return next(new Error('Admin Not Found, try again', { cause: 404 }));
    }

    if (!admin.OTP || admin.OTP.toString() !== OTP.toString()) {
      return next(new Error('In-valid OTP', { cause: 400 }));
    }

    if (admin.isVerify === false) {
      return next(new Error('Please Verify your Account first', { cause: 400 }));
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
           type: types.refresh,
         },
         process.env.REFRESH_TOKEN_SECRET,
         {
           expiresIn: '7d',
         }
       );
     
    

    admin.OTP = null;
    await admin.save();

    return res.status(200).json({ 
      message: 'Login Successful', 
      accessToken,
      refreshToken
    });
    

  } catch (error) {
    return next(new Error(`Sign In Phase 2 Error: ${error.message}`, { cause: 500 }));
  }
};

export const updateProfile = async (req, res, next) => {
  const {

    email,
    userName,
  } = req.body
  const user = req.user

  const admin = await adminDB.findById(user._id)
  if (!req.file) {
    return next(new Error('please upload a Admin pic', { cause: 400 }))
  }

    const oldPublicId = admin.profilePic?.public_id
    const { secure_url, public_id } = await uploadSingleFile({
        path: req.file.path,
        folder: `Admin/ProfilePic/${admin._id}`,
    })
  const updatedAdmin = await adminDB.findByIdAndUpdate(user._id, {
    profilePic: {
      secure_url,
      public_id,
    },

    email,
    userName,
  },
    {
      new: true,
    },)
  if (updatedAdmin) {
    return res.status(200).json({ messege: 'Done', updatedAdmin });
  }

}


export const getadminaccount = async (req, res, next) => {

  const user = req.user

  const admin = await adminDB.findById(user._id)
  if (admin) {
    return res.status(200).json({ message: 'done', admin })
  }
  res.status(404).json({ message: 'in-valid Id' })
}

export const addEngineer = async (req, res, next) => {
  const {
    userName,
    email,
    password,
    age,
    gender,
    phoneNumber,
    address,
    spicalAt
  } = req.body

  const user= req.user

  // email check
  const engineer = await engineerDB.findOne({ email })
  if (engineer) {
    return next(new Error('email is already exist', { cause: 400 }))
  }
       const token = jwt.sign(
         {
           Email:email,
       
         },
     
         process.env.ACCESS_TOKEN_SECRET,
         { expiresIn: '1h' }
       );
  const conirmationlink = `${req.protocol}://${req.headers.host}/admin/confirm/${token}`
  const isEmailSent = emailEvent.emit('sendEmail', {
      to: email,
      subject: 'Email Verification',
      html: template(
        conirmationlink,
        'Email Verification',
        'Please use the following Link to verify your email address.'
      ),
    });


  if (!isEmailSent) {
    return next(new Error('fail to sent confirmation email', { cause: 400 }))
  }

  // hash password => from hooks
  const hashedPassword = pkg.hashSync(password, +process.env.SALT)

  const Addengineer = new EngineerModel({
    userName,
    email,
    password: hashedPassword,
    age,
    gender,
    phoneNumber,
    address,
    spicalAt,
    addedBy: req.user._id,

  })
  const saveEngineer = await Addengineer.save()
  successRes({
    res,
    message: "Engineer Created Successfully",
    data: { saveEngineer },
    status: 201
    })
}

export const confirmEmail = async (req, res, next) => {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded || !decoded.Email) {
        return next(new Error('Invalid or expired token', { cause: 400 }));
    }
    const engineer = await engineerDB.findOneAndUpdate(
        { email: decoded.Email },
        { isConfirmed: true },
        { new: true }
    );
    if (!engineer) {
        return next(new Error('Engineer not found', { cause: 404 }));
    }
    if (!engineer.isConfirmed) {
        return next(new Error('Email confirmation failed', { cause: 400 }));
    }
    if (engineer.isConfirmed) {
        return res.status(200).json({ message: 'Email confirmed successfully', engineer });
    }
    if (!engineer.isConfirmed) {
        return next(new Error('Email confirmation failed', { cause: 400 }));
    }
 }


export const getAll = async (req, res, next) => {
const user =req.user  
const admin = await adminDB.findById(user._id)
  if (!admin) {
    return res.status(404).json({ error: 'admin not found' });
  }
  const Engs = await engineerDB.find()
  // .limit(limit).skip(skip)
  res.status(200).json({ message: 'Done', Engs })
}

export const getEngBy = async (req, res, next) => {
  const user = req.user
  const { engid } = req.query
  const admin = await adminDB.findById(user._id);
  if (!admin) {
    return res.status(404).json({ error: 'admin not found' });
  }
  const eng = await engineerDB.findById(engid);
  if (!eng) {
    return res.status(404).json({ error: 'eng not found' });
  }
  // const { searchKey, page, size } = req.query

  // const { limit, skip } = paginationFunction({ page, size })

  // const Engineer = await EngineerModel
  //     .find(
  //       // {
  //         // $or: [
  //         //     { userName: { $regex: searchKey, $options: 'i' } },
  //         //     { phoneNumber: { $regex: searchKey, $options: 'i' } },
  //         // ],
  //     // }
  //   )
  //     // .limit(limit)
  //     // .skip(skip)
  res.status(200).json({ message: 'Done', eng })
}

export const updateEng = async (req, res, next) => {
  try {
    const adminUser = req.user;
    const { engId } = req.params;

    const {
      userName,
      age,
      gender,
      phoneNumber,
      address,
      password
    } = req.body;

    // 1. البحث عن المهندس
    const engineer = await EngineerModel.findById(engId);
    if (!engineer) {
      return next(new Error('Engineer Not Found', { cause: 404 }));
    }

    if (userName) engineer.userName = userName;
    if (age) engineer.age = age;
    if (gender) engineer.gender = gender;
    if (phoneNumber) engineer.phoneNumber = phoneNumber;
    if (address) engineer.address = address;

    if (password) {
      engineer.password = pkg.hashSync(password, +process.env.SALT);
    }

    if (req.file) {
      if (engineer.profilePic && engineer.profilePic.public_id) {
        await cloudinary.uploader.destroy(engineer.profilePic.public_id);
      }

      const { secure_url, public_id } = await multerUploadFile(req.file.path, {
        folder: `${process.env.PROJECT_FOLDER}/Engineer/ProfilePic/${engineer.customId || engineer._id}`,
      });

      engineer.profilePic = { secure_url, public_id };
    }

    engineer.UpdatedBy = adminUser._id;
    const updatedEngineer = await engineer.save();

    return successRes({
      res,
      message: 'Engineer updated successfully',
      data: { engineer: updatedEngineer },
      status: 200
    });

  } catch (error) {
    return next(new Error(`Update Engineer Error: ${error.message}`, { cause: 500 }));
  }
};
export const deleteEng = async (req, res, next) => {
  const { engId } = req.params
  const user = req.user

  // check engineer id
  const engExists = await engineerDB.findById(engId)
  if (!engExists) {
    return next(new Error('invalid engineerId', { cause: 400 }))
  }
  await engineerDB.deleteOne({ engExists },{new:true})
  engExists.deletedBy = user._id
  // //Cloudinary
  // await cloudinary.api.delete_all_resources(
  //     `${process.env.PROJECT_FOLDER}/Engineer/ProfilePic/${engExists.customId}`,
  // )

  // await cloudinary.api.delete_folder(
  //     `${process.env.PROJECT_FOLDER}/Engineer/ProfilePic/${engExists.customId}`,
  // )
  await engExists.save()
  res.status(200).json({ messsage: 'Deleted Done' })
}
// when admin logout i want make it offline and delete token cant doing any things when delte token 

export const logOut = async (req, res, next) => {
  const user = req.user
  const { userid } = req.params

  const userExist = await AdminModel.findById(userid)
  if (!userExist) {
    return res.json({ message: 'invaled admin id' })
  }
  if (userExist._id.toString() !== id.toString()) {
    return next(new Error('can not take this action', { cause: 400 }))
  }
  await AdminModel.findByIdAndUpdate(id, {
    status: 'Offline'
  })
  res.json({ message: "log out done" })
}



export const addCategory = async (req, res, next) => {
  const { id } = req.authAdmin
  const { name } = req.body



  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  if (await categoryModel.findOne({ name })) {
    return next(
      new Error('please enter different category name', { cause: 400 }),
    )
  }

  // if (!req.file) {
  //   return next(new Error('please upload a category image', { cause: 400 }))
  // }

  // const customId = nanoid()
  // const { secure_url, public_id } = await cloudinary.uploader.upload(
  //   req.file.path,
  //   {
  //     folder: `${process.env.PROJECT_FOLDER}/Categories/${customId}`,
  //   },
  // )

  const categoryObject = {
    name,

    // Image: {
    //   secure_url,
    //   public_id,
    // },
    // customId,
    createdBy: id,
  }

  const category = await categoryModel.create(categoryObject)
  if (!category) {
    await cloudinary.uploader.destroy(public_id)
    return next(
      new Error('try again later , fail to add your category', { cause: 400 }),
    )
  }
  res.status(200).json({ message: 'Added Done', category })
}


export const updateCategory = async (req, res, next) => {
  const { id } = req.authAdmin
  const { categoryId } = req.params
  const { name } = req.body

  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  // get category by id

  const category = await categoryModel.findById(categoryId)
  if (!category) {
    return next(new Error('invalud category Id', { cause: 400 }))
  }

  if (name) {
    // different from old name
    if (category.name == name.toLowerCase()) {
      return next(
        new Error('please enter different name from the old category name', {
          cause: 400,
        }),
      )
    }
    // unique name
    if (await categoryModel.findOne({ name })) {
      return next(
        new Error('please enter different category name , duplicate name', {
          cause: 400,
        }),
      )
    }

    category.name = name
    category.slug = slugify(name, '_')
    category.updatedBy = id
  }

  if (req.file) {
    // delete the old category image
    await cloudinary.uploader.destroy(category.Image.public_id)

    // upload the new category image
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}`,
      },
    )
    // db
    category.Image = { secure_url, public_id }
  }

  await category.save()
  res.status(200).json({ message: 'Updated Done', category })
}


export const getAllCategories = async (req, res, next) => {
  const { id } = req.authAdmin
  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  const Categories = await categoryModel.find()

  res.status(200).json({ message: 'Done', Categories })
}

export const getAllUser = async (req, res, next) => {

  const { id } = req.authAdmin

  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  const user = await UserModel.find()
  if (user) {
    return res.status(200).json({ message: 'done', user })
  }
  res.status(404).json({ message: 'in-valid Id' })
}


// add product , update , delete 

export const addProduct = async (req, res, next) => {
  const { title, desc, price, appliedDiscount, colors, sizes, stock, name } = req.body
  const { id } = req.authAdmin
  // const { categoryId } = req.params
  // check Ids
  const categoryExists = await categoryModel.findOne({ name })

  if (!categoryExists) {
    return next(new Error('invalid categories', { cause: 400 }))
  }

  const slug = slugify(title, {
    replacement: '_',
  })
  //   if (appliedDiscount) {
  //   const priceAfterDiscount = price - price * ((appliedDiscount || 0) / 100)
  const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100)
  //   }

  if (!req.files) {
    return next(new Error('please upload pictures', { cause: 400 }))
  }
  const customId = nanoid()

  let Images = []
  let ImageCover

  for (const file in req.files) {
      if (file == "Images") {
          for (let index = 0; index < req.files[file].length; index++) {
              const { path } = req.files[file][index]
              const { secure_url, public_id } = await cloudinary.uploader.upload(path,
                  {
                      folder: `${process.env.PROJECT_FOLDER}/Categories/Product/Images/${customId}`
                  }
              )
              Images.push({ secure_url, public_id })
          }
      }
      if (file == "imageCover") {
          for (let index = 0; index < req.files[file].length; index++) {
              const { path } = req.files[file][index]
              const { secure_url, public_id } = await cloudinary.uploader.upload(path,
                  {
                     folder: `${process.env.PROJECT_FOLDER}/Categories/Product/ImageCover/${customId}`
                  }
              )
              ImageCover = { secure_url, public_id }
          }
      }
  }



  const productObject = {
    title,
    desc,
    price,
    appliedDiscount,
    priceAfterDiscount,
    colors,
    sizes,
    stock,
    name,
    Images,
    customId,
    createdBy: id,
    slug,
    ImageCover
      ,
  }

  const product = await productModel.create(productObject)
  if (!product) {
    await cloudinary.api.delete_resources(publicIds)
    return next(new Error('trye again later', { cause: 400 }))
  }
  res.status(200).json({ message: 'Done', product })
}

export const updateProduct = async (req, res, next) => {
  const { id } = req.authAdmin
  const { productId, categoryId } = req.body


  const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body

  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  // check productId

  const product = await productModel.findById(productId)
  if (!product) {
    return next(new Error('invalid product id', { cause: 400 }))
  }


  const categoryExists = await categoryModel.findById(
    categoryId || product.categoryId,
  )
  if (categoryId) {
    if (!categoryExists) {
      return next(new Error('invalid categories', { cause: 400 }))
    }
    product.categoryId = categoryId
  }



  if (appliedDiscount && price) {
    const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100)
    product.priceAfterDiscount = priceAfterDiscount
    product.price = price
    product.appliedDiscount = appliedDiscount
  } else if (price) {
    const priceAfterDiscount =
      price * (1 - (product.appliedDiscount || 0) / 100)
    product.priceAfterDiscount = priceAfterDiscount
    product.price = price
  } else if (appliedDiscount) {
    const priceAfterDiscount =
      product.price * (1 - (appliedDiscount || 0) / 100)
    product.priceAfterDiscount = priceAfterDiscount
    product.appliedDiscount = appliedDiscount
  }

  if (req.files?.length) {
    let ImageArr = []
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/Products/${product.customId}`,
        },
      )
      ImageArr.push({ secure_url, public_id })
    }
    let public_ids = []
    for (const image of product.Images) {
      public_ids.push(image.public_id)
    }
    await cloudinary.api.delete_resources(public_ids)
    product.Images = ImageArr
  }

  if (title) {
    product.title = title
    product.slug = slugify(title, '-')
  }
  if (desc) product.desc = desc
  if (colors) product.colors = colors
  if (sizes) product.sizes = sizes
  if (stock) product.stock = stock

  await product.save()
  res.status(200).json({ message: 'Done', product })
}


export const deleteProduct = async (req, res, next) => {
  const { productId } = req.params
  const { id } = req.authAdmin

  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  // check productId
  const product = await productModel.findByIdAndDelete(productId)
  if (!product) {
    return next(new Error('invalid product id', { cause: 400 }))
  }
  res.status(200).json({ message: 'Done', product })
}

export const getAllProduct = async (req, res, next) => {
  const { id } = req.authAdmin
  if (!await AdminModel.findById(id)) {
    return next(
      new Error('invaild id ', { cause: 400 }),
    )
  }
  const Products = await productModel.find()

  res.status(200).json({ message: 'Done', Products })
}

export const deleteUser = async (req, res, next) => {
  const { userId } = req.params
  const { id } = req.authAdmin


  const userExists = await UserModel.findById(userId)
  if (!userExists) {
    return next(new Error('invalid userId', { cause: 400 }))
  }
  await UserModel.deleteOne({ userExists })
  userExists.deletedBy = id

  await userExists.save()
  res.status(200).json({ messsage: 'Deleted Done' })
}


export const getUserMessages = async (req, res, next) => {

  const messages = await contactModel.find()
  if (messages.length) {
    return res.status(200).json({ messsage: 'Done', messages })
  }
  res.status(200).json({ messsage: 'empty inbox' })
}


export const getAllAdmin = async (req, res, next) => {

  const admin = await AdminModel.find()
  if (!admin) {
    return next(new Error('admin not Found', { cause: 400 }))
  }

  res.status(200).json({ message: 'Done', admin })
}




export const getUserCount = async (req, res, next) => {
  const user = await UserModel.find()
  const count = user.length
  if (user) {
    return res.status(200).json({ message: 'done', count })
  }
  res.status(404).json({ message: 'in-valid Id' })
}

export const getEngCount = async (req, res, next) => {
  const Eng = await EngineerModel.find()
  const count = Eng.length
  if (Eng) {
    return res.status(200).json({ message: 'done', count })
  }
  res.status(404).json({ message: 'in-valid Id' })
}


export const getAllOrder = async (req, res, next) => {

  const order = await orderModel.find()
  if (!order) {
    return next(new Error('Not Found', { cause: 400 }))
  }

  res.status(200).json({ message: 'Done', order })
}

export const getEngVerified = async (req, res, next) => {

  const unverifiedEngineers = await EngineerModel.find({ isConfirmed: false });

  res.status(200).json({ message: 'Done', unverifiedEngineers })
}

export const updateEngVerify = async (req, res, next) => {
  const { engId } = req.params
  const { Verify } = req.body

  const Engineer = await EngineerModel.findByIdAndUpdate(
    engId,
    {
      isConfirmed: Verify,
    },
    {
      new: true,
    },
  )
  if (!Engineer) {
    return next(
      new Error('Fail Update', { cause: 400 }),)
  }
  res.status(200).json({ message: 'Done', Engineer })

}


export const getOrdersSubTotal = async (req, res, next) => {
  const order = await orderModel.find()
  let subtotals = 0
  for (const sub of order) {
    subtotals += sub.subTotal

  }
  if (order) {
    return res.status(200).json({ message: 'done', subtotals })
  }
  res.status(404).json({ message: 'in-valid Id' })
}




