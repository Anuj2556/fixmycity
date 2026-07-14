from django.db import models
from django.contrib.auth.models import User
from departments.models import Department

class Issue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    CATEGORY_CHOICES = [
        ('roads', 'Roads'),
        ('water', 'Water'),
        ('electricity', 'Electricity'),
        ('sanitation', 'Sanitation'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    photo = models.ImageField(upload_to='issues/', blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title