import jwt from 'jsonwebtoken';
import { UserModel } from '../../DB/Models/user.model.js';
import { RevokeToken } from '../../DB/Models/RevokeToken.model.js';
import { UnauthorizedError, AppError } from '../utils/appError.js'; 
import { EngineerModel } from '../../DB/Models/Engineer.model.js';
import { AdminModel } from '../../DB/Models/Admin.model.js';

export const types = Object.freeze({
  access: 'access',
  refresh: 'refresh',
});

export const verifyToken = (authorization, tokenType = types.access) => {
  if (!authorization) {
    throw new UnauthorizedError('No token provided');
  }

  const parts = authorization.trim().split(' ');
  if (parts.length !== 2) {
    throw new UnauthorizedError('Invalid token format');
  }

  const [bearer, token] = parts;

  if (bearer !== 'Bearer' || !token) {
    throw new UnauthorizedError('Invalid token format');
  }

  const signature =
    tokenType === types.access
      ? process.env.ACCESS_TOKEN_SECRET
      : process.env.REFRESH_TOKEN_SECRET;

  const payload = jwt.verify(token, signature);

  if (!payload?.id || !payload?.role) {
    throw new UnauthorizedError('Invalid token payload');
  }

  if (payload.type !== tokenType) {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload;
};

export const auth = ({ activation = true, allowedRoles = [] } = {}) => {
  return async (req, res, next) => {
    try {
      const { authorization } = req.headers;

      const payload = verifyToken(authorization);

      if (payload.jti) {
        const revokedToken = await RevokeToken.findOne({ jti: payload.jti });
        if (revokedToken) {
          return next(new UnauthorizedError('Token has been revoked. Please login again.'));
        }
      }

      let user = null;
      if (payload.role === 'admin') {
        user = await AdminModel.findById(payload.id);
      } else if (payload.role === 'engineer') {
        user = await EngineerModel.findById(payload.id);
      } else if (payload.role === 'user') {
        user = await UserModel.findById(payload.id);
      }

      if (!user) {
        return next(new UnauthorizedError('User not found or account removed'));
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
        return next(new AppError("Forbidden: You don't have permission to access this resource", 403));
      }

      const isEmailVerified = user.isConfirmed || user.isVerify;
      if (!isEmailVerified) {
        return next(new UnauthorizedError('Please confirm your email first'));
      }

      if (
        user.credentialsChangedAt &&
        user.credentialsChangedAt.getTime() > payload.iat * 1000
      ) {
        return next(new UnauthorizedError('Credentials changed. Please login again'));
      }

      if (activation && user.isDeleted) {
        return next(new AppError('Your account has been deactivated/deleted.', 403));
      }

      req.user = user;
      req.userRole = payload.role;
      req.tokenJti = payload.jti;
      
      next();
    } catch (error) {
      return next(new UnauthorizedError(error.message || 'Invalid or expired token'));
    }
  };
};

export const adminAuth = auth({ allowedRoles: ['admin'] });
export const engineerAuth = auth({ allowedRoles: ['engineer', 'admin'] }); // المهندس والأدمن يقدروا يدخلوا
export const userAuth = auth({ allowedRoles: ['user', 'admin'] });
export const globalAuth = auth(); // أي حد معاه توكن سليم هيدخل