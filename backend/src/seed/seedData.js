require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmycity';

const departmentsData = [
  {
    name: 'Roads & Infrastructure Department',
    code: 'roads',
    description: 'Pothole repairs, asphalt resurfacing, flyovers, bridge maintenance, and pavement safety.',
    head_officer: 'Er. Rajesh Patel',
    icon: '🛣️',
    email: 'roads@ahmedabadcity.gov.in',
    phone: '+91 79 2539 1811',
  },
  {
    name: 'Water Supply & Sewerage Board',
    code: 'water',
    description: 'Potable water pipelines, sewage leakage resolution, drain cleaning, and canal control.',
    head_officer: 'Er. Sangeeta Shah',
    icon: '💧',
    email: 'water@ahmedabadcity.gov.in',
    phone: '+91 79 2539 1822',
  },
  {
    name: 'Street Lighting & Electrical Wing',
    code: 'electricity',
    description: 'Street light repair, faulty feeder pillars, low-hanging wiring hazards, and solar pole monitoring.',
    head_officer: 'Er. Amit Varma',
    icon: '💡',
    email: 'electrical@ahmedabadcity.gov.in',
    phone: '+91 79 2539 1833',
  },
  {
    name: 'Solid Waste Management & Sanitation',
    code: 'sanitation',
    description: 'Garbage disposal, roadside litter clearance, overflowing dumpster removal, and public sanitization.',
    head_officer: 'Dr. Meena Trivedi',
    icon: '🗑️',
    email: 'sanitation@ahmedabadcity.gov.in',
    phone: '+91 79 2539 1844',
  },
  {
    name: 'Public Health & Vector Control',
    code: 'health',
    description: 'Anti-larval mosquito fogging, epidemic prevention, public clinic sanitation, and food safety checks.',
    head_officer: 'Dr. Ketan Parmar',
    icon: '🏥',
    email: 'health@ahmedabadcity.gov.in',
    phone: '+91 79 2539 1855',
  },
];

async function seed() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'fixmycity',
    });
    console.log('✅ [Seed] MongoDB Connected successfully.');

    // 1. Seed Departments
    const deptMap = {};
    for (const dept of departmentsData) {
      const existing = await Department.findOne({ code: dept.code });
      if (!existing) {
        const created = await Department.create(dept);
        deptMap[dept.code] = created._id;
        console.log(`  + Department created: ${dept.name}`);
      } else {
        deptMap[dept.code] = existing._id;
        console.log(`  = Department already exists: ${dept.name}`);
      }
    }

    // 2. Initial Administrative Accounts (for deployment bootstrap)
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@FixMyCity2026!';
    const officerPassword = process.env.INITIAL_OFFICER_PASSWORD || 'Officer@Ahmedabad2026!';

    const initialUsers = [
      {
        username: 'adminuser',
        email: 'admin@ahmedabadcity.gov.in',
        password: adminPassword,
        role: 'admin',
        is_staff: true,
        phone: '+91 79 2539 1800',
        address: 'Municipal Corporation HQ, Danapith, Ahmedabad',
      },
      {
        username: 'officer_roads',
        email: 'officer.roads@ahmedabadcity.gov.in',
        password: officerPassword,
        role: 'department_admin',
        is_staff: true,
        department: deptMap['roads'],
        phone: '+91 79 2539 1811',
        address: 'Roads Division Office, Usmanpura, Ahmedabad',
      },
      {
        username: 'officer_water',
        email: 'officer.water@ahmedabadcity.gov.in',
        password: officerPassword,
        role: 'department_admin',
        is_staff: true,
        department: deptMap['water'],
        phone: '+91 79 2539 1822',
        address: 'Water Works, Dudheshwar, Ahmedabad',
      },
      {
        username: 'officer_electricity',
        email: 'officer.electricity@ahmedabadcity.gov.in',
        password: officerPassword,
        role: 'department_admin',
        is_staff: true,
        department: deptMap['electricity'],
        phone: '+91 79 2539 1833',
        address: 'Street Light Division, Navrangpura, Ahmedabad',
      },
      {
        username: 'officer_sanitation',
        email: 'officer.sanitation@ahmedabadcity.gov.in',
        password: officerPassword,
        role: 'department_admin',
        is_staff: true,
        department: deptMap['sanitation'],
        phone: '+91 79 2539 1844',
        address: 'Health & Sanitation Complex, Danapith, Ahmedabad',
      },
    ];

    for (const userData of initialUsers) {
      const exists = await User.findOne({ username: userData.username });
      if (!exists) {
        await User.create(userData);
        console.log(`  + User created: ${userData.username} (${userData.role})`);
      } else {
        console.log(`  = User already exists: ${userData.username}`);
      }
    }

    console.log('\n🎉 [Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Seed Error]', err);
    process.exit(1);
  }
}

seed();
