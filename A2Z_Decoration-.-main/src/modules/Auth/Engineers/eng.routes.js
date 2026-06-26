import { Router } from 'express'
const router = Router()
import { uploadFile } from '../../../services/multer/multer.local.js'
import * as ec from '../../../../src/modules/Auth/Engineers/eng.controller.js'
import { engineerAuth } from '../../../middlewares/auth.js'
import { multerUploadFile } from '../../../services/multer/multer.cloud.js'

router.post('/signup',uploadFile().single('image'),(ec.SignUp))
router.patch('/confirm-email', (ec.confirmEmail))
router.post('/login', (ec.logIn)) 
router.post('/logout',engineerAuth,(ec.logOut))
router.post('/addpost',engineerAuth,multerUploadFile().array('image'),(ec.communityPage))
router.put('/updatepost',engineerAuth,multerUploadFile().array('image',10),(ec.updateGallery))
router.delete('/deletepost',engineerAuth,(ec.deleteGallery))

router.post('/Profile',engineerAuth,multerUploadFile().single('image'),(ec.profilePic))
router.get('/getUser',engineerAuth,(ec.getEngAccount))
router.get('/getallposts',engineerAuth,(ec.getAllPosts))
router.put('/updateProfile/:userid?', engineerAuth, (ec.updateProfile))
router.get('/getengbyid/:userid',engineerAuth,(ec.getuserBy))


export default router
