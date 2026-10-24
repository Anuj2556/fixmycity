const User = require('../models/User');
const Department = require('../models/Department');
const Issue = require('../models/Issue');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');

const register = async (req, res) => {
  try {
    const { username, password, email, role = 'citizen', phone = '', address = '', department } = req.body;

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    let deptId = null;
    if (department) {
      const deptDoc = await Department.findOne({
        $or: [{ _id: department.match(/^[0-9a-fA-F]{24}$/) ? department : null }, { code: department }],
      });
      if (deptDoc) {
        deptId = deptDoc._id;
      }
    }

    const user = new User({
      username: username.toLowerCase(),
      password,
      email: email || '',
      role: ['citizen', 'admin', 'department_admin'].includes(role) ? role : 'citizen',
      phone: phone || '',
      address: address || '',
      department: deptId,
      is_staff: role === 'admin',
    });

    await user.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const lowerUsername = username.trim().toLowerCase();

    const user = await User.findOne({ username: lowerUsername }).populate('department');

    if (!user) {
      return res.status(401).json({ detail: 'No active account found with the given credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'No active account found with the given credentials' });
    }

    const tokens = generateTokens(user);
    const deptName = user.department ? user.department.name : null;
    const deptId = user.department ? user.department._id.toString() : null;

    return res.status(200).json({
      access: tokens.access,
      refresh: tokens.refresh,
      role: user.role,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        is_staff: user.is_staff || user.role === 'admin',
        department_id: deptId,
        department_name: deptName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refresh } = req.body;
    if (!refresh) {
      return res.status(400).json({ detail: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refresh);
    if (!decoded) {
      return res.status(401).json({ detail: 'Token is invalid or expired', code: 'token_not_valid' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    const tokens = generateTokens(user);
    return res.status(200).json({ access: tokens.access });
  } catch (error) {
    return res.status(500).json({ error: 'Token refresh failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department');

    const totalReported = await Issue.countDocuments({ submitted_by: user._id });
    const resolvedCount = await Issue.countDocuments({ submitted_by: user._id, status: 'resolved' });
    const pendingCount = await Issue.countDocuments({ submitted_by: user._id, status: 'pending' });

    return res.status(200).json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      profile: {
        id: user._id.toString(),
        role: user.role,
        phone: user.phone,
        address: user.address,
        department: user.department ? user.department._id.toString() : null,
        department_name: user.department ? user.department.name : null,
        department_code: user.department ? user.department.code : null,
        created_at: user.created_at,
      },
      stats: {
        total_reported: totalReported,
        resolved: resolvedCount,
        pending: pendingCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { email, phone, address } = req.body;

    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();
    return getProfile(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
};
