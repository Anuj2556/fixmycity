const express = require('express');
const {
  getDepartments,
  getDepartmentsOverview,
  getDepartmentStats,
} = require('../controllers/departmentController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/departments/', getDepartments);
router.get('/departments/overview/', authMiddleware, getDepartmentsOverview);
router.get('/departments/:id/stats/', authMiddleware, getDepartmentStats);

module.exports = router;
