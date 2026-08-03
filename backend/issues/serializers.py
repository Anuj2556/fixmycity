from rest_framework import serializers
from .models import Issue

class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = '__all__'
        read_only_fields = ['submitted_by', 'created_at', 'updated_at']

    def validate(self, data):
        # Ahmedabad bounding box (approximate)
        min_lat, max_lat = 22.95, 23.12
        min_lon, max_lon = 72.45, 72.66

        # For updates the latitude/longitude might be absent in data; fall back to instance
        lat = data.get('latitude') if data.get('latitude') is not None else getattr(self.instance, 'latitude', None)
        lon = data.get('longitude') if data.get('longitude') is not None else getattr(self.instance, 'longitude', None)

        if lat is None or lon is None:
            return data

        if not (min_lat <= float(lat) <= max_lat and min_lon <= float(lon) <= max_lon):
            raise serializers.ValidationError('Location must be within Ahmedabad city boundaries.')

        return data