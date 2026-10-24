const express = require('express');
const {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, updateProfileSchema } = require('../schemas/authSchema');

const router = express.Router();

router.post('/register/', validate(registerSchema), register);
router.post('/login/', validate(loginSchema), login);
router.post('/token/refresh/', refreshToken);
router.get('/profile/', authMiddleware, getProfile);
router.patch('/profile/', authMiddleware, validate(updateProfileSchema), updateProfile);

module.exports = router;
