const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

const { uploadToBunny } = require('../config/uploadToBunny');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const uploadCategories = multer({ storage: storage });

// ==============================
// GET all categories
// ==============================
router.get('/', asyncHandler(async (req, res) => {
    const categories = await Category.find();
    res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
}));

// ==============================
// GET category by ID
// ==============================
router.get('/:id', asyncHandler(async (req, res) => {
    const categoryID = req.params.id;
    const category = await Category.findById(categoryID);
    if (!category) {
        return res.status(404).json({ success: false, message: "Category not found." });
    }
    res.json({ success: true, message: "Category retrieved successfully.", data: category });
}));

// ==============================
// POST - Create category
// ==============================
router.post('/', asyncHandler(async (req, res) => {
    uploadCategories.single('img')(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        let imageUrl = 'no_url';

        if (req.file) {
            try {
                const fileExt = path.extname(req.file.originalname);
                const fileName = `categories/${uuidv4()}-${Date.now()}${fileExt}`;
                imageUrl = await uploadToBunny(req.file.buffer, fileName);
            } catch (uploadError) {
                console.error("Bunny upload error:", uploadError);
                return res.status(500).json({ success: false, message: "Image upload failed" });
            }
        }

        const newCategory = new Category({ name, image: imageUrl });
        await newCategory.save();
        res.json({ success: true, message: "Category created successfully.", data: null });
    });
}));

// ==============================
// PUT - Update category
// ==============================
router.put('/:id', asyncHandler(async (req, res) => {
    const categoryID = req.params.id;

    uploadCategories.single('img')(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { name } = req.body;
        let image = req.body.image;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        if (req.file) {
            try {
                const fileExt = path.extname(req.file.originalname);
                const fileName = `categories/${uuidv4()}-${Date.now()}${fileExt}`;
                image = await uploadToBunny(req.file.buffer, fileName);
            } catch (uploadError) {
                console.error("Bunny upload error:", uploadError);
                return res.status(500).json({ success: false, message: "Image upload failed" });
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryID,
            { name, image },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }

        res.json({ success: true, message: "Category updated successfully.", data: updatedCategory });
    });
}));

// ==============================
// DELETE - Remove category
// ==============================
router.delete('/:id', asyncHandler(async (req, res) => {
    const categoryID = req.params.id;

    const subcategories = await SubCategory.find({ categoryId: categoryID });
    if (subcategories.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Cannot delete category. Subcategories are referencing it."
        });
    }

    const products = await Product.find({ proCategoryId: categoryID });
    if (products.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Cannot delete category. Products are referencing it."
        });
    }

    const category = await Category.findByIdAndDelete(categoryID);
    if (!category) {
        return res.status(404).json({ success: false, message: "Category not found." });
    }

    res.json({ success: true, message: "Category deleted successfully." });
}));

module.exports = router;