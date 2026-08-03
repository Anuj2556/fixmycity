from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Profile


class AuthViewsTests(APITestCase):
    def test_login_returns_user_role_in_payload(self):
        user = User.objects.create_user(username='adminuser', password='adminpass123')
        Profile.objects.create(user=user, role='admin')

        response = self.client.post(
            reverse('login'),
            {'username': 'adminuser', 'password': 'adminpass123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['role'], 'admin')

    def test_registration_creates_profile_for_new_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'newpass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username='newuser')
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertEqual(Profile.objects.get(user=user).role, 'citizen')
