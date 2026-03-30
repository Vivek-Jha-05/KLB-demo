const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadPrescription, getMyPrescriptions, getAllPrescriptions, reviewPrescription } = require('../controllers/prescriptionController');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only .jpeg, .jpg, .png, .pdf files are allowed'));
  }
});

router.post('/upload', protect, upload.single('prescription'), uploadPrescription);
router.get('/mine', protect, getMyPrescriptions);
router.get('/admin', protect, adminOnly, getAllPrescriptions);
router.put('/admin/:id', protect, adminOnly, reviewPrescription);

module.exports = router;
