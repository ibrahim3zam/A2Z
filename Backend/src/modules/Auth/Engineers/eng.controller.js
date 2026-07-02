import { successRes } from "../../../utils/success.res.js";
import * as engineerService from './eng.service.js'; 



//=============================== Engineer Sign Up ==============================
export const handleSignUp = async (req, res, next) => {
   try {
    
   const saveEngineer = await engineerService.registerEngineerService(req.body,req.file); 
return successRes({
  res,
  status: 201,
  message: 'Account created. Check email for OTP.',
  data: {saveEngineer},
})
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
  
}

//=============================== Engineer Confirm Email ==============================
    
export const confirmEmail = async (req, res, next) => {
 
 try{   
    
 const engineer = await engineerService.confirmEmailService(req.body);

  return successRes({
    res,
    status: 200,
    message: 'Email confirmed successfully',
    data: { engineer },
  });
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
}
//=============================== Engineer Login ==============================

export const logIn = async (req, res, next) => {
  
  try {

    const engineer = await engineerService.logInService(req.body,req,next);
    successRes({
      res,
      data: engineer,
    });
  } catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
};
//=============================== Engineer Log Out =============================

export const logOut = async (req, res, next) => {
    try {
    const userid = req.user._id;
    const engineer = await engineerService.logOutService(userid);
    return successRes({
      res,
      status: 200,
        message: 'log out done',
        data: { engineer },
    });
    }
    catch (error) {
        return next(new Error(error.message, { cause: 400 }));
      }
}
//=============================== Engineer Get Account ==============================

export const getEngAccount = async (req, res, next) => {
    try {
        const userId = req.user._id; 
        
        const engineer = await engineerService.getEngAccountService(userId, next);

        if (!engineer) return; 

        return successRes({
            res,
            status: 200,
            message: 'Account found',
            data: { engineer }
        });
    } catch (error) {
        return next(new Error(error.message, { cause: 400 }));
    }
};

//=============================== Engineer Update Profile ==============================

export const updateProfile = async (req, res, next) => {
    try {
        const targetId = req.params.userid || req.user._id
        const engineerUpdatingData = {
            ...req.body,
            userRole: req.user.role,
            updaterId: req.user._id   
        };
   const engineer = await engineerService.updateProfileService(engineerUpdatingData, targetId);
    return successRes({
      res,
      status: 200,
        message: 'Profile updated successfully',
        data: { engineer },
    });
    }
    catch (error) {
        return next(new Error(error.message, { cause: 400 }));
      }
    
}
//=============================== Engineer Add Post ==============================

export const createPost = async (req, res, next) => {
try{
    
    const engineer = await engineerService.createPostService(req.user, req.files);
    


return successRes({
        res,
        status: 201,
        message: 'Post created successfully',
        data: { engineer },
    });
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }

   
}
//=============================== Engineer Update Post ==============================

export const updatePost = async (req, res, next) => {
   try{
    

    const engineer = await engineerService.updatePostService(req.user, req.files);


   
    return successRes({
      res,
      status: 200,
        message: 'Updated Done',
        data: { engineer },
    });
    }
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
}
//=============================== Engineer Delete Post ==============================

export const deletePost = async (req, res, next) => {
   try{
        const userId = req.user._id; 

    const engineer = await engineerService.deletePostService(userId);

    return successRes({
      res,
      status: 200,
        message: 'Post deleted successfully',
        data: { engineer },
    });
}
catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
}
//=============================== Engineer List All Posts ==============================

export const listAllPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const posts = await engineerService.listAllPostsService(userId, next);


    return successRes({
      res,
      status: 200,
        message: 'Posts retrieved successfully',
        data: { posts },
    });
  }
  catch (error) {
    return next(new Error(error.message, { cause: 400 }));
  }
}


// export const getProfile = async (req, res, next) => {
//     const user = req.user

//     if (!req.file) {
//         return next(new Error('please upload pictures', { cause: 400 }))
//     }

//     const engineer = await EngineerModel.findById(user._id);
//     if (!engineer) {
//         return res.status(404).json({ error: 'engineer not found' });
//     }

//     const oldPublicId = engineer.profilePic?.public_id
//     const { secure_url, public_id } = await uploadSingleFile({
//         path: req.file.path,
//         folder: `Engineer/ProfilePic/${engineer._id}`,
//     })

//     const engNew = await EngineerModel.findByIdAndUpdate(
//         user._id,
//         {
//           profilePic: {
//             secure_url,
//             public_id,
//           },
//         },
//         {
//           new: true,
//         },
//     )

//     if (oldPublicId) {
//         await destroyFile(oldPublicId)
//     }

//     return res.status(200).json({ message: 'Done', engNew });
// }


// export const getEngineerById = async (req, res, next) => {
//     const { userid } = req.params

//     const eng = await EngineerModel.findById(req.user._id);
//     if (!eng) {
//       return res.status(404).json({ error: 'eng not found' });
//     }

//     const user = await UserModel.findById(userid);
//     if (!user) {
//       return res.status(404).json({ error: 'user not found' });
//     }

//     return res.status(200).json({ message: 'Done', user })
// }

