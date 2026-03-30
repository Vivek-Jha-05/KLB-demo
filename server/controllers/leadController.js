const Lead = require('../models/Lead');

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

exports.submitLead = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Please provide name, email, subject, and message',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const lead = await Lead.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json({
      message: 'Thank you for contacting us. We will get back to you soon.',
      id: lead._id,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllLeads = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['new', 'read', 'replied'].includes(status)) {
      filter.status = status;
    }

    const pagination = getPagination(req.query, 20);
    const leadsQuery = Lead.find(filter).sort({ createdAt: -1 });

    if (pagination.limit) {
      leadsQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [leads, total] = await Promise.all([
      leadsQuery,
      Lead.countDocuments(filter),
    ]);

    res.json({
      leads,
      page: pagination.page,
      totalPages: pagination.limit ? Math.max(1, Math.ceil(total / pagination.limit)) : 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Status must be new, read, or replied' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
