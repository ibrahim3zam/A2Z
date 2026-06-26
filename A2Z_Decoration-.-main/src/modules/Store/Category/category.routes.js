// import { Router } from 'express'
// import { allowedExtensions } from '../../../utils/allowedExtensions.js'
// import { asyncHandler } from '../../../utils/errorhandling.js'
// import * as cc from './category.controller.js'
// // import { validationCoreFunction } from '../../../middlewares/validation.js'
// // import * as validators from './category.validationSchemas.js'

// const router = Router()


// router.post(
//   '/',
//   multerCloudFunction(allowedExtensions.Image).single('image'),
// //   validationCoreFunction(validators.createCategorySchema),
//   asyncHandler(cc.createCategory),
// )
// router.put(
//     '/:categoryId',
//     multerCloudFunction(allowedExtensions.Image).single('image'),
//     // validationCoreFunction(validators.updateCategorySchema),
//     asyncHandler(cc.updateCategory),
//   )
  
//   router.get('/', asyncHandler(cc.getAllCategories))
  
//   router.delete('/', asyncHandler(cc.deleteCategory)) // TODO: api validation
// export default router
