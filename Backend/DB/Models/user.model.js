import { compare } from 'bcrypt';
import { Schema, model } from 'mongoose'

export const imageSchema = new Schema(
  {
    secure_url: {
      type: String,
    },
    public_id: {
      type: String,
    },
  },
  { _id: false }
);

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: [true, 'Username is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true
        },
        newEmail: {
      type: String,
      unique: true,
      sparse: true,
    },
        password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'engineer'],
      default: 'user',
    },
    oldPasswords: [
      {
        type: String,
      },
    ],
     isEmailSent: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      otp: String,
      expiredIn: Date,
    },
    passwordResetOtp: {
      otp: String,
      expiredIn: Date,
    },
    newEmailOtp: {
      otp: String,
      expiredIn: Date,
    },
    credentialsChangedAt: {
      type: Date,
        default: Date.now,

    },
       isActive: {
            type: Boolean,
            default: true,
        },
        isConfirmed: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedBy: {
            type: Schema.Types.ObjectId, // هيشيل الـ ID سواء كان اللي مسحه Admin أو الـ User نفسه
        },
    },
    { timestamps: true,
    toJSON: { virtuals: true },

       methods: {
      comparePassword(pass) {
        return compare(pass, this.password);
      },
    },
     },
)

export const UserModel = model('User', userSchema)