import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'fixmycity_backend.settings'
import django
django.setup()
from django.contrib.auth.models import User
from users.models import Profile

user, created = User.objects.get_or_create(username='adminuser', defaults={'is_staff': True})
user.set_password('adminpass123')
user.save()
Profile.objects.get_or_create(user=user, defaults={'role': 'admin'})
print('created' if created else 'exists', user.username, user.id, Profile.objects.get(user=user).role)
