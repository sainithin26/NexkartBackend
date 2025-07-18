const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled','return accepted','return requested','return cancelled'],
    default: 'pending'
  },
  items: [
    {
      productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: {
        type: String,
        required: true
      },
      productCode: {
        type: String, // ✅ Add this line
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      variant: {
        type: String,
      },
    }
  ],
  totalPrice: {
    type: Number,
    required: true
  },
  shippingAddress: {
    flat: String,
    building: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },

  paymentMethod: {
    type: String,
    enum: ['cod', 'prepaid']
  },

  couponCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
},
  orderTotal: {
    subtotal: Number,
    discount: Number,
    total: Number
  },
  trackingUrl: {
    type: String
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
