const Prescription = require('../models/Prescription');
const path = require('path');

const getPagination = (query = {}, fallbackLimit = 20) => {
  const hasLimit = typeof query.limit !== 'undefined';
  if (!hasLimit) {
    return { page: 1, limit: null, skip: 0 };
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(query.limit) || fallbackLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

exports.uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    const fileUrl = `/uploads/prescriptions/${req.file.filename}`;
    const prescription = await Prescription.create({
      userId: req.user._id,
      fileUrl,
      originalName: req.file.originalname
    });
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const pagination = getPagination(req.query, 20);
    const prescriptionsQuery = Prescription.find(filter).sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name');

    if (pagination.limit) {
      prescriptionsQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [prescriptions, total] = await Promise.all([
      prescriptionsQuery,
      Prescription.countDocuments(filter),
    ]);
    res.json({
      prescriptions,
      page: pagination.page,
      totalPages: pagination.limit ? Math.max(1, Math.ceil(total / pagination.limit)) : 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reviewPrescription = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNote: reviewNote || ''
      },
      { new: true }
    ).populate('userId', 'name email').populate('reviewedBy', 'name');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    // If approved, auto-update pending orders linked to this prescription
    if (status === 'approved') {
      const Order = require('../models/Order');
      await Order.updateMany(
        { prescriptionId: prescription._id, orderStatus: 'pending_approval' },
        { orderStatus: 'processing' }
      );
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
