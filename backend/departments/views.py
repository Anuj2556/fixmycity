from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Department
from .serializers import DepartmentSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='overview', permission_classes=[IsAuthenticated])
    def overview(self, request):
        """Returns all departments with real-time operational issue metrics for staff/officers."""
        user = request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', 'citizen')
        is_admin = user.is_superuser or role == 'admin'
        is_dept_admin = role == 'department_admin' and not is_admin

        if not is_admin and not is_dept_admin:

            return Response(
                {'detail': 'Access restricted to Municipal Officers and Administrators.'},
                status=status.HTTP_403_FORBIDDEN
            )

        departments = Department.objects.all().order_by('name')
        if is_dept_admin and not is_admin:
            dept = getattr(profile, 'department', None)
            if dept:
                departments = departments.filter(id=dept.id)
            else:
                departments = departments.none()

        data = []
        for d in departments:
            issues = d.issues.all() if hasattr(d, 'issues') else []
            total = issues.count() if hasattr(issues, 'count') else 0
            pending = issues.filter(status='pending').count() if total > 0 else 0
            in_progress = issues.filter(status='in_progress').count() if total > 0 else 0
            resolved = issues.filter(status='resolved').count() if total > 0 else 0
            critical = issues.filter(priority='critical').count() if total > 0 else 0
            high = issues.filter(priority='high').count() if total > 0 else 0

            dept_data = DepartmentSerializer(d).data
            dept_data['metrics'] = {
                'total': total,
                'pending': pending,
                'in_progress': in_progress,
                'resolved': resolved,
                'critical': critical,
                'high': high,
            }
            data.append(dept_data)

        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='stats', permission_classes=[IsAuthenticated])
    def stats(self, request, pk=None):
        """Returns statistics for a specific department."""
        user = request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', 'citizen')
        is_admin = user.is_superuser or role == 'admin'
        is_dept_admin = role == 'department_admin' and not is_admin

        if not is_admin and not is_dept_admin:

            return Response({'detail': 'Access restricted.'}, status=status.HTTP_403_FORBIDDEN)

        dept = self.get_object()
        if is_dept_admin and not is_admin:
            user_dept = getattr(profile, 'department', None)
            if not user_dept or user_dept.id != dept.id:
                return Response(
                    {'detail': 'Access restricted to your assigned department.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        issues = dept.issues.all()
        return Response({
            'department_id': dept.id,
            'department_name': dept.name,
            'code': dept.code,
            'total': issues.count(),
            'pending': issues.filter(status='pending').count(),
            'in_progress': issues.filter(status='in_progress').count(),
            'resolved': issues.filter(status='resolved').count(),
            'critical': issues.filter(priority='critical').count(),
            'high': issues.filter(priority='high').count(),
        })
