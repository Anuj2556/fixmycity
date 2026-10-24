const User = require('../models/User');
const Department = require('../models/Department');
const Issue = require('../models/Issue');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');

const register = async (req, res) => {
  try {
    const { username, password, email, role = 'citizen', phone = '', address = '', department } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ detail: 'Username is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters long.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({ detail: `Username "${username}" is already registered. Please sign in or use a different username.` });
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
      username: cleanUsername,
      password,
      email: email ? email.trim() : '',
      role: ['citizen', 'admin', 'department_admin'].includes(role) ? role : 'citizen',
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      department: deptId,
      is_staff: role === 'admin',
    });

    await user.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      detail: 'Our civic database is momentarily unavailable. Please try again in a moment.',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ detail: 'Please enter your username.' });
    }

    if (!password) {
      return res.status(400).json({ detail: 'Please enter your password.' });
    }

    const lowerUsername = username.trim().toLowerCase();

    // Fast lookup without unnecessary population overhead
    const user = await User.findOne({ username: lowerUsername });

    if (!user) {
      return res.status(401).json({
        detail: `No account found for username "${username}". Please check for typos or create an account.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        detail: 'Incorrect password entered. Please check your password and try again.',
      });
    }

    // Lazy load department only if user belongs to one (officer)
    let deptName = null;
    let deptId = null;
    if (user.department) {
      const deptDoc = await Department.findById(user.department);
      if (deptDoc) {
        deptName = deptDoc.name;
        deptId = deptDoc._id.toString();
      }
    }

    const tokens = generateTokens(user);

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
    return res.status(500).json({
      detail: 'Our civic database is momentarily unavailable. Please try again in a moment.',
      error: error.message,
    });
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
