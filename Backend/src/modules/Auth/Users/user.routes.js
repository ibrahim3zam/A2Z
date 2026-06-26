import { Router } from 'express'
const router = Router()
import * as uc from '../../../../src/modules/Auth/Users/user.controller.js'
import { validation } from '../../../middlewares/validation.js';
import { confirmEmailSchema } from './user.validation.js';
import { userAuth } from '../../../middlewares/auth.js';



router.post('/', (uc.SignUp))
router.patch(
  '/confirm-email',
  validation(confirmEmailSchema),
  uc.confirmEmail
);

router.post('/login', (uc.logIn))
router.post('/resend-code', uc.resendCode);
router.post('/logout',userAuth, (uc.logOut))
router.get('/getUserAccount',userAuth, (uc.getUserAccount))
// router.get('/getUser', (uc.getAllUser))
// router.get('/getallproduct', (uc.getAllProduct))
// router.get('/getproductinfo/:productId', isAuthUser(),(uc.getProductInfo))
// router.get('/productfilter',isAuthUser(), (uc.getProductsByTitle))
// router.get('/productbycategory',isAuthUser(), (uc.getProductsBycategory))
// router.post('/createorder/', isAuthUser(), (uc.fromCartoOrder))
// router.get('/getengbyid',isAuthUser(), (uc.getEngBy))
// router.get('/getalleng',isAuthUser(), (uc.getAll))
// router.get('/getallcategory', isAuthUser(),(uc.getAllCategories))


// router.post('/addcart',
//     isAuthUser(),
//     asyncHandler(uc.addToCart))
    
// router.delete('/deletecart',
//     isAuthUser(),
//     asyncHandler(uc.deleteFromCart))
    
// router.get('/getcart',isAuthUser(),asyncHandler(uc.getAllproductFromCart))
// router.delete('/deletecart',isAuthUser(),asyncHandler(uc.deleteCart))
// router.delete('/deleteitemcart/:productId',isAuthUser(),asyncHandler(uc.deleteCartItem))

// router.post('/contactmsg',isAuthUser(),asyncHandler(uc.contactUs))    
export default router