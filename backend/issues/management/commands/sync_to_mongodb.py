from django.core.management.base import BaseCommand
from issues.models import Issue
from departments.models import Department
from fixmycity_backend.mongodb import (
    get_mongo_client,
    get_mongo_db,
    get_issues_collection,
    get_departments_collection,
    serialize_issue_for_mongo,
    check_mongo_connection,
)


class Command(BaseCommand):
    help = "Syncs all existing Ahmedabad civic issues and departments to MongoDB Atlas."

    def handle(self, *args, **options):
        self.stdout.write("Connecting to MongoDB Atlas...")
        connected, msg = check_mongo_connection(timeout_ms=4000)
        if not connected:
            self.stderr.write(self.style.ERROR(f"\n[ERROR] Unable to connect to MongoDB Atlas cluster.\nReason: {msg}"))
            self.stdout.write(self.style.WARNING("\nTroubleshooting Steps for MongoDB Atlas:"))
            self.stdout.write(
                "  1. Network Access (IP Whitelist): Log in to MongoDB Atlas -> Security -> Network Access.\n"
                "     Ensure your current public IP address is added (or allow '0.0.0.0/0' for development).\n"
                "  2. Internet / Firewall: Ensure outgoing connections to port 27017 are not blocked by a proxy/firewall.\n"
                "  3. Connection String: Verify MONGODB_URI in your backend/.env file.\n"
            )
            return

        db = get_mongo_db()
        if db is None:
            self.stderr.write(self.style.ERROR("Could not select MongoDB database."))
            return

        self.stdout.write(self.style.SUCCESS(f"Connected to database: '{db.name}'"))

        # 1. Sync Departments
        try:
            dept_col = get_departments_collection()
            departments = Department.objects.all()
            dept_count = 0
            for dept in departments:
                doc = {
                    "_id": str(dept.id),
                    "code": dept.code,
                    "name": dept.name,
                    "email": dept.email,
                    "phone": dept.phone,
                    "description": dept.description,
                    "icon": dept.icon,
                    "head_officer": dept.head_officer,
                }
                dept_col.update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
                dept_count += 1
            self.stdout.write(self.style.SUCCESS(f"Synced {dept_count} departments to MongoDB Atlas."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error syncing departments: {e}"))
            return

        # 2. Sync Issues
        try:
            issue_col = get_issues_collection()
            issues = Issue.objects.select_related("department", "submitted_by").all()
            issue_count = 0
            for issue in issues:
                doc = serialize_issue_for_mongo(issue)
                issue_col.update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
                issue_count += 1
            self.stdout.write(self.style.SUCCESS(f"Synced {issue_count} civic issues to MongoDB Atlas."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error syncing issues: {e}"))
            return

        # 3. Create Geospatial 2dsphere index for Ahmedabad location queries
        try:
            issue_col.create_index([("location", "2dsphere")])
            self.stdout.write(self.style.SUCCESS("Created 2dsphere geospatial index on issues.location!"))
        except Exception as e:
            self.stdout.write(f"Index creation note: {e}")

        total_in_mongo = issue_col.count_documents({})
        self.stdout.write(
            self.style.SUCCESS(
                f"[SUCCESS] MongoDB Atlas Sync Completed! Total issues in MongoDB: {total_in_mongo}"
            )
        )
