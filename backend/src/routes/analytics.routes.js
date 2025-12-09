const express = require('express');
const {
    getDashboard,
    getEmployeePerformance,
    getTeamAnalytics
} = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getDashboard);
router.get('/employee/:id', protect, getEmployeePerformance);
router.get('/team', protect, authorize('admin'), getTeamAnalytics);

module.exports = router;
