from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Issue
from .serializers import IssueSerializer

class IssueViewSet(viewsets.ModelViewSet):
    # Only expose issues within Ahmedabad bounding box
    queryset = Issue.objects.filter(latitude__gte=22.95, latitude__lte=23.12,
                                    longitude__gte=72.45, longitude__lte=72.66)
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)