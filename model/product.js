const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  values: {
    type: [String],
    required: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  productCode: {
    type: String,
    required: [true, 'Product Code is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  offerPrice: {
    type: Number
  },
  proCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  proSubCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  proBrandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },

  // ✅ This is now an array of type + values
  proVariants: [variantSchema],

  images: [{
    image: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
