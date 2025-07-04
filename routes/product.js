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

// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find()
        .populate('proCategoryId', 'id name')
        .populate('proSubCategoryId', 'id name')
        .populate('proBrandId', 'id name')
        .populate('proVariantTypeId', 'id type')
        .populate('proVariantId', 'id name');
        res.json({ success: true, message: "Products retrieved successfully.", data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const productID = req.params.id;
        const product = await Product.findById(productID)
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id name')
            .populate('proVariantId', 'id name');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product retrieved successfully.", data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));



// create new product
router.post('/', asyncHandler(async (req, res) => {
    uploadProducts.fields([
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 },
        { name: 'image5', maxCount: 1 }
    ])(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            console.error(`Add product: ${err}`);
            return res.json({ success: false, message: err.message });
        }

        const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

        if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }

        const imageUrls = [];

        const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index];
            if (req.files[field] && req.files[field][0]) {
                const file = req.files[field][0];

                try {
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: 'products' },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        streamifier.createReadStream(file.buffer).pipe(uploadStream);
                    });
                    imageUrls.push({ image: index + 1, url: result.secure_url });
                } catch (uploadErr) {
                    console.error("Cloudinary upload error:", uploadErr);
                }
            }
        }

        const newProduct = new Product({
            name, description, quantity, price, offerPrice,
            proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId,
            images: imageUrls
        });

        await newProduct.save();
        res.json({ success: true, message: "Product created successfully.", data: null });
    });
}));


// Update a product
router.put('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;

    uploadProducts.fields([
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 },
        { name: 'image5', maxCount: 1 }
    ])(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            console.error(`Update product: ${err}`);
            return res.status(500).json({ success: false, message: err.message });
        }

        const productToUpdate = await Product.findById(productId);
        if (!productToUpdate) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

        // Update text fields
        productToUpdate.name = name || productToUpdate.name;
        productToUpdate.description = description || productToUpdate.description;
        productToUpdate.quantity = quantity || productToUpdate.quantity;
        productToUpdate.price = price || productToUpdate.price;
        productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
        productToUpdate.proCategoryId = proCategoryId || productToUpdate.proCategoryId;
        productToUpdate.proSubCategoryId = proSubCategoryId || productToUpdate.proSubCategoryId;
        productToUpdate.proBrandId = proBrandId || productToUpdate.proBrandId;
        productToUpdate.proVariantTypeId = proVariantTypeId || productToUpdate.proVariantTypeId;
        productToUpdate.proVariantId = proVariantId || productToUpdate.proVariantId;

        const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index];
            if (req.files[field] && req.files[field][0]) {
                const file = req.files[field][0];
                try {
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: 'products' },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        streamifier.createReadStream(file.buffer).pipe(uploadStream);
                    });

                    let imageEntry = productToUpdate.images.find(img => img.image === (index + 1));
                    if (imageEntry) {
                        imageEntry.url = result.secure_url;
                    } else {
                        productToUpdate.images.push({ image: index + 1, url: result.secure_url });
                    }
                } catch (uploadErr) {
                    console.error("Cloudinary upload error:", uploadErr);
                }
            }
        }

        await productToUpdate.save();
        res.json({ success: true, message: "Product updated successfully." });
    });
}));


// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
