import { Schema, model } from 'mongoose'


const CartSchema = new Schema(
{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cartItems: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        }
      },
    ],
    subTotal: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const CartModel = model('Cart', CartSchema)