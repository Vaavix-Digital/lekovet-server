const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/products';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware for handling multiple file uploads for colors
const uploadColorImages = (req, res, next) => {
    // Use upload.any() to handle dynamic field names since we don't know colors count beforehand
    const uploadMiddleware = upload.any();

    uploadMiddleware(req, res, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

// Process and save images
const processAndSaveImages = async (files, colorIndexes) => {
    console.log('processAndSaveImages called with:', { filesCount: files.length, colorIndexes });
    const processedImages = [];

    for (const index of colorIndexes) {
        console.log(`Processing color index: ${index}`);
        // If we're processing a single file array, use the file directly
        const file = colorIndexes.length === 1 && files.length === 1 ?
            files[0] :
            files.find(f => f.fieldname === `colorImage_${index}`);

        console.log('Found file:', file ? { fieldname: file.fieldname, filename: file.filename, path: file.path } : 'null');

        if (file) {
            try {
                // Use the original file path from multer
                const originalPath = file.path;
                const processedFilename = `processed-${file.filename}`;
                const outputPath = path.join('uploads/products/processed', processedFilename);

                console.log('Processing paths:', { originalPath, outputPath });

                // Create processed directory if it doesn't exist
                const processedDir = path.dirname(outputPath);
                if (!fs.existsSync(processedDir)) {
                    console.log('Creating directory:', processedDir);
                    fs.mkdirSync(processedDir, { recursive: true });
                }

                // Process image (resize, optimize, etc.)
                await sharp(originalPath)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85 })
                    .toFile(outputPath);

                console.log('Image processed successfully');

                // Remove original file
                fs.unlinkSync(originalPath);
                console.log('Original file removed');

                const processedImage = {
                    originalName: file.originalname,
                    filename: processedFilename,
                    path: outputPath,
                    url: `/uploads/products/processed/${processedFilename}`,
                    size: fs.statSync(outputPath).size,
                    mimetype: 'image/jpeg'
                };

                console.log('Processed image object:', processedImage);
                processedImages.push(processedImage);
            } catch (error) {
                console.error('Error processing image:', error);
                processedImages.push(null);
            }
        } else {
            console.log('No file found for index:', index);
            processedImages.push(null);
        }
    }

    console.log('Final processed images:', processedImages);
    return processedImages;
};

module.exports = {
    upload,
    uploadColorImages,
    processAndSaveImages
};
