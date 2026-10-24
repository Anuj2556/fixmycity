const Department = require('../models/Department');
const Issue = require('../models/Issue');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return res.status(200).json(departments);
  } catch (error) {
    console.error('[Departments Error]', error.message);
    return res.status(500).json({ error: 'Failed to fetch departments', detail: error.message });
  }
};

const getDepartmentsOverview = async (req, res) => {
  try {
    const user = req.user;
    const isSuperuser = user.is_staff || user.role === 'admin';
    const isDeptAdmin = user.role === 'department_admin' && !isSuperuser;

    if (!isSuperuser && !isDeptAdmin) {
      return res.status(403).json({
        detail: 'Access restricted to Municipal Officers and Administrators.',
      });
    }

    let filter = {};
    if (isDeptAdmin && user.department) {
      filter._id = user.department._id || user.department;
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    const results = await Promise.all(
      departments.map(async (dept) => {
        const issues = await Issue.find({ department: dept._id });
        const total = issues.length;
        const pending = issues.filter((i) => i.status === 'pending').length;
        const in_progress = issues.filter((i) => i.status === 'in_progress').length;
        const resolved = issues.filter((i) => i.status === 'resolved').length;
        const critical = issues.filter((i) => i.priority === 'critical').length;
        const high = issues.filter((i) => i.priority === 'high').length;

        const deptJson = dept.toJSON();
        deptJson.metrics = {
          total,
          pending,
          in_progress,
          resolved,
          critical,
          high,
        };
        return deptJson;
      })
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error('Department overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch department metrics' });
  }
};

const getDepartmentStats = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const isSuperuser = user.is_staff || user.role === 'admin';
    const isDeptAdmin = user.role === 'department_admin' && !isSuperuser;

    if (!isSuperuser && !isDeptAdmin) {
      return res.status(403).json({ detail: 'Access restricted.' });
    }

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ detail: 'Department not found.' });
    }

    if (isDeptAdmin) {
      const userDeptId = (user.department?._id || user.department)?.toString();
      if (userDeptId !== dept._id.toString()) {
        return res.status(403).json({ detail: 'Access restricted to your assigned department.' });
      }
    }

    const issues = await Issue.find({ department: dept._id });

    return res.status(200).json({
      department_id: dept._id.toString(),
      department_name: dept.name,
      code: dept.code,
      total: issues.length,
      pending: issues.filter((i) => i.status === 'pending').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
      critical: issues.filter((i) => i.priority === 'critical').length,
      high: issues.filter((i) => i.priority === 'high').length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
};

module.exports = {
  getDepartments,
  getDepartmentsOverview,
  getDepartmentStats,
};
