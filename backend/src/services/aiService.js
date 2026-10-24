const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

const DEPARTMENT_DEFAULTS = {
  roads: {
    name: 'Roads & Infrastructure Department',
    code: 'roads',
    email: 'roads@ahmedabadcity.gov.in',
    phone: '+91-79-25391811',
    description: 'Maintains arterial roads, bridges, potholes, footpaths, and flyovers across Ahmedabad.',
    icon: '🛣️',
    head_officer: 'Er. Rajesh Patel (Chief City Engineer)',
  },
  water: {
    name: 'Water Supply & Sewerage Board',
    code: 'water',
    email: 'water@ahmedabadcity.gov.in',
    phone: '+91-79-25391812',
    description: 'Oversees drinking water distribution, pipeline maintenance, storm drains, and sewerage networks.',
    icon: '💧',
    head_officer: 'Er. Meera Shah (Executive Engineer)',
  },
  electricity: {
    name: 'Electricity & Street Lighting Department',
    code: 'electricity',
    email: 'lighting@ahmedabadcity.gov.in',
    phone: '+91-79-25391813',
    description: 'Responsible for public lighting, junction boxes, power line safety, and transformer maintenance.',
    icon: '⚡',
    head_officer: 'Shri Amit Dave (Chief Electrical Engineer)',
  },
  sanitation: {
    name: 'Solid Waste & Sanitation Department',
    code: 'sanitation',
    email: 'cleanliness@ahmedabadcity.gov.in',
    phone: '+91-79-25391814',
    description: 'Handles municipal solid waste management, door-to-door garbage collection, and street sweeping.',
    icon: '🧹',
    head_officer: 'Dr. Hitesh Barot (Health & Sanitation Officer)',
  },
  other: {
    name: 'Public Health & Civic Amenities',
    code: 'health_safety',
    email: 'civic@ahmedabadcity.gov.in',
    phone: '+91-79-25391815',
    description: 'Manages general civic safety, public parks, encroachment control, and environmental sanitation.',
    icon: '🛡️',
    head_officer: 'Smt. Ananya Desai (Civic Commissioner)',
  },
};

const isGibberishOrMeaningless = (text) => {
  if (!text) return true;
  const clean = text.trim().toLowerCase();
  if (clean.length < 4) return true;

  // 4+ repeated identical characters: aaaa, 1111
  if (/(.)\1{3,}/.test(clean)) return true;

  // Keyboard sequence mash
  if (/(asdf|dfgh|ghjk|hjkl|qwerty|werty|zxcv|xcvb|1234|2345|3456)/.test(clean)) return true;

  // 5 or more consecutive consonants
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(clean)) return true;

  const words = clean.match(/[a-z]+/g) || [];
  if (words.length === 0) return true;

  for (const w of words) {
    if (w.length >= 4 && !/[aeiou]/.test(w)) return true;
  }

  const allLetters = words.join('');
  if (allLetters.length >= 6) {
    const vowels = (allLetters.match(/[aeiou]/g) || []).length;
    if (vowels / allLetters.length < 0.18) return true;
  }

  const nonsensePhrases = new Set([
    'test', 'testing', 'hello', 'asdf', 'qwerty', '1234', 'xyz', 'foo bar', 'nothing', 'bla bla',
  ]);
  if (nonsensePhrases.has(clean)) return true;

  return false;
};

const extractSingleCategory = (text) => {
  if (!text || isGibberishOrMeaningless(text)) return null;
  let raw = text.toLowerCase();

  raw = raw
    .replace(/\bpolehole\b/g, 'pothole')
    .replace(/\bpothols\b/g, 'pothole')
    .replace(/\bcrator\b/g, 'crater')
    .replace(/\bbrock\b/g, 'broken')
    .replace(/\bborken\b/g, 'broken')
    .replace(/\bbrokn\b/g, 'broken')
    .replace(/\bstreetlight\b/g, 'street light')
    .replace(/\bkachra\b/g, 'garbage')
    .replace(/\bkuda\b/g, 'garbage')
    .replace(/\bsadak\b/g, 'road')
    .replace(/\brasta\b/g, 'road')
    .replace(/\bkhadda\b/g, 'pothole')
    .replace(/\bbijli\b/g, 'electricity')
    .replace(/\bnalla\b/g, 'drain')
    .replace(/\bpaani\b/g, 'water');

  if (
    /\b(electricity|street light|light pole|electric pole|wire|live wire|hanging wire|cable|high voltage|power cut|power outage|blackout|transformer|spark|sparking|electric shock|short circuit|junction box)\b/.test(raw)
  ) {
    return 'electricity';
  }
  if (
    /\b(pipeline|burst|water|leak|leakage|drain|drainage|gutter|sewer|sewage|drinking water|waterlogged|water shortage|no water|dirty water|tap)\b/.test(raw)
  ) {
    return 'water';
  }
  if (
    /\b(garbage|trash|waste|dustbin|bin|litter|rubbish|dump|dumping|stench|foul smell|rotten|debris|sweeper|dead animal)\b/.test(raw)
  ) {
    return 'sanitation';
  }
  if (
    /\b(pothole|road|asphalt|pavement|crater|footpath|sidewalk|divider|curb|speedbreaker|speed breaker|highway|flyover|bridge|sinkhole|cave in|tar|street crack|broken road)\b/.test(raw)
  ) {
    return 'roads';
  }
  if (
    /\b(stray dog|dog bite|animal|mosquito|dengue|malaria|public park|tree fell|fallen tree|illegal hoarding|banner|encroachment)\b/.test(raw)
  ) {
    return 'other';
  }

  return null;
};

const classifyFallback = (text, title = null, category = null) => {
  const combined = `${title || ''}. ${text || ''}`.trim();
  if (isGibberishOrMeaningless(combined)) {
    return {
      category: null,
      priority: null,
      confidence: 0.0,
      department_code: null,
      department_name: 'None (Unrecognized Issue)',
      ai_reasoning: 'Input does not match any recognized municipal civic problem. Please select a category manually.',
      is_valid_civic_issue: false,
      is_mismatch: false,
    };
  }

  const titleCat = extractSingleCategory(title);
  const descCat = extractSingleCategory(text);

  if (titleCat && descCat && titleCat !== descCat) {
    const tName = DEPARTMENT_DEFAULTS[titleCat]?.name || titleCat;
    const dName = DEPARTMENT_DEFAULTS[descCat]?.name || descCat;
    return {
      category: null,
      priority: null,
      confidence: 0.0,
      department_code: null,
      department_name: 'None (Topic Mismatch)',
      ai_reasoning: `⚠️ Topic Mismatch Detected: Title describes a ${tName} issue while description describes a ${dName} issue. Please align your title and description.`,
      is_valid_civic_issue: false,
      is_mismatch: true,
    };
  }

  const raw = combined.toLowerCase();
  const criticalSignals = [
    'live wire', 'hanging wire', 'spark', 'sparking', 'electric shock',
    'pipeline burst', 'major burst', 'flooding', 'sinkhole', 'cave in',
    'accident', 'accidents', 'emergency', 'fatal', 'short circuit',
  ];
  const highSignals = [
    'deep pothole', 'open manhole', 'no water', 'blackout', 'dark road',
    'pitch dark', 'sewage', 'urgent', 'dangerous', 'hospital', 'school',
    'drain blocked', 'gutter overflow', 'big pothole', 'big road',
  ];
  const lowSignals = [
    'minor', 'small', 'cosmetic', 'faded', 'suggestion', 'litter',
    'routine', 'slow drip', 'small pothole', 'small hole',
  ];

  let priority = 'medium';
  let reasoning = 'Standard municipal service report logged.';

  for (const kw of criticalSignals) {
    if (raw.includes(kw)) {
      priority = 'critical';
      reasoning = `Urgent safety risk detected ('${kw}'). Flagged for emergency response.`;
      break;
    }
  }

  if (priority === 'medium') {
    for (const kw of highSignals) {
      if (raw.includes(kw)) {
        priority = 'high';
        reasoning = `Elevated civic hazard identified ('${kw}'). Prioritized for expedited inspection.`;
        break;
      }
    }
  }

  if (priority === 'medium') {
    for (const kw of lowSignals) {
      if (raw.includes(kw)) {
        priority = 'low';
        reasoning = `Minor civic complaint identified ('${kw}'). Scheduled in routine maintenance queue.`;
        break;
      }
    }
  }

  let cat = descCat || titleCat || extractSingleCategory(raw);
  if (!cat && category && !['other', 'none', 'auto', ''].includes(category)) {
    cat = category;
  }

  if (!cat) {
    return {
      category: null,
      priority: null,
      confidence: 0.0,
      department_code: null,
      department_name: 'None (Unrecognized Issue)',
      ai_reasoning: 'Input does not match any recognized municipal civic problem. Please select a category manually.',
      is_valid_civic_issue: false,
      is_mismatch: false,
    };
  }

  const deptInfo = DEPARTMENT_DEFAULTS[cat] || DEPARTMENT_DEFAULTS.other;

  return {
    category: cat,
    priority,
    confidence: 0.92,
    department_code: deptInfo.code,
    department_name: deptInfo.name,
    ai_reasoning: reasoning,
    is_valid_civic_issue: true,
    is_mismatch: false,
  };
};

const callAiService = async ({ description, title = '', imageBase64 = null, fallbackCat = null }) => {
  try {
    const payload = { description, title };
    if (imageBase64) {
      payload.image = imageBase64;
    }

    const res = await axios.post(`${AI_SERVICE_URL}/classify`, payload, { timeout: 6000 });
    if (res.status === 200 && res.data) {
      return res.data;
    }
  } catch (err) {
    // Notice: Python AI microservice offline or unreachable, fallback smoothly
  }

  return classifyFallback(description, title, fallbackCat);
};

module.exports = {
  DEPARTMENT_DEFAULTS,
  isGibberishOrMeaningless,
  extractSingleCategory,
  classifyFallback,
  callAiService,
};
