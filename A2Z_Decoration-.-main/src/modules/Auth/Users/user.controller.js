import { UserModel } from "../../../../DB/Models/user.model.js"
import {types} from "../../../middlewares/auth.js"
import bcrypt from 'bcrypt';
import { template } from "../../../services/sendEmail/generateHtml.js";
import jwt from 'jsonwebtoken';
import DBService from "../../../../DB/DbService.js"
import { BadRequestError, NotFoundError } from "../../../utils/appError.js"
import { emailEvent, generateOtp } from "../../../services/sendEmail/emailEvent.js"
import { successRes } from "../../../utils/success.res.js";
import { nanoid } from "nanoid";
import { RevokeToken } from "../../../../DB/Models/RevokeToken.model.js";

const userDB = new DBService(UserModel);

export const SignUp = async (req, res, next) => {
    const { userName,
        email,
        password,
    } = req.body



    const isEmailDuplicate = await userDB.findOne({ email })
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
      otp: hashOtp, // تخزين ال OTP كهاش
      expiredIn: new Date(Date.now() + 10 * 60 * 1000), // صلاحية ال OTP لمدة 10 دقائق
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
};
successRes({
  res,
  status: 201,
  message: 'Account created. Check email for OTP.',
  data: safeUser,
});};

    
export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await userDB.findOne({ email });

  if (!user) {
    return next(new NotFoundError('Invalid email'));
  }
  if (!user.emailOtp?.otp || user.emailOtp.expiredIn < new Date()) {
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

  const isMatch = await bcrypt.compare(otp, user.emailOtp.otp);

  if (!isMatch) {
    return next(new Error('Invalid OTP'));
  }

  await userDB.updateOne(
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
    const user = await userDB.findOne({ email })
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

  successRes({
    res,
    data: { user, accessToken, refreshToken },
  });
};

export const resendCode = async (req, res, next) => {
  const { email } = req.body;
  const user = await userDB.findOne({ email });
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
  await userDB.updateOne(
    { _id: user._id },
    {
      emailOtp: {
        otp: hashOtp,
        expiredIn: new Date(Date.now() + 10 * 60 * 1000),
      },
        isEmailSent: true,
    }

  );
  successRes({ res, data: 'OTP resent to email' });
};

export const getUserAccount = async (req, res, next) => {

    const user =req.user
    const FindUser = await userDB.findById(user._id)
     if (FindUser && FindUser._id.toString() === user._id.toString()) {
        return res.status(200).json({ message: 'done', FindUser })
    }
    res.status(404).json({ message: 'in-valid Id' })
}

export const logOut = async (req, res, next) => {
  const user = req.user;

  const existingUser = await userDB.findById(user._id);
  if (!existingUser) {
    return res.status(404).json({ message: 'invaled user id' });
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
      user: user._id,
      onModel: 'User',
    }).catch(() => {});
  }
    await userDB.updateOne(
    { _id: user._id },
    {
      isActive: false,
    }
  );

  return res.status(200).json({ message: 'log out done' });
};

// export const getAllProduct = async (req, res, next) => {


//     const Products = await productModel.find()

//     res.status(200).json({ message: 'Done', Products })
// }

// export const getProductInfo = async (req, res, next) => {

//     const { id } = req.authClient
//     const { productId } = req.params

//     if (!await UserModel.findById(id)) {
//         return next(
//             new Error('invaild id ', { cause: 400 }),
//         )
//     }
//     const product = await productModel.findById(productId)
//     if (product) {
//         return res.status(200).json({ message: 'done', product })
//     }
//     res.status(404).json({ message: 'in-valid Id' })
// }





// export const addToCart = async (req, res, next) => {
//     const userId = req.authClient
//     const { productId, quantity } = req.body

//     // ================== product check ==============
//     const productCheck = await productModel.findOne({
//         _id: productId,
//         stock: { $gte: quantity },
//     })
//     if (!productCheck) {
//         return next(
//             new Error('inavlid product please check the quantity', { cause: 400 }),
//         )
//     }

//     const userCart = await CartModel.findOne({ userId }).lean()

//     if (userCart) {
//         // update quantity
//         let productExists = false
//         for (const product of userCart.cartItems) {
//             if (productId == product.productId) {
//                 productExists = true
//                 product.quantity = quantity
//             }
//         }
//         // push new product
//         if (!productExists) {
//             userCart.cartItems.push({ productId, quantity })
//         }

//         // subTotal
//         let subTotal = 0
//         for (const product of userCart.cartItems) {
//             const productExists = await productModel.findById(product.productId)
//             subTotal += productExists.priceAfterDiscount * product.quantity || 0
//         }
//         const newCart = await CartModel.findOneAndUpdate(
//             { userId },
//             {
//                 subTotal,
//                 products: userCart.cartItems,
//             },
//             {
//                 new: true,
//             },
//         )
//         return res.status(200).json({ message: 'Done', newCart })
//     }

//     const cartObject = {
//         userId,
//         cartItems: [{ productId, quantity }],
//         subTotal: productCheck.priceAfterDiscount * quantity,
//     }
//     const cartDB = await CartModel.create(cartObject)
//     res.status(201).json({ message: 'Done', cartDB })
// }


// export const deleteFromCart = async (req, res, next) => {
//     const userId = req.authClient
//     const { productId } = req.body

//     // ================== product check ==============
//     const productCheck = await productModel.findOne({
//         _id: productId,
//     })
//     if (!productCheck) {
//         return next(new Error('inavlid product id', { cause: 400 }))
//     }

//     const userCart = await CartModel.findOne({
//         userId,
//         'cartItems.productId': productId,
//     })
//     if (!userCart) {
//         return next(new Error('no productId in cart '))
//     }
//     userCart.cartItems.forEach((ele) => {
//         if (ele.productId == productId) {
//             userCart.cartItems.splice(userCart.cartItems.indexOf(ele), 1)
//         }
//     })
//     await userCart.save()
//     res.status(200).json({ message: 'Done', userCart })
// }

// export const contactUs = async (req, res, next) => {
//     const { id } = req.authClient
//     const
//         { name,
//             email,
//             subject,
//             message
//         } = req.body


//     const contactObject = {
//         name,
//         email,
//         subject,
//         message,
//         sendBy: id,
//     }

//     const msg = await contactModel.create(contactObject)
//     if (!msg) {
//         return next(new Error('no msg found'))
//     }
//     res.status(200).json({ message: 'Done', msg })
// }


// export const getProductsByTitle = async (req, res, next) => {
//     const { searchKey, page, size } = req.query

//     const { limit, skip } = paginationFunction({ page, size })

//     const productsc = await productModel
//         .find({
//             $or: [
//                 { title: { $regex: searchKey, $options: 'i' } },
//                 { desc: { $regex: searchKey, $options: 'i' } },
//             ],
//         })
//         .limit(limit)
//         .skip(skip)
//     res.status(200).json({ message: 'Done', productsc })
// }

// export const getProductsBycategory = async (req, res, next) => {
//     const { searchKey, page, size } = req.query

//     const { limit, skip } = paginationFunction({ page, size })

//     const productsc = await productModel
//         .find({
//             $or: [
//                 { name: { $regex: searchKey, $options: 'i' } },

//             ],
//         })
//         .limit(limit)
//         .skip(skip)
//     res.status(200).json({ message: 'Done', productsc })
// }


// export const fromCartoOrder = async (req, res, next) => {
//     const userId = req.authClient
//     const { cartId } = req.query
//     const { address, phoneNumbers, paymentMethod } = req.body

//     const cart = await CartModel.findById(cartId)
//     if (!cart) {
//         return next(new Error('please fill your cart first', { cause: 400 }))
//     }

//     let subTotal = cart.subTotal
//     //====================== paid Amount =================
//     let paidAmount = 0
//     paidAmount = subTotal

//     //======================= paymentMethod  + orderStatus ==================
//     let orderStatus
//     paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')
//     let orderProduct = []
//     for (const product of cart.products) {
//         const productExist = await productModel.findById(product.productId)
//         orderProduct.push({
//             productId: product.productId,
//             quantity: product.quantity,
//             title: productExist.title,
//             price: productExist.priceAfterDiscount,
//             finalPrice: productExist.priceAfterDiscount * product.quantity,
//         })
//     }

//     const orderObject = {
//         userId,
//         products: orderProduct,
//         address,
//         phoneNumbers,
//         orderStatus,
//         paymentMethod,
//         subTotal,
//         paidAmount,

//     }
//     const orderDB = await orderModel.create(orderObject)
//     if (orderDB) {
//         // decrease product's stock by order's product quantity
//         for (const product of cart.products) {
//             await productModel.findOneAndUpdate(
//                 { _id: product.productId },
//                 {
//                     $inc: { stock: -parseInt(product.quantity) },
//                 },
//             )
//         }

//         //TODO: remove product from userCart if exist
//         cart.products = []
//         await cart.save()

//         return res.status(201).json({ message: 'Done', orderDB, cart })
//     }
//     return next(new Error('fail to create your order', { cause: 400 }))
// }

// // Delete entire cart
// export const deleteCart = async (req, res, next) => {
//     const {id}= req.authClient

//     let cart = await CartModel.findOneAndDelete({ userId: id.toString() });
//     if (!cart)
//         return next(new Error('cart not found', { cause: 400 }))
//     res.json({ message: "Cart deleted" });
// }

// //  Delete cart item
// export const deleteCartItem = async (req, res, next) => {
//     const { productId } = req.params
//     const {id}= req.authClient


//     let cart = await CartModel.findOneAndUpdate(
//         { userId: id.toString() },
//         { $pull: { cartItems: { _id: productId} } },
//         { new: true }
//     );
//     console.log(cart);
//     res.json({ message: "Deleted", cart });
// }



// export const getAllproductFromCart = async (req, res, next) => {
//     const { id } = req.authClient
//     const cart = await CartModel.findOne({ userId: id })
//     if (!cart) {
//         return res.json({ message: 'invalid cart id' })
//     }
//     res.status(200).json({ message: 'Done', cart })
// }

// export const getAll = async (req, res, next) => {
//     // const { page, size } = req.query
//     // const { limit, skip } = paginationFunction({ page, size })
//     const { id } = req.authClient
//     const admin = await UserModel.findById(id);
//     if (!admin) {
//         return res.status(404).json({ error: 'admin not found' });
//     }
//     const Engs = await EngineerModel.find()
//     // .limit(limit).skip(skip)
//     res.status(200).json({ message: 'Done', Engs })
// }

// export const getEngBy = async (req, res, next) => {
//     const { id } = req.authClient
//     const { engid } = req.query
//     const admin = await UserModel.findById(id);
//     if (!admin) {
//         return res.status(404).json({ error: 'admin not found' });
//     }
//     const eng = await EngineerModel.findById(engid);
//     if (!eng) {
//         return res.status(404).json({ error: 'eng not found' });
//     }
//     // const { searchKey, page, size } = req.query

//     // const { limit, skip } = paginationFunction({ page, size })

//     // const Engineer = await EngineerModel
//     //     .find(
//     //       // {
//     //         // $or: [
//     //         //     { userName: { $regex: searchKey, $options: 'i' } },
//     //         //     { phoneNumber: { $regex: searchKey, $options: 'i' } },
//     //         // ],
//     //     // }
//     //   )
//     //     // .limit(limit)
//     //     // .skip(skip)
//     res.status(200).json({ message: 'Done', eng })
// }



// export const logOut = async (req, res, next) => {
//     const { id } = req.authClient

//     const userExcest = await UserModel.findById(id)
//     if (!userExcest) {
//         return res.json({ message: 'invaled user id' })
//     }

//     await UserModel.findByIdAndUpdate(id, {
//         status: 'Offline',
//         token: 'null'
//     })
//     res.json({ message: "log out done" })
// }


// export const getAllCategories = async (req, res, next) => {
//     const { id } = req.authClient
//     if (!await UserModel.findById(id)) {
//         return next(
//             new Error('invaild id ', { cause: 400 }),
//         )
//     }
//     const Categories = await categoryModel.find()

//     res.status(200).json({ message: 'Done', Categories })
// }











