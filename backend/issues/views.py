import base64
import re
import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Issue
from .serializers import IssueSerializer
from departments.models import Department

AI_SERVICE_URL = 'http://127.0.0.1:5000'

DEPARTMENT_DEFAULTS = {
    'roads': {
        'name': 'Roads & Infrastructure Department',
        'code': 'roads',
        'email': 'roads@ahmedabadcity.gov.in',
        'phone': '+91-79-25391811',
        'description': 'Maintains arterial roads, bridges, potholes, footpaths, and flyovers across Ahmedabad.',
        'icon': '🛣️',
        'head_officer': 'Er. Rajesh Patel (Chief City Engineer)',
    },
    'water': {
        'name': 'Water Supply & Sewerage Board',
        'code': 'water',
        'email': 'water@ahmedabadcity.gov.in',
        'phone': '+91-79-25391812',
        'description': 'Oversees drinking water distribution, pipeline maintenance, storm drains, and sewerage networks.',
        'icon': '💧',
        'head_officer': 'Er. Meera Shah (Executive Engineer)',
    },
    'electricity': {
        'name': 'Electricity & Street Lighting Department',
        'code': 'electricity',
        'email': 'lighting@ahmedabadcity.gov.in',
        'phone': '+91-79-25391813',
        'description': 'Responsible for public lighting, junction boxes, power line safety, and transformer maintenance.',
        'icon': '⚡',
        'head_officer': 'Shri Amit Dave (Chief Electrical Engineer)',
    },
    'sanitation': {
        'name': 'Solid Waste & Sanitation Department',
        'code': 'sanitation',
        'email': 'cleanliness@ahmedabadcity.gov.in',
        'phone': '+91-79-25391814',
        'description': 'Handles municipal solid waste management, door-to-door garbage collection, and street sweeping.',
        'icon': '🧹',
        'head_officer': 'Dr. Hitesh Barot (Health & Sanitation Officer)',
    },
    'other': {
        'name': 'Public Health & Civic Amenities',
        'code': 'health_safety',
        'email': 'civic@ahmedabadcity.gov.in',
        'phone': '+91-79-25391815',
        'description': 'Manages general civic safety, public parks, encroachment control, and environmental sanitation.',
        'icon': '🛡️',
        'head_officer': 'Smt. Ananya Desai (Civic Commissioner)',
    },
}

def get_or_create_department_for_category(category_key):
    """Ensures the appropriate Ahmedabad municipal department exists and returns it."""
    dept_info = DEPARTMENT_DEFAULTS.get(category_key, DEPARTMENT_DEFAULTS['other'])
    dept, _ = Department.objects.get_or_create(
        code=dept_info['code'],
        defaults={
            'name': dept_info['name'],
            'email': dept_info['email'],
            'phone': dept_info['phone'],
            'description': dept_info['description'],
            'icon': dept_info['icon'],
            'head_officer': dept_info['head_officer'],
        }
    )
    return dept


def is_gibberish_or_meaningless(text):
    """Detects random keyboard mashing, repeated characters, and meaningless inputs."""
    if not text:
        return True
    clean = text.strip().lower()
    if len(clean) < 4:
        return True
    
    # 4+ repeated identical characters: aaaa, 1111
    if re.search(r'(.)\1{3,}', clean):
        return True
        
    # Keyboard sequence mash
    if re.search(r'(asdf|dfgh|ghjk|hjkl|qwerty|werty|zxcv|xcvb|1234|2345|3456)', clean):
        return True

    # 4 or more consecutive consonants (e.g. sdfg, dfgh, bcdf)
    if re.search(r'[bcdfghjklmnpqrstvwxyz]{5,}', clean):
        return True

    words = re.findall(r'[a-z]+', clean)
    if not words:
        return True
        
    for w in words:
        if len(w) >= 4 and not re.search(r'[aeiou]', w):
            return True
            
    all_letters = ''.join(words)
    if len(all_letters) >= 6:
        vowels = len(re.findall(r'[aeiou]', all_letters))
        if vowels / len(all_letters) < 0.18:
            return True
            
    nonsense_phrases = {'test', 'testing', 'hello', 'asdf', 'qwerty', '1234', 'xyz', 'foo bar', 'nothing', 'bla bla'}
    if clean in nonsense_phrases:
        return True

    return False


def extract_single_category(text):
    if not text or is_gibberish_or_meaningless(text):
        return None
    raw = text.lower()
    raw = re.sub(r'\bpolehole\b', 'pothole', raw)
    raw = re.sub(r'\bpothols\b', 'pothole', raw)
    raw = re.sub(r'\bcrator\b', 'crater', raw)
    raw = re.sub(r'\bbrock\b', 'broken', raw)
    raw = re.sub(r'\bborken\b', 'broken', raw)
    raw = re.sub(r'\bbrokn\b', 'broken', raw)
    raw = re.sub(r'\bstreetlight\b', 'street light', raw)
    raw = re.sub(r'\bkachra\b', 'garbage', raw)
    raw = re.sub(r'\bkuda\b', 'garbage', raw)
    raw = re.sub(r'\bsadak\b', 'road', raw)
    raw = re.sub(r'\brasta\b', 'road', raw)
    raw = re.sub(r'\bkhadda\b', 'pothole', raw)
    raw = re.sub(r'\bbijli\b', 'electricity', raw)
    raw = re.sub(r'\bnalla\b', 'drain', raw)
    raw = re.sub(r'\bpaani\b', 'water', raw)

    if re.search(r'\b(electricity|street light|light pole|electric pole|wire|live wire|hanging wire|cable|high voltage|power cut|power outage|blackout|transformer|spark|sparking|electric shock|short circuit|junction box)\b', raw):
        return 'electricity'
    if re.search(r'\b(pipeline|burst|water|leak|leakage|drain|drainage|gutter|sewer|sewage|drinking water|waterlogged|water shortage|no water|dirty water|tap)\b', raw):
        return 'water'
    if re.search(r'\b(garbage|trash|waste|dustbin|bin|litter|rubbish|dump|dumping|stench|foul smell|rotten|debris|sweeper|dead animal)\b', raw):
        return 'sanitation'
    if re.search(r'\b(pothole|road|asphalt|pavement|crater|footpath|sidewalk|divider|curb|speedbreaker|speed breaker|highway|flyover|bridge|sinkhole|cave in|tar|street crack|broken road)\b', raw):
        return 'roads'
    if re.search(r'\b(stray dog|dog bite|animal|mosquito|dengue|malaria|public park|tree fell|fallen tree|illegal hoarding|banner|encroachment)\b', raw):
        return 'other'
    return None


def classify_fallback(text, title=None, category=None):
    """Intelligent internal fallback civic classifier if standalone AI service is starting up."""
    combined = f"{title or ''}. {text or ''}".strip()
    if is_gibberish_or_meaningless(combined):
        return {
            'category': None,
            'priority': None,
            'confidence': 0.0,
            'department_code': None,
            'department_name': 'None (Unrecognized Issue)',
            'ai_reasoning': 'Input does not match any recognized municipal civic problem. Please select a category manually.',
            'is_valid_civic_issue': False,
            'is_mismatch': False,
        }

    title_cat = extract_single_category(title)
    desc_cat = extract_single_category(text)

    # Cross-field topic mismatch check
    if title_cat and desc_cat and title_cat != desc_cat:
        t_name = DEPARTMENT_DEFAULTS.get(title_cat, {}).get('name', title_cat)
        d_name = DEPARTMENT_DEFAULTS.get(desc_cat, {}).get('name', desc_cat)
        return {
            'category': None,
            'priority': None,
            'confidence': 0.0,
            'department_code': None,
            'department_name': 'None (Topic Mismatch)',
            'ai_reasoning': f"⚠️ Topic Mismatch Detected: Title describes a {t_name} issue while description describes a {d_name} issue. Please align your title and description.",
            'is_valid_civic_issue': False,
            'is_mismatch': True,
        }

    raw = combined.lower()

    # Priority determination
    critical_signals = ['live wire', 'hanging wire', 'spark', 'sparking', 'electric shock', 'pipeline burst', 'major burst', 'flooding', 'sinkhole', 'cave in', 'accident', 'accidents', 'emergency', 'fatal', 'short circuit']
    high_signals = ['deep pothole', 'open manhole', 'no water', 'blackout', 'dark road', 'pitch dark', 'sewage', 'urgent', 'dangerous', 'hospital', 'school', 'drain blocked', 'gutter overflow', 'big pothole', 'big road']
    low_signals = ['minor', 'small', 'cosmetic', 'faded', 'suggestion', 'litter', 'routine', 'slow drip', 'small pothole', 'small hole']

    priority = 'medium'
    reasoning = 'Standard municipal service report logged.'

    for kw in critical_signals:
        if kw in raw:
            priority = 'critical'
            reasoning = f"Urgent safety risk detected ('{kw}'). Flagged for emergency response."
            break

    if priority == 'medium':
        for kw in high_signals:
            if kw in raw:
                priority = 'high'
                reasoning = f"Elevated civic hazard identified ('{kw}'). Prioritized for expedited inspection."
                break

    if priority == 'medium':
        for kw in low_signals:
            if kw in raw:
                priority = 'low'
                reasoning = f"Minor civic complaint identified ('{kw}'). Scheduled in routine maintenance queue."
                break

    cat = desc_cat or title_cat or extract_single_category(raw)
    if not cat:
        cat = category if (category and category not in ['other', 'none', 'auto', '']) else None

    if not cat:
        return {
            'category': None,
            'priority': None,
            'confidence': 0.0,
            'department_code': None,
            'department_name': 'None (Unrecognized Issue)',
            'ai_reasoning': 'Input does not match any recognized municipal civic problem. Please select a category manually.',
            'is_valid_civic_issue': False,
            'is_mismatch': False,
        }

    dept_info = DEPARTMENT_DEFAULTS.get(cat, DEPARTMENT_DEFAULTS['other'])

    return {
        'category': cat,
        'priority': priority,
        'confidence': 0.92,
        'department_code': dept_info['code'],
        'department_name': dept_info['name'],
        'ai_reasoning': reasoning,
        'is_valid_civic_issue': True,
        'is_mismatch': False,
    }


def call_ai_service(description, title='', image_base64=None, fallback_cat=None):
    """Calls the Flask AI service or falls back smoothly if unavailable."""
    try:
        payload = {'description': description, 'title': title}
        if image_base64:
            payload['image'] = image_base64

        resp = requests.post(f"{AI_SERVICE_URL}/classify", json=payload, timeout=6.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"Notice: AI Microservice call fallback ({e})")

    return classify_fallback(text=description, title=title, category=fallback_cat)


class IssueViewSet(viewsets.ModelViewSet):
    # Only expose issues within Ahmedabad bounding box
    queryset = Issue.objects.filter(
        latitude__gte=22.95, latitude__lte=23.12,
        longitude__gte=72.45, longitude__lte=72.66
    ).order_by('-created_at')
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        user = self.request.user

        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', 'citizen')
        is_admin = user.is_superuser or role == 'admin'
        is_dept_admin = role == 'department_admin' and not is_admin


        # Strict citizen privacy: Normal citizens can ONLY view their own submitted issues
        if not is_admin and not is_dept_admin:
            return qs.filter(submitted_by=user)

        # Department officers can ONLY see issues assigned to their assigned department
        if is_dept_admin and not is_admin:
            dept = getattr(profile, 'department', None)
            if not dept:
                return qs.none()
            qs = qs.filter(department=dept)
            if params.get('my_issues') == 'true':
                qs = qs.filter(submitted_by=user)

        # City Administrators can view all or filter by my_issues or any department
        elif is_admin:
            if params.get('my_issues') == 'true':
                qs = qs.filter(submitted_by=user)
            dept_id = params.get('department')
            if dept_id:
                qs = qs.filter(department_id=dept_id)
            dept_code = params.get('department_code')
            if dept_code:
                qs = qs.filter(department__code=dept_code)


        # Filter by status
        status_param = params.get('status')
        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)

        # Filter by priority
        priority_param = params.get('priority')
        if priority_param and priority_param != 'all':
            qs = qs.filter(priority=priority_param)

        # Search term in title or description
        search = params.get('search')
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(description__icontains=search)

        return qs


    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', 'citizen')
        is_admin = user.is_superuser or role == 'admin'
        is_dept_admin = role == 'department_admin' and not is_admin
        if is_dept_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Department officers are restricted to handling department queues and cannot submit citizen complaints.")

        description = serializer.validated_data.get('description', '')
        title = serializer.validated_data.get('title', '')
        user_cat = serializer.validated_data.get('category', 'roads')
        user_priority = serializer.validated_data.get('priority')
        explicit_dept = serializer.validated_data.get('department')
        photo_file = serializer.validated_data.get('photo')

        combined_text = f"{title}. {description}"

        image_b64 = None
        if photo_file:
            try:
                photo_file.seek(0)
                image_b64 = base64.b64encode(photo_file.read()).decode('utf-8')
                photo_file.seek(0)
            except Exception:
                pass

        # Execute AI auto-categorization and priority assessment with separate title and description
        ai_result = call_ai_service(description=description, title=title, image_base64=image_b64, fallback_cat=user_cat)

        from rest_framework.exceptions import ValidationError
        if is_gibberish_or_meaningless(title):
            raise ValidationError({'title': 'Please enter a valid, descriptive title for the civic issue.'})
        if is_gibberish_or_meaningless(description):
            raise ValidationError({'description': 'Please enter a meaningful description of the municipal problem.'})

        # STRICT TOPIC MISMATCH ENFORCEMENT
        if ai_result.get('is_mismatch'):
            raise ValidationError({
                'non_field_errors': [
                    ai_result.get('ai_reasoning', 'Topic Mismatch: Title, description, and photo describe conflicting municipal issues. Please ensure all details refer to the same problem.')
                ]
            })

        # Check if citizen explicitly manually selected category or priority
        manual_cat = self.request.data.get('manual_category') in ['true', True, '1']
        manual_pri = self.request.data.get('manual_priority') in ['true', True, '1']

        raw_cat = self.request.data.get('category')
        raw_priority = self.request.data.get('priority')

        ai_category = ai_result.get('category')
        ai_priority = ai_result.get('priority')

        if manual_cat and raw_cat and raw_cat not in ['auto', 'none', '']:
            final_category = raw_cat
        elif ai_category and ai_category not in ['none', 'null', '']:
            final_category = ai_category
        elif raw_cat and raw_cat not in ['auto', 'none', '']:
            final_category = raw_cat
        else:
            final_category = None

        if not final_category:
            raise ValidationError({
                'category': 'Issue Mismatch: Could not identify a valid municipal civic issue from your input. Please provide a clear description or select a category manually.'
            })

        if manual_pri and raw_priority and raw_priority not in ['auto', 'none', '']:
            final_priority = raw_priority
        elif ai_priority and ai_priority not in ['none', 'null', '']:
            final_priority = ai_priority
        elif raw_priority and raw_priority not in ['auto', 'none', '']:
            final_priority = raw_priority
        else:
            final_priority = 'medium'

        ai_confidence = ai_result.get('confidence', 0.90)
        ai_reasoning = ai_result.get('ai_reasoning', '')

        # Auto-assign department if not explicitly set
        if explicit_dept:
            department = explicit_dept
        else:
            dept_key = final_category if final_category in DEPARTMENT_DEFAULTS else 'other'
            department = get_or_create_department_for_category(dept_key)

        serializer.save(
            submitted_by=self.request.user,
            category=final_category,
            priority=final_priority,
            department=department,
            ai_confidence=ai_confidence,
            ai_reasoning=ai_reasoning,
        )

    def perform_update(self, serializer):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', 'citizen')
        is_admin = user.is_superuser or role == 'admin'
        is_dept_admin = role == 'department_admin' and not is_admin

        instance = serializer.instance
        if is_dept_admin:
            dept = getattr(profile, 'department', None)
            if not dept or instance.department_id != dept.id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only modify issues assigned to your department queue.")

        if not is_admin and not is_dept_admin:
            # Citizens cannot modify resolution status or department notes
            from rest_framework.exceptions import PermissionDenied
            if 'status' in serializer.validated_data or 'department_notes' in serializer.validated_data or 'department' in serializer.validated_data:
                raise PermissionDenied("Citizens cannot alter resolution status or department notes.")

        serializer.save()


    @action(detail=False, methods=['post'], url_path='ai-analyze', permission_classes=[AllowAny])
    def ai_analyze(self, request):
        """Live AI preview for frontend issue creation form."""
        description = request.data.get('description', '')
        title = request.data.get('title', '')
        image_b64 = request.data.get('image')
        category_hint = request.data.get('category')

        analysis = call_ai_service(description=description, title=title, image_base64=image_b64, fallback_cat=category_hint)
        return Response(analysis, status=status.HTTP_200_OK)
