const express = require('express');
const router = express.Router();
const { submitLead, getAllLeads, updateLeadStatus } = require('../controllers/leadController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', submitLead);
router.get('/admin', protect, adminOnly, getAllLeads);
router.put('/admin/:id', protect, adminOnly, updateLeadStatus);

module.exports = router;
