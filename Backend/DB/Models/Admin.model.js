import { Schema, model } from 'mongoose'





const AdminSchema = new Schema(
    {
        userName: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,

        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        isConfirmed: {
            type: Boolean,
            default: false,
        },
        OTP: {
            type: String,
            
        },
        
        isVerify: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },


        phoneNumber: {
            type: String,
            required: true,
            unique: true,
        },

        profilePic: {
            secure_url: String,
            public_id: String,
        },
        role: {
            type: String,
            enum: ['admin', 'engineer', 'user'],
            default: 'admin',
        },

        status: {
            type: String,
            default: 'Offline',
            enum: ['Online', 'Offline'],
        },
        gender: {
            type: String,
            default: 'Not specified',
            enum: ['male', 'female', 'Not specified'],
        },
         credentialsChangedAt: {
        type: Date,
        default: Date.now,

    },
       
        logoutAt:Date,

        age: Number,
        token: String,

        customId: String,
        refreshToken: String,
    },
    { timestamps: true ,
          toJSON: { virtuals: true },

    methods: {
      comparePassword(pass) {
        return compare(pass, this.password);
      },
    },
    },
)

export const AdminModel = model('Admin', AdminSchema)




