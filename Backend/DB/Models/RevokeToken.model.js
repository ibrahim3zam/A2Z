import { Schema, model, Types } from 'mongoose';

const revokeTokenSchema = new Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    expiredIn: {
      type: Date,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      required: true,
      refPath: 'onModel', 
    },
    onModel: {
      type: String,
      required: true,
      enum: ['User', 'Admin', 'Engineer'],
    },
  },
  {
    timestamps: true,
  }
);

revokeTokenSchema.index(
  { expiredIn: 1 },
  { expireAfterSeconds: 0 }
);

export const RevokeToken = model('RevokeToken', revokeTokenSchema);