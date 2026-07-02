
// import { allowedExtensions } from '../../../utils/allowedExtensions.js';
import { adminAuth } from '../../../middlewares/auth.js';
import { multerUploadFile } from '../../../services/multer/multer.cloud.js';
import * as adminController from './admin.controller.js'
import { Router } from "express";
const router = Router()


router.post('/register', (adminController.handleSignUp))
router.post('/phonenumber', (adminController.loginWithPhone))
router.post('/verify-otp', (adminController.verifyOtp))
router.put('/profile',multerUploadFile().single('image'), adminAuth,(adminController.updateProfile))
router.get('/profile',adminAuth,(adminController.getAdminAccount))

router.post('/engineers',adminAuth,(adminController.createEngineer))
router.get('/confirm/:token', (adminController.confirmEmail))
router.get('/engineers',adminAuth,(adminController.listEngineers))
router.get('/engineers/:engId',adminAuth,(adminController.getEngineer))

router.put('/engineers/:engId', adminAuth, multerUploadFile().single('image'), (adminController.updateEngineer))
router.delete('/engineers/:engId', adminAuth, (adminController.deleteEngineer))


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