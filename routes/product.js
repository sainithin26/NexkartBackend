const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();
const uploadProducts = multer({ storage: storage });

// ==============================
// GET all products
// ==============================
router.get('/', asyncHandler(async (req, res) => {
    const { page, limit, categoryId } = req.query;

let filter = {};
if (categoryId) {
  filter.proCategoryId = categoryId;
}

const query = Product.find(filter)
  .populate('proCategoryId', '_id name')
  .populate('proSubCategoryId', '_id name')
  .populate('proBrandId', '_id name');

    if (page && limit) {
        const pageNum = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;

        const total = await Product.countDocuments();
        const products = await query
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize);

        return res.json({
            success: true,
            message: "Products retrieved successfully.",
            data: products,
            pagination: {
                totalItems: total,
                currentPage: pageNum,
                totalPages: Math.ceil(total / pageSize),
                pageSize
            }
        });
    } else {
        // No pagination, return all products
        const products = await query;
        return res.json({
            success: true,
            message: "Products retrieved successfully.",
            data: products
        });
    }
}));

// ==============================
// GET single product by ID
// ==============================
router.get('/:id', asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('proCategoryId', '_id name')
        .populate('proSubCategoryId', '_id name')
        .populate('proBrandId', '_id name');
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product retrieved successfully.", data: product });
}));

// ==============================
// POST - Create new product
// ==============================
router.post('/', asyncHandler(async (req, res) => {
    uploadProducts.fields([
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 },
        { name: 'image5', maxCount: 1 },
    ])(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const {
            name,
            productCode,
            description,
            quantity,
            price,
            offerPrice,
            proCategoryId,
            proSubCategoryId,
            proBrandId,
            proVariants
        } = req.body;

        if (!name || !productCode || !quantity || !price || !proCategoryId || !proSubCategoryId || !proVariants) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        let parsedVariants;
        try {
            parsedVariants = JSON.parse(proVariants); // expected: [{ type: "Color", values: [...] }, ...]
        } catch (parseErr) {
            return res.status(400).json({ success: false, message: "Invalid JSON for proVariants." });
        }

        const imageUrls = [];
        const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (req.files[field] && req.files[field][0]) {
                const file = req.files[field][0];
                try {
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: 'products' },
                            (error, result) => error ? reject(error) : resolve(result)
                        );
                        streamifier.createReadStream(file.buffer).pipe(uploadStream);
                    });
                    imageUrls.push({ image: i + 1, url: result.secure_url });
                } catch (uploadErr) {
                    console.error("Cloudinary upload error:", uploadErr);
                }
            }
        }

        const newProduct = new Product({
            name,
            productCode,
            description,
            quantity,
            price,
            offerPrice,
            proCategoryId,
            proSubCategoryId,
            proBrandId,
            proVariants: parsedVariants,
            images: imageUrls
        });

        await newProduct.save();
        res.json({ success: true, message: "Product created successfully.", data: newProduct });
    });
}));

// ==============================
// PUT - Update product
// ==============================
router.put('/:id', asyncHandler(async (req, res) => {
    uploadProducts.fields([
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 },
        { name: 'image5', maxCount: 1 },
    ])(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const {
            name,
            productCode,
            description,
            quantity,
            price,
            offerPrice,
            proCategoryId,
            proSubCategoryId,
            proBrandId,
            proVariants
        } = req.body;

        let parsedVariants;
        try {
            parsedVariants = JSON.parse(proVariants);
        } catch (parseErr) {
            return res.status(400).json({ success: false, message: "Invalid JSON for proVariants." });
        }

        const imageUrls = [];
        const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (req.files[field] && req.files[field][0]) {
                const file = req.files[field][0];
                try {
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: 'products' },
                            (error, result) => error ? reject(error) : resolve(result)
                        );
                        streamifier.createReadStream(file.buffer).pipe(uploadStream);
                    });
                    imageUrls.push({ image: i + 1, url: result.secure_url });
                } catch (uploadErr) {
                    console.error("Cloudinary upload error:", uploadErr);
                }
            }
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        product.name = name;
        product.productCode = productCode;
        product.description = description;
        product.quantity = quantity;
        product.price = price;
        product.offerPrice = offerPrice;
        product.proCategoryId = proCategoryId;
        product.proSubCategoryId = proSubCategoryId;
        product.proBrandId = proBrandId;
        product.proVariants = parsedVariants;

        if (imageUrls.length > 0) {
            product.images = imageUrls;
        }

        await product.save();
        res.json({ success: true, message: "Product updated successfully.", data: product });
    });
}));

// ==============================
// DELETE - Remove product
// ==============================
router.delete('/:id', asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product deleted successfully." });
}));

module.exports = router;
