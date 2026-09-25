import os
import logging
# pyrefly: ignore [missing-import]
from pymongo import MongoClient
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

try:
    # pyrefly: ignore [missing-import]
    import certifi
    CA_FILE = certifi.where()
except ImportError:
    CA_FILE = None

load_dotenv()

logger = logging.getLogger(__name__)

# Default MongoDB Atlas connection string
DEFAULT_MONGO_URI = (
    "mongodb+srv://anujprajapati255_db_user:2i6F8MS1NA9hf58P@fixmycity.n2d1qoa.mongodb.net/?appName=FixMyCity"
)
MONGO_URI = os.getenv("MONGODB_URI", DEFAULT_MONGO_URI)
MONGO_DB_NAME = os.getenv("MONGODB_DB_NAME", "fixmycity")

_client = None


def get_mongo_client():
    """Returns a singleton PyMongo client instance configured safely for Atlas."""
    global _client
    if _client is None:
        try:
            kwargs = {
                "serverSelectionTimeoutMS": 3000,
                "connectTimeoutMS": 3000,
                "retryWrites": True,
            }
            if CA_FILE:
                kwargs["tlsCAFile"] = CA_FILE
            _client = MongoClient(MONGO_URI, **kwargs)
        except Exception as e:
            logger.warning(f"Failed to initialize MongoClient: {e}")
            return None
    return _client


def check_mongo_connection(timeout_ms=3000):
    """
    Actively checks if MongoDB Atlas can be reached and authenticated.
    Returns (success: bool, message: str).
    """
    try:
        kwargs = {
            "serverSelectionTimeoutMS": timeout_ms,
            "connectTimeoutMS": timeout_ms,
            "retryWrites": True,
        }
        if CA_FILE:
            kwargs["tlsCAFile"] = CA_FILE
        test_client = MongoClient(MONGO_URI, **kwargs)
        test_client.admin.command('ping')
        return True, "Connected successfully to MongoDB Atlas."
    except Exception as e:
        return False, str(e)


def get_mongo_db():
    """Returns the MongoDB database instance."""
    client = get_mongo_client()
    if client:
        return client[MONGO_DB_NAME]
    return None


def get_issues_collection():
    """Returns the 'issues' collection in MongoDB Atlas."""
    db = get_mongo_db()
    if db is not None:
        return db["issues"]
    return None


def get_departments_collection():
    """Returns the 'departments' collection in MongoDB Atlas."""
    db = get_mongo_db()
    if db is not None:
        return db["departments"]
    return None


def serialize_issue_for_mongo(issue):
    """Converts a Django Issue instance into a clean document for MongoDB."""
    return {
        "_id": str(issue.id),
        "django_id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "priority": issue.priority,
        "status": issue.status,
        "department": {
            "id": issue.department.id if issue.department else None,
            "code": issue.department.code if issue.department else None,
            "name": issue.department.name if issue.department else None,
        } if issue.department else None,
        "submitted_by": {
            "id": issue.submitted_by.id if issue.submitted_by else None,
            "username": issue.submitted_by.username if issue.submitted_by else "anonymous",
            "email": issue.submitted_by.email if issue.submitted_by else "",
        } if getattr(issue, "submitted_by", None) else None,
        "location": {
            "type": "Point",
            "coordinates": [float(issue.longitude), float(issue.latitude)]
            if issue.longitude and issue.latitude
            else [72.5714, 23.0225],
            "latitude": float(issue.latitude) if issue.latitude else None,
            "longitude": float(issue.longitude) if issue.longitude else None,
        },
        "photo_url": issue.photo.url if getattr(issue, "photo", None) and issue.photo else None,
        "ai_confidence": getattr(issue, "ai_confidence", None),
        "ai_reasoning": getattr(issue, "ai_reasoning", ""),
        "department_notes": getattr(issue, "department_notes", ""),
        "created_at": issue.created_at.isoformat() if issue.created_at else None,
        "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
    }


def sync_issue_to_mongo(issue):
    """Inserts or updates an issue document in MongoDB Atlas."""
    try:
        col = get_issues_collection()
        if col is None:
            return False
        doc = serialize_issue_for_mongo(issue)
        col.update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
        return True
    except Exception as e:
        logger.warning(f"Could not sync issue {getattr(issue, 'id', None)} to MongoDB: {e}")
        return False


def delete_issue_from_mongo(issue_id):
    """Deletes an issue document from MongoDB Atlas."""
    try:
        col = get_issues_collection()
        if col is None:
            return False
        col.delete_one({"_id": str(issue_id)})
        return True
    except Exception as e:
        logger.warning(f"Could not delete issue {issue_id} from MongoDB: {e}")
        return False
