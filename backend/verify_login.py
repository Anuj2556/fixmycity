import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'fixmycity_backend.settings'
import django
django.setup()
from django.contrib.auth.models import User
from users.models import Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

user = User.objects.filter(username='adminuser').first()
if not user:
    user = User.objects.create_user(username='adminuser', password='adminpass123')
Profile.objects.get_or_create(user=user, defaults={'role': 'admin'})
serializer = TokenObtainPairSerializer(data={'username': 'adminuser', 'password': 'adminpass123'})
print('is_valid', serializer.is_valid())
print('errors', serializer.errors)
print('validated', serializer.validated_data)
