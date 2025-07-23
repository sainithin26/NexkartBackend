const express = require('express');
const router = express.Router();
const Poster = require('../model/poster');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const { uploadToBunny } = require('../config/uploadToBunny');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const uploadPoster = multer({ storage: storage });

// ==============================
// GET all posters
// ==============================
router.get('/', asyncHandler(async (req, res) => {
    const posters = await Poster.find({});
    res.json({ success: true, message: "Posters retrieved successfully.", data: posters });
}));

// ==============================
// GET poster by ID
// ==============================
router.get('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    const poster = await Poster.findById(posterID);
    if (!poster) {
        return res.status(404).json({ success: false, message: "Poster not found." });
    }
    res.json({ success: true, message: "Poster retrieved successfully.", data: poster });
}));

// ==============================
// POST - Create poster
// ==============================
router.post('/', asyncHandler(async (req, res) => {
    uploadPoster.single('img')(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { posterName, productId } = req.body;
        let imageUrl = 'no_url';

        if (req.file) {
            try {
                const fileExt = path.extname(req.file.originalname);
                const fileName = `posters/${uuidv4()}-${Date.now()}${fileExt}`;
                imageUrl = await uploadToBunny(req.file.buffer, fileName);
            } catch (uploadErr) {
                console.error("Bunny upload error:", uploadErr);
                return res.status(500).json({ success: false, message: "Image upload failed" });
            }
        }

        if (!posterName) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        const newPoster = new Poster({ posterName, productId, imageUrl });
        await newPoster.save();
        res.json({ success: true, message: "Poster created successfully.", data: null });
    });
}));

// ==============================
// PUT - Update poster
// ==============================
router.put('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;

    uploadPoster.single('img')(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { posterName, productId } = req.body;
        let image = req.body.image;

        if (req.file) {
            try {
                const fileExt = path.extname(req.file.originalname);
                const fileName = `posters/${uuidv4()}-${Date.now()}${fileExt}`;
                image = await uploadToBunny(req.file.buffer, fileName);
            } catch (uploadErr) {
                console.error("Bunny upload error:", uploadErr);
                return res.status(500).json({ success: false, message: "Image upload failed" });
            }
        }

        if (!posterName || !image) {
            return res.status(400).json({ success: false, message: "Name and image are required." });
        }

        const updatedPoster = await Poster.findByIdAndUpdate(
            posterID,
            { posterName, productId, imageUrl: image },
            { new: true }
        );

        if (!updatedPoster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }

        res.json({ success: true, message: "Poster updated successfully.", data: null });
    });
}));

// ==============================
// DELETE - Remove poster
// ==============================
router.delete('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    const deletedPoster = await Poster.findByIdAndDelete(posterID);
    if (!deletedPoster) {
        return res.status(404).json({ success: false, message: "Poster not found." });
    }
    res.json({ success: true, message: "Poster deleted successfully." });
}));

module.exports = router;