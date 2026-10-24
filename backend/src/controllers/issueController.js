const fs = require('fs');
const path = require('path');
const Issue = require('../models/Issue');
const Department = require('../models/Department');
const {
  DEPARTMENT_DEFAULTS,
  isGibberishOrMeaningless,
  callAiService,
} = require('../services/aiService');
const { AHMEDABAD_BOUNDS } = require('../schemas/issueSchema');

const formatIssueResponse = (issue, req) => {
  const json = issue.toJSON ? issue.toJSON() : issue;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  let photoUrl = json.photo;
  if (photoUrl && photoUrl.startsWith('/media/')) {
    photoUrl = `${baseUrl}${photoUrl}`;
  }

  return {
    ...json,
    id: json._id ? json._id.toString() : json.id,
    photo: photoUrl,
    department: json.department?._id ? json.department._id.toString() : json.department,
    department_name: json.department?.name || '',
    department_code: json.department?.code || '',
    submitted_by: json.submitted_by?._id ? json.submitted_by._id.toString() : json.submitted_by,
    submitted_by_username: json.submitted_by?.username || 'anonymous',
  };
};

const getOrCreateDepartmentForCategory = async (categoryKey) => {
  const deptInfo = DEPARTMENT_DEFAULTS[categoryKey] || DEPARTMENT_DEFAULTS.other;
  let dept = await Department.findOne({ code: deptInfo.code });
  if (!dept) {
    dept = new Department({
      code: deptInfo.code,
      name: deptInfo.name,
      email: deptInfo.email,
      phone: deptInfo.phone,
      description: deptInfo.description,
      icon: deptInfo.icon,
      head_officer: deptInfo.head_officer,
    });
    await dept.save();
  }
  return dept;
};

const getIssues = async (req, res) => {
  try {
    const user = req.user;
    const isSuperuser = user.is_staff || user.role === 'admin';
    const isDeptAdmin = user.role === 'department_admin' && !isSuperuser;

    const query = {
      latitude: { $gte: AHMEDABAD_BOUNDS.minLat, $lte: AHMEDABAD_BOUNDS.maxLat },
      longitude: { $gte: AHMEDABAD_BOUNDS.minLng, $lte: AHMEDABAD_BOUNDS.maxLng },
    };

    // Role-based scoping
    if (!isSuperuser && !isDeptAdmin) {
      query.submitted_by = user._id;
    } else if (isDeptAdmin) {
      if (!user.department) {
        return res.status(200).json([]);
      }
      query.department = user.department._id || user.department;
      if (req.query.my_issues === 'true') {
        query.submitted_by = user._id;
      }
    } else if (isSuperuser) {
      if (req.query.my_issues === 'true') {
        query.submitted_by = user._id;
      }
      if (req.query.department) {
        query.department = req.query.department;
      }
    }

    // Optional department code filter
    if (req.query.department_code) {
      const targetDept = await Department.findOne({ code: req.query.department_code });
      if (targetDept) {
        query.department = targetDept._id;
      }
    }

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    // Priority filter
    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    // Search query across title and description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const issues = await Issue.find(query)
      .populate('department')
      .populate('submitted_by', 'username email')
      .sort({ created_at: -1 });

    const formatted = issues.map((i) => formatIssueResponse(i, req));
    return res.status(200).json(formatted);
  } catch (error) {
    console.error('getIssues error:', error);
    return res.status(500).json({ error: 'Failed to retrieve civic issues' });
  }
};

const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('department')
      .populate('submitted_by', 'username email');

    if (!issue) {
      return res.status(404).json({ detail: 'Issue not found' });
    }

    const user = req.user;
    const isSuperuser = user.is_staff || user.role === 'admin';
    const isDeptAdmin = user.role === 'department_admin' && !isSuperuser;

    // Permissions check
    if (!isSuperuser && !isDeptAdmin) {
      if (issue.submitted_by._id.toString() !== user._id.toString()) {
        return res.status(403).json({ detail: 'You do not have permission to view this issue.' });
      }
    } else if (isDeptAdmin) {
      const officerDeptId = (user.department?._id || user.department)?.toString();
      if (!issue.department || issue.department._id.toString() !== officerDeptId) {
        return res.status(403).json({ detail: 'This issue belongs to another municipal department.' });
      }
    }

    return res.status(200).json(formatIssueResponse(issue, req));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve issue' });
  }
};

const createIssue = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'department_admin' && !user.is_staff) {
      return res.status(403).json({
        detail: 'Department officers are restricted to handling department queues and cannot submit citizen complaints.',
      });
    }

    const {
      title,
      description,
      category: rawCat,
      priority: rawPri,
      latitude,
      longitude,
      manual_category,
      manual_priority,
      department: explicitDeptId,
    } = req.body;

    if (isGibberishOrMeaningless(title)) {
      return res.status(400).json({ title: 'Please enter a valid, descriptive title for the civic issue.' });
    }
    if (isGibberishOrMeaningless(description)) {
      return res.status(400).json({ description: 'Please enter a meaningful description of the municipal problem.' });
    }

    // Photo file handling
    let photoPath = null;
    let imageBase64 = null;

    if (req.file) {
      photoPath = `/media/issues/${req.file.filename}`;
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        imageBase64 = fileBuffer.toString('base64');
      } catch (err) {
        console.warn('Could not read uploaded photo for AI analysis:', err);
      }
    } else if (req.body.image) {
      imageBase64 = req.body.image;
    }

    // Call Python AI microservice (or fallback)
    const aiResult = await callAiService({
      description,
      title,
      imageBase64,
      fallbackCat: rawCat,
    });

    // Enforce topic mismatch rejection
    if (aiResult.is_mismatch) {
      return res.status(400).json({
        non_field_errors: [
          aiResult.ai_reasoning ||
            'Topic Mismatch: Title, description, and photo describe conflicting municipal issues. Please ensure all details refer to the same problem.',
        ],
      });
    }

    // Determine final category
    const isManualCat = manual_category === true || manual_category === 'true' || manual_category === '1';
    let finalCategory = 'other';
    if (isManualCat && rawCat && !['auto', 'none', ''].includes(rawCat)) {
      finalCategory = rawCat;
    } else if (aiResult.category && !['none', 'null', ''].includes(aiResult.category)) {
      finalCategory = aiResult.category;
    } else if (rawCat && !['auto', 'none', ''].includes(rawCat)) {
      finalCategory = rawCat;
    }

    // Determine final priority
    const isManualPri = manual_priority === true || manual_priority === 'true' || manual_priority === '1';
    let finalPriority = 'medium';
    if (isManualPri && rawPri && !['auto', 'none', ''].includes(rawPri)) {
      finalPriority = rawPri;
    } else if (aiResult.priority && !['none', 'null', ''].includes(aiResult.priority)) {
      finalPriority = aiResult.priority;
    } else if (rawPri && !['auto', 'none', ''].includes(rawPri)) {
      finalPriority = rawPri;
    }

    // Department resolution
    let department = null;
    if (explicitDeptId) {
      department = await Department.findById(explicitDeptId);
    }
    if (!department) {
      department = await getOrCreateDepartmentForCategory(finalCategory);
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    const issue = new Issue({
      title,
      description,
      category: finalCategory,
      priority: finalPriority,
      status: 'pending',
      photo: photoPath,
      latitude: latNum,
      longitude: lngNum,
      location: {
        type: 'Point',
        coordinates: [lngNum, latNum],
      },
      department: department._id,
      submitted_by: user._id,
      ai_confidence: aiResult.confidence || 0.9,
      ai_reasoning: aiResult.ai_reasoning || '',
      department_notes: '',
    });

    await issue.save();
    await issue.populate('department');
    await issue.populate('submitted_by', 'username email');

    return res.status(201).json(formatIssueResponse(issue, req));
  } catch (error) {
    console.error('createIssue error:', error);
    return res.status(500).json({ error: 'Failed to create civic issue' });
  }
};

const updateIssue = async (req, res) => {
  try {
    const user = req.user;
    const isSuperuser = user.is_staff || user.role === 'admin';
    const isDeptAdmin = user.role === 'department_admin' && !isSuperuser;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ detail: 'Issue not found' });
    }

    if (isDeptAdmin) {
      const officerDeptId = (user.department?._id || user.department)?.toString();
      if (!issue.department || issue.department.toString() !== officerDeptId) {
        return res.status(403).json({ detail: 'You can only modify issues assigned to your department queue.' });
      }
    }

    if (!isSuperuser && !isDeptAdmin) {
      if (req.body.status || req.body.department_notes || req.body.department) {
        return res.status(403).json({ detail: 'Citizens cannot alter resolution status or department notes.' });
      }
      if (issue.submitted_by.toString() !== user._id.toString()) {
        return res.status(403).json({ detail: 'Permission denied.' });
      }
    }

    const allowedFields = ['status', 'priority', 'department', 'department_notes', 'title', 'description'];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        issue[key] = req.body[key];
      }
    }

    await issue.save();
    await issue.populate('department');
    await issue.populate('submitted_by', 'username email');

    return res.status(200).json(formatIssueResponse(issue, req));
  } catch (error) {
    console.error('updateIssue error:', error);
    return res.status(500).json({ error: 'Failed to update issue' });
  }
};

const aiAnalyze = async (req, res) => {
  try {
    const { title = '', description = '', image = null, category = null } = req.body;
    const result = await callAiService({
      description,
      title,
      imageBase64: image,
      fallbackCat: category,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error('aiAnalyze error:', error);
    return res.status(500).json({ error: 'AI analysis failed' });
  }
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  aiAnalyze,
};
