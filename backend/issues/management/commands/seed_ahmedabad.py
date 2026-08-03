from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from departments.models import Department
from issues.models import Issue

class Command(BaseCommand):
    help = 'Seed sample Ahmedabad departments and issues'

    def handle(self, *args, **options):
        deps = [
            ('Roads', 'roads@ahmedabad.gov.in', '07911111111'),
            ('Water', 'water@ahmedabad.gov.in', '07922222222'),
            ('Electricity', 'electricity@ahmedabad.gov.in', '07933333333'),
            ('Sanitation', 'sanitation@ahmedabad.gov.in', '07944444444'),
        ]

        for name, email, phone in deps:
            Department.objects.get_or_create(name=name, defaults={'email': email, 'phone': phone})

        user = User.objects.first()
        if not user:
            user = User.objects.create_user('seeduser', 'seed@example.com', 'password')
            self.stdout.write('Created seed user: seeduser / password')

        if Issue.objects.exists():
            self.stdout.write('Issues already exist; skipping creating sample issues.')
            return

        samples = [
            ('Pothole on Ashram Road', 'Large pothole causing traffic delays', 'roads', 23.0227, 72.5712),
            ('Leaking pipe near Ellis Bridge', 'Water leaking from main line', 'water', 23.0220, 72.5718),
            ('Street light not working in Satellite', 'Multiple street lights off', 'electricity', 23.0415, 72.5492),
            ('Overflowing garbage bin near Manek Chowk', 'Sanitation pickup missed', 'sanitation', 23.0076, 72.6036),
        ]

        for title, desc, category, lat, lon in samples:
            dep = Department.objects.filter(name__icontains=category).first()
            Issue.objects.create(
                title=title,
                description=desc,
                category=category,
                latitude=lat,
                longitude=lon,
                department=dep,
                submitted_by=user,
            )
        self.stdout.write('Seeded sample Ahmedabad departments and issues.')
