from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from departments.models import Department
from issues.models import Issue
from users.models import Profile

class Command(BaseCommand):
    help = 'Seed comprehensive Ahmedabad municipal departments, demo users, and issues with priorities and AI metadata'

    def handle(self, *args, **options):
        # 1. Seed Municipal Departments
        departments_data = [
            {
                'code': 'roads',
                'name': 'Roads & Infrastructure Department',
                'email': 'roads@ahmedabadcity.gov.in',
                'phone': '+91-79-25391811',
                'description': 'Maintains arterial roads, potholes, flyovers, footpaths, bridges, and traffic corridor infrastructure.',
                'icon': '🛣️',
                'head_officer': 'Er. Rajesh Patel (Chief City Engineer)',
            },
            {
                'code': 'water',
                'name': 'Water Supply & Sewerage Board',
                'email': 'water@ahmedabadcity.gov.in',
                'phone': '+91-79-25391812',
                'description': 'Oversees drinking water distribution, pipeline maintenance, storm drains, and sewerage networks.',
                'icon': '💧',
                'head_officer': 'Er. Meera Shah (Executive Engineer)',
            },
            {
                'code': 'electricity',
                'name': 'Electricity & Street Lighting Department',
                'email': 'lighting@ahmedabadcity.gov.in',
                'phone': '+91-79-25391813',
                'description': 'Responsible for municipal streetlights, junction boxes, high voltage power lines, and transformer safety.',
                'icon': '⚡',
                'head_officer': 'Shri Amit Dave (Chief Electrical Engineer)',
            },
            {
                'code': 'sanitation',
                'name': 'Solid Waste & Sanitation Department',
                'email': 'cleanliness@ahmedabadcity.gov.in',
                'phone': '+91-79-25391814',
                'description': 'Handles municipal solid waste management, door-to-door garbage collection, and street sweeping.',
                'icon': '🧹',
                'head_officer': 'Dr. Hitesh Barot (Health & Sanitation Officer)',
            },
            {
                'code': 'health_safety',
                'name': 'Public Health & Civic Amenities',
                'email': 'civic@ahmedabadcity.gov.in',
                'phone': '+91-79-25391815',
                'description': 'Manages general civic safety, public parks, encroachment control, and environmental sanitation.',
                'icon': '🛡️',
                'head_officer': 'Smt. Ananya Desai (Civic Commissioner)',
            },
        ]

        dept_objs = {}
        for d in departments_data:
            dept, created = Department.objects.update_or_create(
                code=d['code'],
                defaults={
                    'name': d['name'],
                    'email': d['email'],
                    'phone': d['phone'],
                    'description': d['description'],
                    'icon': d['icon'],
                    'head_officer': d['head_officer'],
                }
            )
            dept_objs[d['code']] = dept
            status_text = 'Created' if created else 'Updated'
            self.stdout.write(f"  [{status_text}] Department: {dept.name}")

        # 2. Seed Demo Users
        users_data = [
            {
                'username': 'adminuser',
                'email': 'admin@fixmycity.in',
                'password': 'adminpass123',
                'role': 'admin',
                'is_staff': True,
                'phone': '+91-9876543210',
                'dept': None,
            },
            {
                'username': 'officer_roads',
                'email': 'roads.officer@ahmedabadcity.gov.in',
                'password': 'officerpass123',
                'role': 'department_admin',
                'is_staff': True,
                'phone': '+91-9876543211',
                'dept': dept_objs['roads'],
            },
            {
                'username': 'officer_water',
                'email': 'water.officer@ahmedabadcity.gov.in',
                'password': 'officerpass123',
                'role': 'department_admin',
                'is_staff': True,
                'phone': '+91-9876543212',
                'dept': dept_objs['water'],
            },
            {
                'username': 'citizen1',
                'email': 'citizen1@ahmedabad.in',
                'password': 'citizenpass123',
                'role': 'citizen',
                'is_staff': False,
                'phone': '+91-9876543213',
                'dept': None,
            },
        ]

        user_objs = {}
        for u in users_data:
            user, created = User.objects.get_or_create(username=u['username'], defaults={'email': u['email']})
            user.set_password(u['password'])
            user.is_staff = u['is_staff']
            user.email = u['email']
            user.save()

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.role = u['role']
            profile.phone = u['phone']
            profile.department = u['dept']
            profile.save()

            user_objs[u['username']] = user
            self.stdout.write(f"  [User Configured] {user.username} ({profile.role})")

        # 3. Seed Realistic Issues with Priorities & AI metadata
        default_user = user_objs['citizen1']

        sample_issues = [
            {
                'title': 'Severe Live Wire Hanging Near Vastrapur Lake',
                'description': 'High voltage wire hanging low over the pedestrian walkway after heavy wind. Poses immediate electrocution risk to morning joggers.',
                'category': 'electricity',
                'priority': 'critical',
                'status': 'in_progress',
                'latitude': 23.0350,
                'longitude': 72.5293,
                'dept': dept_objs['electricity'],
                'ai_conf': 0.96,
                'ai_reasoning': "High safety risk detected due to 'live wire' and 'electrocution'. Priority assigned: CRITICAL.",
                'dept_notes': 'Emergency electrical van dispatched. Crew isolating substation feeder.',
            },
            {
                'title': 'Main Water Pipeline Burst on Ashram Road',
                'description': 'Clean drinking water gushing onto the road near Income Tax circle. Water pressure in nearby residential societies has dropped to zero.',
                'category': 'water',
                'priority': 'critical',
                'status': 'in_progress',
                'latitude': 23.0425,
                'longitude': 72.5714,
                'dept': dept_objs['water'],
                'ai_conf': 0.94,
                'ai_reasoning': "High disruption detected due to 'pipeline burst' and 'water pressure dropped'. Priority assigned: CRITICAL.",
                'dept_notes': 'Valve control team on site. Excavator en route to replace ruptured 300mm pipe segment.',
            },
            {
                'title': 'Deep Dangerous Pothole near SG Highway Flyover',
                'description': 'Large pothole crater roughly 2 feet wide on the fast lane before Thaltej cross roads. Multiple two-wheelers have slipped.',
                'category': 'roads',
                'priority': 'high',
                'status': 'pending',
                'latitude': 23.0510,
                'longitude': 72.5120,
                'dept': dept_objs['roads'],
                'ai_conf': 0.91,
                'ai_reasoning': "Road fault posing vehicular hazard. Identified keywords 'deep', 'slipped'. Priority assigned: HIGH.",
                'dept_notes': '',
            },
            {
                'title': 'Overflowing Garbage Bin near Law Garden Food Street',
                'description': 'Municipal container overflowing with food waste and plastic debris since weekend. Severe stench and stray animals gathering.',
                'category': 'sanitation',
                'priority': 'high',
                'status': 'pending',
                'latitude': 23.0248,
                'longitude': 72.5590,
                'dept': dept_objs['sanitation'],
                'ai_conf': 0.89,
                'ai_reasoning': "Public hygiene hazard from uncollected organic waste. Priority assigned: HIGH.",
                'dept_notes': '',
            },
            {
                'title': 'Flickering Streetlight in Navrangpura Lane 4',
                'description': 'Single street light pole lamp blinking intermittently over the past week. Residential street is partially dim at night.',
                'category': 'electricity',
                'priority': 'medium',
                'status': 'pending',
                'latitude': 23.0371,
                'longitude': 72.5532,
                'dept': dept_objs['electricity'],
                'ai_conf': 0.86,
                'ai_reasoning': 'Routine lighting maintenance report. Priority assigned: MEDIUM.',
                'dept_notes': '',
            },
            {
                'title': 'Clogged Storm Drain before Monsoon near Maninagar',
                'description': 'Rainwater drainage inlet covered with plastic silt and dry leaves near Kankaria gate 3.',
                'category': 'water',
                'priority': 'medium',
                'status': 'resolved',
                'latitude': 23.0064,
                'longitude': 72.6026,
                'dept': dept_objs['water'],
                'ai_conf': 0.88,
                'ai_reasoning': 'Drainage maintenance issue. Priority assigned: MEDIUM.',
                'dept_notes': 'Drain cleared and jet-washed by AMC Zone 4 sanitation squad.',
            },
            {
                'title': 'Asphalt Crack and Loose Gravel on Bopal Main Road',
                'description': 'Minor tar cracking and loose small gravel near South Bopal intersection. Needs resurfacing before widening.',
                'category': 'roads',
                'priority': 'low',
                'status': 'resolved',
                'latitude': 23.0185,
                'longitude': 72.4645,
                'dept': dept_objs['roads'],
                'ai_conf': 0.85,
                'ai_reasoning': 'Cosmetic roadway wear identified. Priority assigned: LOW.',
                'dept_notes': 'Patchwork completed during routine evening asphalt run.',
            },
            {
                'title': 'Overgrown Park Vegetation Blocking Footpath in Bodakdev',
                'description': 'Branches from municipal civic garden hanging low across public walkway.',
                'category': 'other',
                'priority': 'low',
                'status': 'in_progress',
                'latitude': 23.0450,
                'longitude': 72.5180,
                'dept': dept_objs['health_safety'],
                'ai_conf': 0.82,
                'ai_reasoning': 'Civic amenities and garden maintenance. Priority assigned: LOW.',
                'dept_notes': 'AMC horticulture wing scheduled for pruning tomorrow.',
            },
        ]

        # Clear existing test issues or re-seed
        Issue.objects.all().delete()

        for s in sample_issues:
            Issue.objects.create(
                title=s['title'],
                description=s['description'],
                category=s['category'],
                priority=s['priority'],
                status=s['status'],
                latitude=s['latitude'],
                longitude=s['longitude'],
                department=s['dept'],
                submitted_by=default_user,
                ai_confidence=s['ai_conf'],
                ai_reasoning=s['ai_reasoning'],
                department_notes=s['dept_notes'],
            )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded 5 departments, 4 demo users, and {len(sample_issues)} realistic civic issues for Ahmedabad!"))

