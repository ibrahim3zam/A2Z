import { Router } from 'express'
const router = Router()
import * as userController from '../../../../src/modules/Auth/Users/user.controller.js'
import { validation } from '../../../middlewares/validation.js';
import { confirmEmailSchema } from './user.validation.js';
import { userAuth } from '../../../middlewares/auth.js';



router.post('/', (userController.handleSignUp))
router.patch(
  '/confirm-email',
  validation(confirmEmailSchema),
  userController.confirmEmail
);

router.post('/login', (userController.logIn))
router.post('/resend-code', userController.resendCode);
router.post('/logout',userAuth, (userController.logOut))
router.get('/get-user-account',userAuth, (userController.getUserAccount))
    
export default router