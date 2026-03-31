const express = require('express');
const router = express.Router();
const { uploadPrescription, getMyPrescriptions, getAllPrescriptions, reviewPrescription } = require('../controllers/prescriptionController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('prescription'), uploadPrescription);
router.get('/mine', protect, getMyPrescriptions);
router.get('/admin', protect, adminOnly, getAllPrescriptions);
router.put('/admin/:id', protect, adminOnly, reviewPrescription);

module.exports = router;
