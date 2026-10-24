const express = require('express');
const {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  aiAnalyze,
} = require('../controllers/issueController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createIssueSchema, updateIssueSchema } = require('../schemas/issueSchema');

const router = express.Router();

// Live AI preview endpoint (open to unauthenticated & authenticated users)
router.post('/issues/ai-analyze/', aiAnalyze);

// Issue endpoints
router.get('/issues/', authMiddleware, getIssues);
router.post(
  '/issues/',
  authMiddleware,
  upload.single('photo'),
  validate(createIssueSchema),
  createIssue
);
router.get('/issues/:id/', authMiddleware, getIssueById);
router.patch('/issues/:id/', authMiddleware, validate(updateIssueSchema), updateIssue);

module.exports = router;
