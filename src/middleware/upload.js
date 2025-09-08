const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configure multer for file upload (memory storage to avoid duplicate originals on disk)
const storage = multer.memoryStorage();

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

    // If no explicit colorIndexes provided, attempt to derive from file fieldnames
    const indexesToProcess = (Array.isArray(colorIndexes) && colorIndexes.length > 0)
        ? colorIndexes
        : files
            .map(f => {
                const field = (f.fieldname || '');
                const matchA = field.match(/colorImage_(\d+)/);
                const matchB = field.match(/colors\[(\d+)\]\[image\]/);
                const match = matchA || matchB;
                return match ? parseInt(match[1], 10) : null;
            })
            .filter(v => v !== null);

    for (const index of indexesToProcess) {
        console.log(`Processing color index: ${index}`);
        // If we're processing a single file array, use the file directly
        const file = indexesToProcess.length === 1 && files.length === 1 ?
            files[0] :
            files.find(f => f.fieldname === `colorImage_${index}` || f.fieldname === `colors[${index}][image]`);

        console.log('Found file:', file ? { fieldname: file.fieldname, filename: file.filename, path: file.path } : 'null');

        if (file) {
            try {
                // Build a deterministic processed filename
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const sourceName = (file.originalname && file.originalname.trim().length > 0)
                    ? path.parse(file.originalname).name
                    : (file.filename ? path.parse(file.filename).name : `product-${uniqueSuffix}`);
                const safeBase = sourceName.replace(/[^a-zA-Z0-9-_]+/g, '_');
                const processedFilename = `processed-${safeBase}-${uniqueSuffix}.jpg`;
                // Use absolute path aligned with express static '/uploads'
                const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
                const outputPath = path.join(uploadsRoot, 'products', 'processed', processedFilename);

                console.log('Processing output path and buffer:', { outputPath, hasBuffer: !!file.buffer });

                // Create processed directory if it doesn't exist
                const processedDir = path.dirname(outputPath);
                if (!fs.existsSync(processedDir)) {
                    console.log('Creating directory:', processedDir);
                    fs.mkdirSync(processedDir, { recursive: true });
                }

                // Process image (resize, optimize, etc.) using buffer when available
                const sharpInput = file.buffer ? file.buffer : (file.path || null);
                if (!sharpInput) {
                    throw new Error('No file buffer or path available for image processing');
                }
                await sharp(sharpInput)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85 })
                    .toFile(outputPath);

                console.log('Image processed successfully');

                // If original was saved to disk (diskStorage), remove it; with memoryStorage there is no path
                if (file.path) {
                    const unlinkWithRetry = async (targetPath, retries = 5, delayMs = 150) => {
                        for (let attempt = 1; attempt <= retries; attempt++) {
                            try {
                                fs.unlinkSync(targetPath);
                                return true;
                            } catch (e) {
                                if (e && e.code === 'EBUSY' && attempt < retries) {
                                    await new Promise(r => setTimeout(r, delayMs));
                                    continue;
                                }
                                console.warn(`Failed to remove original file (attempt ${attempt}/${retries}):`, e.message);
                                if (attempt >= retries) return false;
                            }
                        }
                        return false;
                    };
                    await unlinkWithRetry(file.path);
                }

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
