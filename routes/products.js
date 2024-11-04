// routes/profile.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage for simplicity
const upload = multer({ storage: storage });

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.userId = decoded.id; // Add user ID to request for later use
        next();
    });
};

// GET route to fetch user profile
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT route to update user profile
router.put('/', authenticateToken, upload.single('profileImage'), async (req, res) => {
    const { name, email, phone, role, department, year } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update user fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.role = role || user.role;
        user.department = department || user.department;
        if (role === 'Student') {
            user.year = year || user.year;
        }

        // Handle profile image upload
        if (req.file) {
            // Here you should implement your image upload logic (e.g., upload to cloud storage)
            // For example, using AWS S3, Cloudinary, etc.
            // Assuming uploadImage returns the URL of the uploaded image
            const uploadedImageUrl = await uploadImage(req.file); // Define this function
            user.profileImage = uploadedImageUrl;
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
