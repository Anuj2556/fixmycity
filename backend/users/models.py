from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = [
        ('citizen', 'Citizen'),
        ('admin', 'Admin'),
        ('department_admin', 'Department Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    phone = models.CharField(max_length=15, blank=True, default='')
    address = models.CharField(max_length=255, blank=True, default='')
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_profiles')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        dept_str = f" ({self.department.name})" if self.department else ""
        return f"{self.user.username} - {self.role}{dept_str}"