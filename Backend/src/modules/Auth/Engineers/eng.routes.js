import { Router } from 'express'
const router = Router()
import { uploadFile } from '../../../services/multer/multer.local.js'
import * as engineerController from '../../../../src/modules/Auth/Engineers/eng.controller.js'
import { engineerAuth } from '../../../middlewares/auth.js'
import { multerUploadFile } from '../../../services/multer/multer.cloud.js'


router.post('/signup',uploadFile().single('image'),(engineerController.handleSignUp))
router.patch('/confirm-email', (engineerController.confirmEmail))
router.post('/login', (engineerController.logIn)) 
router.post('/logout',engineerAuth,(engineerController.logOut))

router.get('/get-user',engineerAuth,(engineerController.getEngAccount))
router.put('/update-profile/:userid?', engineerAuth, (engineerController.updateProfile))

router.post('/addpost',engineerAuth,multerUploadFile().array('image'),(engineerController.createPost))
router.put('/updatepost',engineerAuth,multerUploadFile().array('image',10),(engineerController.updatePost))
router.delete('/deletepost',engineerAuth,(engineerController.deletePost))
router.get('/get-all-posts',engineerAuth,(engineerController.listAllPosts))

// router.post('/Profile',engineerAuth,multerUploadFile().single('image'),(engineerController.getProfile))
// router.get('/get-eng-by-id/:userid',engineerAuth,(engineerController.getEngineerById))


export default router
