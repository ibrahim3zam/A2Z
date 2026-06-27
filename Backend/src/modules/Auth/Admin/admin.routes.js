
// import { allowedExtensions } from '../../../utils/allowedExtensions.js';
import { adminAuth } from '../../../middlewares/auth.js';
import { multerUploadFile } from '../../../services/multer/multer.cloud.js';
import * as adminController from './admin.controller.js'
import { Router } from "express";
const router = Router()

/**
 * @param {object} options
 * @param {number} options.userId
 * @param {number} options.currentBaseSalary
 * @returns {Promise<number>} - The calculated payslip amount
 */

// const calculatePaysLip = (userId: number , currentBaseSalary: number)
// const calculatePaysLip = (options: { userId: number; currentBaseSalary: number }) 

router.post('/signup', (adminController.handleSignUp))
router.post('/phonenumber', (adminController.signInP))
router.post('/OTP', (adminController.signInO))
router.put('/updateadminprofile',multerUploadFile().single('image'), adminAuth,(adminController.updateProfile))
router.get('/getadmininfo',adminAuth,(adminController.getadminaccount))

router.post('/addengineer',adminAuth,(adminController.addEngineer))
router.get('/confirm/:token', (adminController.confirmEmail))
router.get('/getalleng',adminAuth,(adminController.getAll))
router.get('/getengbyid',adminAuth,(adminController.getEngBy))

router.put('/updateengineer/:engId', adminAuth, multerUploadFile().single('image'), (adminController.updateEng))
router.delete('/delete/:engId', adminAuth, (adminController.deleteEng))
// router.get('/logout/:userid', adminAuth, asyncHandler(adminController.logOut))

// router.post(
//   '/addcategory',
//   isAuthAdmin(),
//   asyncHandler(adminController.addCategory),
// )

// router.put(
//   '/updatecategory/:categoryId',

//   multerCloudFunction(allowedExtensions.Image).single('image'),
//   asyncHandler(adminController.updateCategory),
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