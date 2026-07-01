import { Schema, model } from 'mongoose'
import { imageSchema } from './user.model.js' 
import { compare } from 'bcrypt';

const engineerSchema = new Schema(
    {
        userName: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
        },
        address: [
            {
                type: String,
            },
        ],
        profilePic: imageSchema,
        licencePicture: imageSchema, 
        
        Gallery: [
            {
                secure_url: String,
                public_id: String,
                desc: String,
            }
        ],
        specialization: {
            type: String,
            default: 'General Decoration',
        },
        
        status: {
            type: String,
            default: 'Offline',
            enum: ['Online', 'Offline'],
        },
        emailOtp: {
            otp: String,
            expiredIn: Date,
        },
         
        gender: {
            type: String,
            default: 'Not specified',
            enum: ['male', 'female', 'Not specified'],
        },
        role: {
            type: String,
            enum: ['engineer'],
            default: 'engineer',
        },
        
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
        },
        deletedBy: {
            type: Schema.Types.ObjectId, 
        },
        isConfirmed: {
            type: Boolean,
            default: false,
        },
         isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
         credentialsChangedAt: {
        type: Date,
        default: Date.now,

    },
        age: Number,
        forgetCode: String,
        customId: {
            type: String,
            unique: true,
            sparse: true,
        },

        
        refreshToken: String,
    },
    { timestamps: true
        ,toJSON: { virtuals: true },
        
               methods: {
              comparePassword(pass) {
                return compare(pass, this.password);
              },
            },
     },
)

export const EngineerModel = model('Engineer', engineerSchema)