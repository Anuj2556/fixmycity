import os, sys, django
sys.path.append(r'g:\ANUJ\fixmycity\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixmycity_backend.settings')
django.setup()
from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from django.contrib.auth.models import User

client = APIClient()

for username in ['adminuser', 'anuj', 'officer_roads', 'officer_water', 'citizen1', 'newcitizen']:
    u = User.objects.filter(username=username).first()
    if not u:
        continue
    client.force_authenticate(user=u)
    res_overview = client.get('/api/departments/overview/')
    res_issues = client.get('/api/issues/')
    profile = getattr(u, 'profile', None)
    role = getattr(profile, 'role', 'NO_PROFILE')
    dept = getattr(profile, 'department', None)
    print(f"User: {username} (is_super={u.is_superuser}, role={role}, dept={dept})")
    print(f"  /departments/overview/ -> {res_overview.status_code}, count: {len(res_overview.data) if res_overview.status_code==200 else res_overview.data}")
    print(f"  /issues/ -> {res_issues.status_code}, count: {len(res_issues.data) if res_issues.status_code==200 else res_issues.data}")
    if res_overview.status_code == 200 and len(res_overview.data) > 0:
        first_dept_id = res_overview.data[0]['id']
        first_dept_name = res_overview.data[0]['name']
        res_dept_issues = client.get(f'/api/issues/?department={first_dept_id}')
        print(f"  /issues/?department={first_dept_id} ({first_dept_name}) -> {res_dept_issues.status_code}, count: {len(res_dept_issues.data)}")
