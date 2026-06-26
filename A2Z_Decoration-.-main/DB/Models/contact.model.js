
import { Schema, model } from 'mongoose'

const contactSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
        },

        subject: {
            type: String,
            required: true,
        },

        message:{
            type:String,
            required:true,
        },

        sendBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true },
)

export const contactModel = model('Contact', contactSchema)