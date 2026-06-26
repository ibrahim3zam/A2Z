
// import { allowedExtensions } from '../../../utils/allowedExtensions.js';
import { adminAuth } from '../../../middlewares/auth.js';
import { multerUploadFile } from '../../../services/multer/multer.cloud.js';
import * as ac from './admin.controller.js'
import { Router } from "express";
const router = Router()


router.post('/signup', (ac.SignUp))
router.post('/phonenumber', (ac.signInP))
router.post('/OTP', (ac.signInO))
router.put('/updateadminprofile',multerUploadFile().single('image'), adminAuth,(ac.updateProfile))
router.get('/getadmininfo',adminAuth,(ac.getadminaccount))

router.post('/addengineer',adminAuth,(ac.addEngineer))
router.get('/confirm/:token', (ac.confirmEmail))
router.get('/getalleng',adminAuth,(ac.getAll))
router.get('/getengbyid',adminAuth,(ac.getEngBy))

router.put('/updateengineer/:engId', adminAuth, multerUploadFile().single('image'), (ac.updateEng))
router.delete('/delete/:engId', adminAuth, (ac.deleteEng))
// router.get('/logout/:userid', adminAuth, asyncHandler(ac.logOut))

// router.post(
//   '/addcategory',
//   isAuthAdmin(),
//   asyncHandler(ac.addCategory),
// )

// router.put(
//   '/updatecategory/:categoryId',

//   multerCloudFunction(allowedExtensions.Image).single('image'),
//   asyncHandler(ac.updateCategory),
// )
// router.get('/get', isAuthAdmin(),asyncHandler(ac.getAllCategories))
// router.post(
//   '/addproduct',isAuthAdmin(),
//   multerCloudFunction(allowedExtensions.Image).fields([{ name: "imageCover", maxCount: 1 },{ name: "Images", maxCount: 10 },]),
//   // validationCoreFunction(validators.addProductSchema),
//   asyncHandler(ac.addProduct),
// )
// router.put(
//   '/updateproduct',
//   isAuthAdmin(),
//   multerCloudFunction(allowedExtensions.Image).array('image', 10),
//   // validationCoreFunction(validators.updateProductSchema),
//   asyncHandler(ac.updateProduct),
// )
// router.get('/getallproduct', isAuthAdmin(),asyncHandler(ac.getAllProduct))
// router.get('/getalluser',isAuthAdmin(), asyncHandler(ac.getAllUser))
// router.get('/getusermsg',isAuthAdmin(),asyncHandler(ac.getUserMessages))
// router.get('/getalladmin',isAuthAdmin(), asyncHandler(ac.getAllAdmin))
// router.get('/getuserscount', isAuthAdmin(), asyncHandler(ac.getUserCount))
// router.get('/getengcount', isAuthAdmin(), asyncHandler(ac.getEngCount))
// router.get('/getallorder',isAuthAdmin(), asyncHandler(ac.getAllOrder))
// router.get('/getsomeeng',isAuthAdmin(), asyncHandler(ac.getEngVerified))
// router.get('/subtotal',isAuthAdmin(), asyncHandler(ac.getOrdersSubTotal))

// router.put(
//   '/updateengverify/:engId',
//   isAuthAdmin(),
//   asyncHandler(ac.updateEngVerify),
// )


// router.delete('/deleteproduct/:productId',isAuthAdmin(), asyncHandler(ac.deleteProduct))
// router.delete('/deleteuser/:userId',isAuthAdmin(), asyncHandler(ac.deleteUser))








export default router;