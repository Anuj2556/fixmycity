from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'role', 'phone', 'address', 'department', 'department_name', 'department_code', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile', 'stats']

    def get_stats(self, obj):
        total_reported = obj.submitted_issues.count() if hasattr(obj, 'submitted_issues') else 0
        resolved_count = obj.submitted_issues.filter(status='resolved').count() if hasattr(obj, 'submitted_issues') else 0
        pending_count = obj.submitted_issues.filter(status='pending').count() if hasattr(obj, 'submitted_issues') else 0
        return {
            'total_reported': total_reported,
            'resolved': resolved_count,
            'pending': pending_count,
        }