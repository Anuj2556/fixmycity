import base64
import io
import os
import re
import sys

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except ImportError:
    def CORS(app, *args, **kwargs):
        pass

from dotenv import load_dotenv
from PIL import Image
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# MobileNetV2 – lazy-loaded with verbose=0 safe inference
# ---------------------------------------------------------------------------
mobilenet_model = None

def _load_mobilenet():
    """Load MobileNetV2 on first use."""
    global mobilenet_model
    if mobilenet_model is None:
        try:
            try:
                from keras.applications.mobilenet_v2 import MobileNetV2
            except ImportError:
                # pyrefly: ignore [missing-import]
                from tensorflow.keras.applications import MobileNetV2
            mobilenet_model = MobileNetV2(weights='imagenet')
            print("[OK] MobileNetV2 loaded successfully")
        except Exception as e:
            print(f"[WARN] Failed to load MobileNetV2: {e}")
    return mobilenet_model

# ---------------------------------------------------------------------------
# Department Configuration
# ---------------------------------------------------------------------------
DEPARTMENTS_CONFIG = {
    'roads': {
        'code': 'roads',
        'name': 'Roads & Infrastructure Department',
        'description': 'Responsible for Ahmedabad road network, pothole repairs, bridges, footpaths, and asphalt paving.',
    },
    'water': {
        'code': 'water',
        'name': 'Water Supply & Sewerage Board',
        'description': 'Manages municipal drinking water distribution, pipeline bursts, sewer lines, and storm drainage.',
    },
    'electricity': {
        'code': 'electricity',
        'name': 'Electricity & Street Lighting Department',
        'description': 'Oversees streetlights, junction boxes, high voltage lines, power outages, and electrical poles.',
    },
    'sanitation': {
        'code': 'sanitation',
        'name': 'Solid Waste & Sanitation Department',
        'description': 'Oversees daily waste collection, garbage overflowing bins, street sweeping, and dumping clearance.',
    },
    'other': {
        'code': 'health_safety',
        'name': 'Public Health & Civic Amenities',
        'description': 'Oversees public safety, open parks, tree falls, mosquito breeding, and general civic concerns.',
    },
}

# ---------------------------------------------------------------------------
# Text Normalization & Typo Correction
# ---------------------------------------------------------------------------
def normalize_civic_text(text):
    """Normalizes typos, common abbreviations, and Hinglish civic vocabulary."""
    if not text:
        return ""
    lower = text.lower()
    
    # Common civic typos
    lower = re.sub(r'\bpolehole\b', 'pothole', lower)
    lower = re.sub(r'\bpothols\b', 'pothole', lower)
    lower = re.sub(r'\bpothol\b', 'pothole', lower)
    lower = re.sub(r'\bpot hole\b', 'pothole', lower)
    lower = re.sub(r'\bcrator\b', 'crater', lower)
    lower = re.sub(r'\bbrock\b', 'broken', lower)
    lower = re.sub(r'\bborken\b', 'broken', lower)
    lower = re.sub(r'\bbrokn\b', 'broken', lower)
    lower = re.sub(r'\bbrok\b', 'broken', lower)
    lower = re.sub(r'\bcrackd\b', 'cracked', lower)
    lower = re.sub(r'\bstreetlight\b', 'street light', lower)
    lower = re.sub(r'\bstreetlights\b', 'street light', lower)
    lower = re.sub(r'\blamppost\b', 'lamp post', lower)
    lower = re.sub(r'\bwatr\b', 'water', lower)
    lower = re.sub(r'\bleekage\b', 'leakage', lower)
    lower = re.sub(r'\blekage\b', 'leakage', lower)
    lower = re.sub(r'\bleking\b', 'leaking', lower)
    lower = re.sub(r'\bleek\b', 'leak', lower)
    lower = re.sub(r'\bdrange\b', 'drainage', lower)
    lower = re.sub(r'\bdrang\b', 'drain', lower)
    lower = re.sub(r'\bsewerage\b', 'sewer', lower)
    lower = re.sub(r'\bsewge\b', 'sewage', lower)
    lower = re.sub(r'\bgarbege\b', 'garbage', lower)
    lower = re.sub(r'\bgarbag\b', 'garbage', lower)
    lower = re.sub(r'\btras\b', 'trash', lower)
    lower = re.sub(r'\bdustbin\b', 'dustbin garbage', lower)
    lower = re.sub(r'\bwier\b', 'wire', lower)
    lower = re.sub(r'\blite\b', 'light', lower)
    lower = re.sub(r'\belectricty\b', 'electricity', lower)
    lower = re.sub(r'\belecticity\b', 'electricity', lower)

    # Indian English & Hinglish terms
    lower = re.sub(r'\bkachra\b', 'garbage waste', lower)
    lower = re.sub(r'\bkuda\b', 'garbage waste', lower)
    lower = re.sub(r'\bsafai\b', 'sanitation cleaning', lower)
    lower = re.sub(r'\bsadak\b', 'road', lower)
    lower = re.sub(r'\brasta\b', 'road', lower)
    lower = re.sub(r'\bkhadda\b', 'pothole', lower)
    lower = re.sub(r'\bgaddha\b', 'pothole', lower)
    lower = re.sub(r'\bbijli\b', 'electricity power', lower)
    lower = re.sub(r'\bbatti\b', 'street light', lower)
    lower = re.sub(r'\bnalla\b', 'drain sewer', lower)
    lower = re.sub(r'\bpaani\b', 'water supply', lower)

    return lower

# ---------------------------------------------------------------------------
# Regex Rule Engine for Precise Civic Classification
# ---------------------------------------------------------------------------
CATEGORY_REGEXES = {
    'roads': [
        r'\bpothole\b', r'\broad\b', r'\basphalt\b', r'\bpavement\b', r'\bcrater\b',
        r'\bfootpath\b', r'\bsidewalk\b', r'\bdivider\b', r'\bcurb\b', r'\bspeedbreaker\b',
        r'\bspeed breaker\b', r'\bhighway\b', r'\bflyover\b', r'\bbridge\b', r'\bsinkhole\b',
        r'\bcave in\b', r'\bcaved in\b', r'\bbroken road\b', r'\btar\b', r'\bdivider broken\b',
        r'\bstreet crack\b', r'\brut\b', r'\buneven surface\b', r'\bmanhole cover\b'
    ],
    'electricity': [
        r'\belectricity\b', r'\bstreet light\b', r'\blamp post\b', r'\blight pole\b',
        r'\belectric pole\b', r'\bwire\b', r'\blive wire\b', r'\bhanging wire\b',
        r'\bcable\b', r'\bhigh voltage\b', r'\bpower cut\b', r'\bpower outage\b',
        r'\bblackout\b', r'\btransformer\b', r'\bspark\b', r'\bsparking\b',
        r'\belectric shock\b', r'\bshort circuit\b', r'\bmeter box\b', r'\bjunction box\b',
        r'\bdark street\b', r'\bpitch dark\b', r'\blamp flickering\b', r'\bno power\b',
        r'\bbulb broken\b'
    ],
    'water': [
        r'\bwater\b', r'\bpipeline\b', r'\bpipe\b', r'\bleak\b', r'\bleakage\b',
        r'\bburst\b', r'\bdrain\b', r'\bdrainage\b', r'\bgutter\b', r'\bsewer\b',
        r'\bsewage\b', r'\bdrinking water\b', r'\bwaterlogged\b', r'\bwaterlogging\b',
        r'\bstagnant water\b', r'\bwater shortage\b', r'\bno water\b', r'\bdirty water\b',
        r'\bwater supply\b', r'\bclean water\b', r'\btap\b', r'\bwater flooding\b'
    ],
    'sanitation': [
        r'\bgarbage\b', r'\btrash\b', r'\bwaste\b', r'\bdustbin\b', r'\bbin\b',
        r'\blitter\b', r'\brubbish\b', r'\bdump\b', r'\bdumping\b', r'\bstench\b',
        r'\bfoul smell\b', r'\brotten\b', r'\bdebris\b', r'\bsweeper\b', r'\bcleaning\b',
        r'\bsolid waste\b', r'\bplastic waste\b', r'\bdead animal\b', r'\bcarcass\b',
        r'\boverflowing bin\b', r'\bunhygienic\b'
    ],
    'other': [
        r'\bstray dog\b', r'\bdog bite\b', r'\banimal\b', r'\brabies\b', r'\bmosquito\b',
        r'\bdengue\b', r'\bmalaria\b', r'\bpublic park\b', r'\btree fell\b',
        r'\bfallen tree\b', r'\btree branch\b', r'\billegal hoarding\b', r'\bbanner\b',
        r'\bencroachment\b', r'\bnoise\b', r'\bpollution\b'
    ]
}

# ---------------------------------------------------------------------------
# Expanded ML Model Training Data
# ---------------------------------------------------------------------------
TRAINING_DATA = {
    'texts': [
        # Roads
        'pothole broken road crack asphalt damage deep crater vehicle damage',
        'road broken street damaged pavement cave in divider broken speedbreaker',
        'bad road condition driving impossible bike slip accident prone road',
        'highway crater footpath collapsed curb damaged road resurfacing needed',
        'tar melted potholes on bridge flyover expansion joint damaged',
        'small pothole patch required on street surface loose gravel',
        'uneven road surface dangerous bump on highway flyover',

        # Water
        'water pipe leaking water supply broken water flooding street pipeline burst',
        'no water supply water shortage contaminated water dirty smell drinking water',
        'underground main pipeline leakage clean water wastage low pressure',
        'open sewer gutter overflow sewage water flooding houses drain blocked',
        'storm water drain choked rainwater stagnation drainage cover broken',
        'water pipeline burst flooding residential area tap water brown',

        # Electricity
        'street light broken dark road lamp post damaged blackout bulb flickering',
        'no electricity power outage transformer spark electric shock hazard',
        'exposed live wire hanging dangling electric pole cable loose high voltage',
        'junction box open short circuit electric wire burning risk',
        'pole leaning falling down street completely pitch black dangerous at night',
        'streetlight not working dark road safety risk transformer sparking',

        # Sanitation
        'garbage trash not collected rubbish pile stench breeding flies rotten waste',
        'dirty street litter illegal dumping municipal bin overflowing rotten food',
        'dead animal carcass on road plastic waste dumping unhygienic condition',
        'sweeper not cleaning dust and debris accumulated commercial waste thrown',
        'construction debris dumping garbage truck missed collection bad smell',
        'dustbin overflowing with municipal waste litter scattered around',

        # Other / Health / Safety
        'stray dog menace bite danger barking tree fell blocking walkway',
        'illegal banner hoarding encroachment park maintenance bench broken',
        'mosquito breeding stagnant water dengue risk public park dirty',
        'encroachment on public property footpath occupied general civic issue',
    ],
    'categories': [
        'roads', 'roads', 'roads', 'roads', 'roads', 'roads', 'roads',
        'water', 'water', 'water', 'water', 'water', 'water',
        'electricity', 'electricity', 'electricity', 'electricity', 'electricity', 'electricity',
        'sanitation', 'sanitation', 'sanitation', 'sanitation', 'sanitation', 'sanitation',
        'other', 'other', 'other', 'other',
    ]
}

vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
X = vectorizer.fit_transform(TRAINING_DATA['texts'])
text_classifier = MultinomialNB()
text_classifier.fit(X, TRAINING_DATA['categories'])

# ---------------------------------------------------------------------------
# ImageNet Synset Civic Mapping
# ---------------------------------------------------------------------------
CATEGORY_MAPPING = {
    # Roads & Infrastructure
    'manhole_cover': 'roads',
    'curb': 'roads',
    'street_sign': 'roads',
    'parking_meter': 'roads',
    'barrier': 'roads',
    'tollbooth': 'roads',
    'cliff': 'roads',
    'quarry': 'roads',
    'trench': 'roads',
    'stone_wall': 'roads',
    'brick': 'roads',
    'gravel': 'roads',
    'mud': 'roads',
    'sandbar': 'roads',
    'breakwater': 'roads',
    'bridge': 'roads',
    'pier': 'roads',
    'steel_arch_bridge': 'roads',
    'suspension_bridge': 'roads',
    'viaduct': 'roads',
    'rail': 'roads',
    'tracks': 'roads',
    'drilling_platform': 'roads',
    'steamroller': 'roads',
    'crane': 'roads',
    'pothole': 'roads',
    'asphalt': 'roads',

    # Electricity & Street Lighting
    'pole': 'electricity',
    'utility_pole': 'electricity',
    'flagpole': 'electricity',
    'traffic_light': 'electricity',
    'spotlight': 'electricity',
    'torch': 'electricity',
    'beacon': 'electricity',
    'lamp': 'electricity',
    'lampshade': 'electricity',
    'table_lamp': 'electricity',
    'lantern': 'electricity',
    'switch': 'electricity',
    'generator': 'electricity',
    'transformer': 'electricity',
    'electric_fan': 'electricity',
    'power_line': 'electricity',
    'solar_dish': 'electricity',

    # Water & Drainage
    'fire_hydrant': 'water',
    'fountain': 'water',
    'water_tower': 'water',
    'dam': 'water',
    'lakeside': 'water',
    'seashore': 'water',
    'swimming_pool': 'water',
    'geyser': 'water',
    'drainage': 'water',
    'pipe': 'water',
    'water_bottle': 'water',
    'water_jug': 'water',
    'canoe': 'water',
    'paddle': 'water',
    'tub': 'water',
    'sink': 'water',
    'bathtub': 'water',

    # Sanitation & Waste
    'ashcan': 'sanitation',
    'trash_can': 'sanitation',
    'garbage_truck': 'sanitation',
    'barrel': 'sanitation',
    'crate': 'sanitation',
    'carton': 'sanitation',
    'packet': 'sanitation',
    'bottle': 'sanitation',
    'can': 'sanitation',
    'plastic_bag': 'sanitation',
    'wrapper': 'sanitation',
    'bucket': 'sanitation',
    'pail': 'sanitation',
    'dump': 'sanitation',
    'bin': 'sanitation',
    'dustbin': 'sanitation',
}

# ---------------------------------------------------------------------------
# Priority Assessment Logic
# ---------------------------------------------------------------------------
CRITICAL_KEYWORDS = [
    'live wire', 'hanging wire', 'spark', 'sparking', 'electric shock', 'high voltage',
    'pipeline burst', 'major burst', 'flooding in house', 'flooded road',
    'sinkhole', 'cave in', 'collapsed bridge', 'fatal', 'accident happened', 'causing accident',
    'accidents', 'emergency', 'fire risk', 'life threatening', 'toxic', 'severe hazard',
    'ambulance blocked', 'short circuit'
]

HIGH_KEYWORDS = [
    'deep pothole', 'large pothole', 'big pothole', 'big road', 'huge pothole', 'massive pothole',
    'open manhole', 'manhole cover missing', 'no water for days',
    'blackout', 'entire street dark', 'pitch dark', 'sewage overflowing', 'dark road',
    'stinking', 'hospital', 'school', 'urgent', 'dangerous', 'major accident',
    'contamination', 'dirty water supply', 'slipping', 'bike skid', 'two wheeler fall',
    'drain blocked', 'gutter overflow'
]

LOW_KEYWORDS = [
    'small pothole', 'small hole', 'minor crack', 'hairline crack', 'faded', 'faded line',
    'dusty', 'suggestion', 'small litter', 'small waste', 'minor trash', 'paint',
    'notice board', 'low priority', 'routine', 'slow drip', 'cosmetic'
]

def determine_priority_and_reasoning(text, category, confidence, image_detail=None, visual_defect_severity=None):
    """
    Accurately evaluates urgency, hazards, and size indicators from description
    and image visual evidence to determine priority and clear explanatory rationale.
    Physical visual evidence acts as ground truth to override exaggerated text claims.
    """
    clean_text = normalize_civic_text(text)
    priority = 'medium'
    rationale = ''

    # 1. Critical Safety & Emergency checks (from description or extreme hazards)
    for kw in CRITICAL_KEYWORDS:
        if kw in clean_text:
            priority = 'critical'
            rationale = f"Urgent safety risk detected ('{kw}'). Flagged for immediate emergency response."
            break

    if priority == 'medium' and category == 'electricity' and any(w in clean_text for w in ['wire', 'spark', 'shock', 'short circuit', 'fire']):
        priority = 'critical'
        rationale = "Exposed electrical infrastructure detected posing electrocution or fire hazard."

    # 2. High Impact & Civic Disruption checks
    if priority == 'medium':
        for kw in HIGH_KEYWORDS:
            if kw in clean_text:
                priority = 'high'
                rationale = f"Elevated civic hazard identified ('{kw}'). Prioritized for expedited inspection."
                break

    if priority == 'medium':
        if category == 'water' and any(w in clean_text for w in ['no water', 'burst', 'sewer', 'sewage', 'dirty']):
            priority = 'high'
            rationale = "Significant civic water or sewerage disruption impacting residential health."
        elif category == 'roads' and any(w in clean_text for w in ['deep', 'crater', 'bike', 'accident', 'dangerous', 'hole', 'big']):
            if not any(w in clean_text for w in ['small', 'minor', 'cosmetic']):
                priority = 'high'
                rationale = "Roadway structural fault posing vehicular damage or traffic hazard."
        elif category == 'electricity' and any(w in clean_text for w in ['dark', 'blackout', 'not working']):
            priority = 'high'
            rationale = "Public lighting failure creating security and transit safety concern."

    # 3. Low Severity / Routine Maintenance checks
    if priority == 'medium':
        for kw in LOW_KEYWORDS:
            if kw in clean_text:
                priority = 'low'
                rationale = f"Minor civic complaint identified ('{kw}'). Scheduled in routine maintenance queue."
                break

        if priority == 'medium' and ('small' in clean_text or 'minor' in clean_text or 'cosmetic' in clean_text):
            priority = 'low'
            rationale = "Minor localized civic issue scheduled in regular departmental service order."

    # 4. Computer Vision Ground Truth Severity Override
    if visual_defect_severity == 'small':
        if priority in ['high', 'critical']:
            priority = 'low'
            rationale = "Visual Ground Truth: Computer vision verification confirms a minor localized road surface defect. Priority downgraded to Low routine maintenance despite exaggerated text claims."
        elif priority == 'medium':
            priority = 'low'
            rationale = "Visual Ground Truth: Road cavity verified as a minor surface defect. Scheduled for routine repair."
    elif visual_defect_severity == 'large':
        if priority in ['low', 'medium']:
            priority = 'high'
            rationale = "Visual Ground Truth: Computer vision detected extensive road depression / major crater. Priority elevated to High."

    # 5. Fallback Default
    if not rationale:
        dept = DEPARTMENTS_CONFIG.get(category, DEPARTMENTS_CONFIG['other'])
        rationale = f"Dispatched directly to {dept['name']} for scheduled inspection."

    # Composite explanation combining visual evidence + description context
    if image_detail:
        full_reasoning = f"Visual Verification: {image_detail}. {rationale}"
    else:
        full_reasoning = rationale

    return priority, full_reasoning


# ---------------------------------------------------------------------------
# Visual Feature Extraction & Image Classification
# ---------------------------------------------------------------------------
def _prepare_image(image_data):
    """Decode a base64 image string into a preprocessed numpy array for MobileNetV2."""
    if ',' in image_data:
        image_data = image_data.split(',', 1)[1]

    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))

    if img.mode != 'RGB':
        img = img.convert('RGB')

    img = img.resize((224, 224))
    img_array = np.array(img)
    return np.expand_dims(img_array, axis=0)


def _detect_visual_heuristics(img_array_single):
    """
    Extracts computer vision color, luminance, and defect cavity signals to corroborate
    classification and ground-truth physical severity.
    img_array_single shape: (224, 224, 3) with values in [0, 255]
    """
    r = img_array_single[:, :, 0].astype(float)
    g = img_array_single[:, :, 1].astype(float)
    b = img_array_single[:, :, 2].astype(float)

    lum = 0.299 * r + 0.587 * g + 0.114 * b
    mean_lum = float(np.mean(lum))

    # Asphalt / Road gray surface detection: pixels where R, G, B are closely clustered and low-medium saturation
    diff_rg = np.abs(r - g)
    diff_gb = np.abs(g - b)
    diff_rb = np.abs(r - b)
    is_gray = (diff_rg < 25) & (diff_gb < 25) & (diff_rb < 25) & (lum > 25) & (lum < 210)
    asphalt_pixels = int(np.sum(is_gray))
    total_pixels = 224 * 224
    asphalt_ratio = float(asphalt_pixels / total_pixels)

    # Defect cavity analysis on roadway
    pothole_defect_ratio = 0.0
    defect_severity = 'none'
    if asphalt_pixels > (0.25 * total_pixels):
        road_lum = lum[is_gray]
        med_lum = float(np.median(road_lum))
        # Defect cavity / pothole interior shows as a distinct shadow / dark depression relative to median road surface
        pothole_mask = is_gray & (lum < (med_lum - 30))
        pothole_pixels = int(np.sum(pothole_mask))
        pothole_defect_ratio = float(pothole_pixels / total_pixels)

        if pothole_defect_ratio < 0.045:
            defect_severity = 'small'
        elif pothole_defect_ratio < 0.16:
            defect_severity = 'medium'
        else:
            defect_severity = 'large'

    # Water hue detection: blueish tones
    is_water = (b > r + 15) & (b > g - 10)
    water_ratio = float(np.sum(is_water) / total_pixels)

    return {
        'luminance': mean_lum,
        'asphalt_ratio': asphalt_ratio,
        'water_ratio': water_ratio,
        'pothole_defect_ratio': pothole_defect_ratio,
        'defect_severity': defect_severity,
        'is_night': mean_lum < 40.0,
        'is_asphalt_road': asphalt_ratio > 0.35,
    }


def classify_image(img_array):
    """
    Classify image using MobileNetV2 with verbose=0 safe inference + visual heuristics.
    Returns: (category, confidence, detail, heuristics)
    """
    heuristics = {}
    try:
        heuristics = _detect_visual_heuristics(img_array[0])
        model = _load_mobilenet()
        if model is None:
            # Fallback to visual heuristics
            if heuristics['is_asphalt_road']:
                detail = f"Asphalt roadway surface verified (severity: {heuristics['defect_severity']})"
                return 'roads', 0.85, detail, heuristics
            if heuristics['water_ratio'] > 0.3:
                return 'water', 0.82, 'Water surface visually detected', heuristics
            if heuristics['is_night']:
                return 'electricity', 0.80, 'Low-light nocturnal scene (streetlight check)', heuristics
            return None, 0.0, 'Image could not be identified as a civic issue', heuristics

        try:
            from keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
        except ImportError:
            # pyrefly: ignore [missing-import]
            from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions

        img_preprocessed = preprocess_input(img_array.copy().astype('float32'))
        predictions = model.predict(img_preprocessed, verbose=0)
        decoded = decode_predictions(predictions, top=5)[0]

        for _, label, confidence in decoded:
            label_lower = label.lower()
            for key, category in CATEGORY_MAPPING.items():
                if key in label_lower:
                    boosted_conf = float(confidence)
                    if category == 'roads' and heuristics['is_asphalt_road']:
                        boosted_conf = max(boosted_conf, 0.92)
                        detail = f"Visual features matched '{label}' on roadway (defect: {heuristics['defect_severity']})"
                    else:
                        detail = f"Visual features matched '{label}'"
                    return category, boosted_conf, detail, heuristics

        # If ImageNet labels didn't match directly, rely on visual texture heuristics
        if heuristics['is_asphalt_road']:
            sev = heuristics['defect_severity']
            p_pct = heuristics['pothole_defect_ratio'] * 100
            if sev == 'small':
                detail = f"Asphalt roadway verified with minor surface cavity (coverage: {p_pct:.1f}%)"
            elif sev == 'medium':
                detail = f"Asphalt roadway verified with moderate pothole cavity (coverage: {p_pct:.1f}%)"
            elif sev == 'large':
                detail = f"Asphalt roadway verified with severe crater cavity (coverage: {p_pct:.1f}%)"
            else:
                detail = "Asphalt roadway surface verified through texture analysis"
            return 'roads', 0.86, detail, heuristics

        if heuristics['water_ratio'] > 0.30:
            return 'water', 0.82, 'Water body / pooled liquid features detected', heuristics
        if heuristics['is_night']:
            return 'electricity', 0.78, 'Night darkness profile detected (streetlight infrastructure)', heuristics

        top_label = decoded[0][1] if decoded else 'unrecognized scene'
        # Do NOT force non-civic scene into roads!
        return None, 0.0, f"Unrecognized non-civic scene ('{top_label}')", heuristics

    except Exception as e:
        print(f"Image classification error: {e}")
        # Safe fallback based on array inspection
        try:
            if not heuristics:
                heuristics = _detect_visual_heuristics(img_array[0])
            if heuristics['is_asphalt_road']:
                return 'roads', 0.85, 'Asphalt surface identified', heuristics
        except Exception:
            pass
        return None, 0.0, 'Image could not be identified as a civic issue', heuristics


# ---------------------------------------------------------------------------
# Text Classification with Regex Priority + Naive Bayes
# ---------------------------------------------------------------------------
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


def classify_text(text):
    """
    Classifies text with normalized regex keyword matching, typo correction,
    and Naive Bayes fallback only if meaningful civic vocabulary is present.
    """
    try:
        if not text or len(text.strip()) == 0 or is_gibberish_or_meaningless(text):
            return None, 0.0

        norm_text = normalize_civic_text(text)

        # 1. Regex rule scoring
        scores = {'roads': 0, 'water': 0, 'electricity': 0, 'sanitation': 0, 'other': 0}
        for cat, patterns in CATEGORY_REGEXES.items():
            for pat in patterns:
                matches = re.findall(pat, norm_text)
                if matches:
                    scores[cat] += len(matches) * 2

        best_cat = max(scores, key=scores.get)
        if scores[best_cat] > 0:
            conf = min(0.90 + (scores[best_cat] * 0.03), 0.99)
            return best_cat, conf

        # 2. Scikit-learn Naive Bayes fallback ONLY IF civic vocabulary was present
        X_text = vectorizer.transform([norm_text])
        if X_text.nnz == 0:
            # Zero vocabulary matches: text has nothing to do with municipal issues!
            # Do NOT guess roads!
            return None, 0.0

        prediction = text_classifier.predict(X_text)[0]
        confidence = float(text_classifier.predict_proba(X_text).max())

        if confidence < 0.35:
            return None, 0.0

        return prediction, max(confidence, 0.70)

    except Exception as e:
        print(f"Text classification error: {e}")
        return None, 0.0


def build_response(category, confidence, text='', image_pred=None, text_pred=None, image_detail=None, visual_defect_severity=None, is_mismatch=False, mismatch_reason=None):
    """Packages comprehensive classification response with department and priority."""
    if is_mismatch:
        return {
            'category': None,
            'confidence': 0.0,
            'priority': None,
            'department_code': None,
            'department_name': 'None (Topic Mismatch)',
            'department_description': 'Title, description, and image describe conflicting municipal civic issues.',
            'ai_reasoning': f"⚠️ Topic Mismatch Detected: {mismatch_reason or 'Title, description, and photo describe conflicting municipal issues.'} Please align your title, description, and photo.",
            'is_valid_civic_issue': False,
            'is_mismatch': True,
            'image_prediction': image_pred,
            'text_prediction': text_pred,
        }

    if not category or category in ['none', 'null']:
        return {
            'category': None,
            'confidence': 0.0,
            'priority': None,
            'department_code': None,
            'department_name': 'None (Unrecognized Issue)',
            'department_description': 'No municipal category matched. Please provide a clear civic description or select manually.',
            'ai_reasoning': 'Input does not match any recognized civic problem in Ahmedabad (Roads, Water, Electricity, Sanitation). Please provide a clearer description or select a category.',
            'is_valid_civic_issue': False,
            'is_mismatch': False,
            'image_prediction': image_pred,
            'text_prediction': text_pred,
        }

    dept_info = DEPARTMENTS_CONFIG.get(category, DEPARTMENTS_CONFIG['other'])
    priority, reasoning = determine_priority_and_reasoning(
        text, category, confidence,
        image_detail=image_detail,
        visual_defect_severity=visual_defect_severity
    )

    res = {
        'category': category,
        'confidence': round(float(confidence), 3),
        'priority': priority,
        'department_code': dept_info['code'],
        'department_name': dept_info['name'],
        'department_description': dept_info['description'],
        'ai_reasoning': reasoning,
        'is_valid_civic_issue': True,
        'is_mismatch': False,
    }

    if image_pred:
        res['image_prediction'] = image_pred
    if text_pred:
        res['text_prediction'] = text_pred

    return res


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    model_status = 'loaded' if mobilenet_model is not None else 'lazy_load'
    return jsonify({
        'status': 'AI Service is running',
        'city': 'Ahmedabad',
        'model_status': model_status,
        'departments': list(DEPARTMENTS_CONFIG.keys())
    }), 200


@app.route('/classify', methods=['POST'])
def classify():
    """
    Multimodal classification combining title, description, and image to accurately assign
    category, priority, and department. Detects topic mismatches across fields and modalities,
    and applies image visual defect ground truth to override exaggerated text urgency.
    """
    try:
        data = request.json or {}
        image_data = data.get('image')
        description = (data.get('description') or '').strip()
        title = (data.get('title') or '').strip()

        if not image_data and not description and not title:
            return jsonify({'error': 'Please provide either an image, title, or description'}), 400

        # Classify image if provided
        image_category, image_confidence, img_detail, heuristics = None, 0.0, None, {}
        if image_data:
            try:
                img_array = _prepare_image(image_data)
                image_category, image_confidence, img_detail, heuristics = classify_image(img_array)
            except Exception as e:
                print(f"Failed to process image: {e}")

        visual_defect_severity = heuristics.get('defect_severity') if heuristics else None

        # Classify title independently
        title_category, title_confidence = None, 0.0
        if title:
            title_category, title_confidence = classify_text(title)

        # Classify description independently
        desc_category, desc_confidence = None, 0.0
        if description:
            desc_category, desc_confidence = classify_text(description)

        combined_text = f"{title}. {description}".strip()

        # -------------------------------------------------------------
        # TOPIC MISMATCH DETECTION
        # -------------------------------------------------------------
        is_mismatch = False
        mismatch_reason = None

        # Check 1: Cross-field text mismatch (Title vs Description)
        # e.g. Title is "pipe leakage" (water) while Description is "big road broken" (roads)
        if title_category and desc_category and title_category != desc_category:
            is_mismatch = True
            t_name = DEPARTMENTS_CONFIG.get(title_category, {}).get('name', title_category)
            d_name = DEPARTMENTS_CONFIG.get(desc_category, {}).get('name', desc_category)
            mismatch_reason = f"Title describes a {t_name} issue while description describes a {d_name} issue."

        # Check 2: Cross-modal mismatch (Text vs Image)
        # e.g. Photo shows roadway/pothole (roads) while title/description describes water pipe or electricity
        if not is_mismatch and image_category and image_confidence >= 0.70:
            img_name = DEPARTMENTS_CONFIG.get(image_category, {}).get('name', image_category)
            if title_category and title_category != image_category:
                is_mismatch = True
                t_name = DEPARTMENTS_CONFIG.get(title_category, {}).get('name', title_category)
                mismatch_reason = f"Uploaded photo shows {img_name} features, but title describes {t_name}."
            elif desc_category and desc_category != image_category:
                is_mismatch = True
                d_name = DEPARTMENTS_CONFIG.get(desc_category, {}).get('name', desc_category)
                mismatch_reason = f"Uploaded photo shows {img_name} features, but description describes {d_name}."

        if is_mismatch:
            response_data = build_response(
                category=None,
                confidence=0.0,
                text=combined_text,
                image_pred={'category': image_category, 'confidence': round(image_confidence, 3), 'detail': img_detail} if image_data else None,
                text_pred={'category': desc_category or title_category, 'confidence': round(desc_confidence or title_confidence, 3)} if (description or title) else None,
                image_detail=img_detail,
                is_mismatch=True,
                mismatch_reason=mismatch_reason
            )
            response_data['mismatch_details'] = {
                'title_category': title_category,
                'description_category': desc_category,
                'image_category': image_category,
            }
            return jsonify(response_data), 200

        # -------------------------------------------------------------
        # Category Consensus Determination (When No Mismatch)
        # -------------------------------------------------------------
        if image_category and image_confidence >= 0.58:
            final_category = image_category
            final_confidence = image_confidence
            if desc_category == image_category or title_category == image_category:
                final_confidence = min(0.99, max(image_confidence, 0.92) + 0.06)
        elif desc_category and desc_confidence >= 0.70:
            final_category = desc_category
            final_confidence = desc_confidence
        elif title_category and title_confidence >= 0.70:
            final_category = title_category
            final_confidence = title_confidence
        elif image_category:
            final_category = image_category
            final_confidence = image_confidence
        elif desc_category:
            final_category = desc_category
            final_confidence = desc_confidence
        elif title_category:
            final_category = title_category
            final_confidence = title_confidence
        else:
            final_category = None
            final_confidence = 0.0

        response_data = build_response(
            category=final_category,
            confidence=final_confidence,
            text=combined_text,
            image_pred={'category': image_category, 'confidence': round(image_confidence, 3), 'detail': img_detail} if image_data else None,
            text_pred={'category': desc_category or title_category, 'confidence': round(desc_confidence or title_confidence, 3)} if (description or title) else None,
            image_detail=img_detail,
            visual_defect_severity=visual_defect_severity,
            is_mismatch=False
        )

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/classify-image', methods=['POST'])
def classify_image_only():
    """Classify based on uploaded image."""
    try:
        data = request.json or {}
        image_data = data.get('image')

        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        img_array = _prepare_image(image_data)
        category, confidence, detail, heuristics = classify_image(img_array)

        response_data = build_response(
            category=category,
            confidence=confidence,
            text='',
            image_pred={'category': category, 'confidence': round(confidence, 3), 'detail': detail},
            image_detail=detail,
            visual_defect_severity=heuristics.get('defect_severity') if heuristics else None
        )

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/classify-text', methods=['POST'])
def classify_text_only():
    """Classify based on text description."""
    try:
        data = request.json or {}
        description = data.get('description', '')

        if not description:
            return jsonify({'error': 'No description provided'}), 400

        category, confidence = classify_text(description)

        response_data = build_response(
            category=category,
            confidence=confidence,
            text=description,
            text_pred={'category': category, 'confidence': round(confidence, 3)}
        )

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[OK] FixMyCity AI Intelligence Service running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
