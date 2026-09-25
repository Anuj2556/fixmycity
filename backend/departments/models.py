from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, default='')
    head_officer = models.CharField(max_length=100, blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, default='🏢')
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name