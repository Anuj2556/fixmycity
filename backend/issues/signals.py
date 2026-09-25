import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Issue
from fixmycity_backend.mongodb import sync_issue_to_mongo, delete_issue_from_mongo

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Issue)
def handle_issue_saved_to_mongo(sender, instance, created, **kwargs):
    """Automatically mirrors created/updated issues into MongoDB Atlas in real-time."""
    try:
        sync_issue_to_mongo(instance)
    except Exception as e:
        logger.warning(f"Error syncing issue {instance.id} to MongoDB: {e}")


@receiver(post_delete, sender=Issue)
def handle_issue_deleted_from_mongo(sender, instance, **kwargs):
    """Removes deleted issues from MongoDB Atlas."""
    try:
        delete_issue_from_mongo(instance.id)
    except Exception as e:
        logger.warning(f"Error deleting issue {instance.id} from MongoDB: {e}")
