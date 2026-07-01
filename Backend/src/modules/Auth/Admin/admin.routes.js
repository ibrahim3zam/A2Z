
// import { allowedExtensions } from '../../../utils/allowedExtensions.js';
import { adminAuth } from '../../../middlewares/auth.js';
import { multerUploadFile } from '../../../services/multer/multer.cloud.js';
import * as adminController from './admin.controller.js'
import { Router } from "express";
const router = Router()

/**
 * TODO: 
 * - add proper path names for API endpoints with consistent style across the codebase.
 * - ensure to use proper and meaningful variable names for functions and any piece of code.
 * - ensure to decouple controller logic or code from service code with clear boundries
 * - ensure to have only module domain related functionality.
 *  for example in admin module you should have only admin related domain logic
 * -  
 */

router.post('/signup', (adminController.handleSignUp))
router.post('/phonenumber', (adminController.loginWithPhone))
router.post('/verify-otp', (adminController.verifyOtp))
router.put('/profile',multerUploadFile().single('image'), adminAuth,(adminController.updateProfile))
router.get('/profile-info',adminAuth,(adminController.getadminaccount))

router.post('/add-engineer',adminAuth,(adminController.createEngineer))
router.get('/confirm/:token', (adminController.confirmEmail))
router.get('/get-all-eng',adminAuth,(adminController.listEngineers))
router.get('/get-eng-by-id',adminAuth,(adminController.getEngineer))

router.put('/update-engineer/:engId', adminAuth, multerUploadFile().single('image'), (adminController.updateEngineer))
router.delete('/delete/:engId', adminAuth, (adminController.deleteEngineer))


router.post('/logout/:userid', adminAuth,(adminController.logOut))
// router.get('/getalluser',isAuthAdmin(), asyncHandler(ac.getAllUser))
// router.get('/getuserscount', isAuthAdmin(), asyncHandler(ac.getUserCount)
// router.put(
//   '/updateengverify/:engId',
//   isAuthAdmin(),
//   asyncHandler(ac.updateEngVerify),
// )
// router.delete('/deleteuser/:userId',isAuthAdmin(), asyncHandler(ac.deleteUser))








export default router;