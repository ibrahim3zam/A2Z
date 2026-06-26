import { Schema, model } from 'mongoose'

const productSchema = new Schema(
  {
    // ======= Text section =======
    title: {
      type: String,
      required: true,
      lowercase: true,
    },
    desc: String,
    slug: {
      type: String,
      lowercase: true,
    },

    // ======= Specifications section =======
    colors: [String],
    sizes: [String],

    // ======= Price section =======
    price: {
      type: Number,
      required: true,
      default: 1,
    },
    appliedDiscount: {
      type: Number,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
    },

    // ======= Quantity section =======
    stock: {
      type: Number,
      required: true,
      default: 1,
    },
    name: String,

    // ======= Related Ids section =======
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },



    // ======= Images section =======
    ImageCover: {
      secure_url: String,
      public_id: String,
    },

    Images: [
      {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    customId: String,
  },
  { timestamps: true },
)

export const productModel = model('Product', productSchema)