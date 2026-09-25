import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API, { analyzeIssueWithAI } from '../services/api';
import GeocodingService from '../services/geocoding';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SparklesIcon } from '../components/common/Icons';
import styles from './SubmitIssue.module.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

function SubmitIssue() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '', // By default nothing is selected; user can select or AI will auto-select
    priority: 'medium',
    latitude: 23.0225,
    longitude: 72.5714,
  });
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);
  const [userSelectedPriority, setUserSelectedPriority] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const typingTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (name === 'title' || name === 'description') {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        if (updated.title.trim().length > 3 || updated.description.trim().length > 5) {
          triggerAiAnalysis(updated.title, updated.description, photoBase64, updated.category);
        }
      }, 400);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
        triggerAiAnalysis(formData.title, formData.description, reader.result, formData.category);
      };
      reader.readAsDataURL(file);
    }
  };

  const isGibberish = (text) => {
    if (!text) return true;
    const clean = text.trim().toLowerCase();
    if (clean.length < 4) return true;
    if (/(.)\1{3,}/.test(clean)) return true;
    if (/(asdf|dfgh|ghjk|hjkl|qwerty|werty|zxcv|xcvb|1234|2345|3456)/.test(clean)) return true;
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
    const filler = ['test', 'testing', 'hello', 'asdf', 'qwerty', '1234', 'xyz', 'foo bar', 'nothing', 'bla bla'];
    if (filler.includes(clean)) return true;
    return false;
  };

  const triggerAiAnalysis = async (title, desc, imgB64, cat) => {
    if (!title && !desc && !imgB64) return;
    setAiAnalyzing(true);
    try {
      const result = await analyzeIssueWithAI({
        title: title || formData.title,
        description: desc || formData.description,
        image: imgB64 || photoBase64,
        category: cat || (userSelectedCategory ? formData.category : ''),
      });
      setAiAnalysis(result);

      // Handle Topic Mismatch or Normal Selection
      if (result?.is_mismatch) {
        setUserSelectedCategory(false);
        setFormData((prev) => ({
          ...prev,
          category: '',
        }));
      } else if (!userSelectedCategory) {
        if (result && result.category && result.category !== 'none') {
          setFormData((prev) => ({
            ...prev,
            category: result.category,
            priority: (!userSelectedPriority && result.priority) ? result.priority : (prev.priority || 'medium'),
          }));
        } else {
          // If AI could not identify (NONE), do NOT select anything!
          setFormData((prev) => ({
            ...prev,
            category: '',
          }));
        }
      }
    } catch (err) {
      console.error('AI preview error:', err);
    }
    setAiAnalyzing(false);
  };

  const handleCategorySelect = (category) => {
    setUserSelectedCategory(true);
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleResetToAi = () => {
    setUserSelectedCategory(false);
    setUserSelectedPriority(false);
    if (aiAnalysis?.category && aiAnalysis.category !== 'none') {
      setFormData((prev) => ({
        ...prev,
        category: aiAnalysis.category,
        priority: aiAnalysis.priority || prev.priority || 'medium',
      }));
    } else {
      setFormData((prev) => ({ ...prev, category: '' }));
    }
  };

  // Search location
  const handleSearchLocation = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await GeocodingService.searchLocation(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
    setSearchLoading(false);
  };

  // Select location from search results
  const handleSelectLocation = async (result) => {
    setFormData({
      ...formData,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setLocationName(result.name);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    setSearchLoading(true);
    try {
      const location = await GeocodingService.getCurrentLocation();
      setFormData({
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      const name = await GeocodingService.getLocationName(
        location.latitude,
        location.longitude
      );
      setLocationName(name);
      if (name === 'Outside Ahmedabad') {
        setMessage('❌ Please select a location within Ahmedabad.');
        setMessageType('error');
      } else {
        setMessage('');
        setMessageType('');
      }
    } catch {
      setMessage('❌ Could not get your location. Please allow location access.');
      setMessageType('error');
    }
    setSearchLoading(false);
  };

  // Handle location pin on map
  const handleLocationSelect = async (lat, lng) => {
    setFormData({ ...formData, latitude: lat, longitude: lng });
    const name = await GeocodingService.getLocationName(lat, lng);
    setLocationName(name);
    if (name === 'Outside Ahmedabad') {
      setMessage('❌ Please select a location within Ahmedabad.');
      setMessageType('error');
    } else {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const locCheck = await GeocodingService.getLocationName(formData.latitude, formData.longitude);
      if (locCheck === 'Outside Ahmedabad') {
        setMessage('❌ Please select a location within Ahmedabad before submitting.');
        setMessageType('error');
        setLoading(false);
        return;
      }
    } catch {
      // Backend validates bounding box
    }

    if (isGibberish(formData.title)) {
      setMessage('❌ Invalid Input: Please enter a meaningful title describing a civic issue.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (isGibberish(formData.description)) {
      setMessage('❌ Invalid Input: Please enter a meaningful description of the municipal problem.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // STRICT TOPIC MISMATCH CHECK
    if (aiAnalysis?.is_mismatch) {
      setMessage(`❌ ${aiAnalysis.ai_reasoning || 'Topic Mismatch: Title, description, and photo describe conflicting municipal issues. Please ensure all details refer to the same problem.'}`);
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Determine category: user selected, or AI selected
    const chosenCategory = formData.category || (aiAnalysis?.category && aiAnalysis.category !== 'none' ? aiAnalysis.category : null);
    if (!chosenCategory) {
      setMessage('❌ Issue Mismatch: Unable to identify a municipal issue from your input. Please provide a clear description of the problem or manually select a category below before submitting.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', chosenCategory);
      submitData.append('priority', formData.priority || aiAnalysis?.priority || 'medium');
      submitData.append('manual_category', userSelectedCategory ? 'true' : 'false');
      submitData.append('manual_priority', userSelectedPriority ? 'true' : 'false');
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      if (photo) {
        submitData.append('photo', photo);
      }

      const res = await API.post('/issues/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const assignedDeptName = res.data?.department_name || aiAnalysis?.department_name || 'Appropriate Municipal Department';
      const assignedPriority = (res.data?.priority || aiAnalysis?.priority || 'Medium').toUpperCase();

      setMessage(`✅ Issue submitted successfully! AI classified priority as '${assignedPriority}' and routed directly to '${assignedDeptName}'.`);
      setMessageType('success');
      setFormData({
        title: '',
        description: '',
        category: '', // Reset to nothing selected
        priority: 'medium',
        latitude: 23.0225,
        longitude: 72.5714,
      });
      setUserSelectedCategory(false);
      setUserSelectedPriority(false);
      setPhoto(null);
      setPhotoBase64(null);
      setAiAnalysis(null);
      setLocationName('');

      setTimeout(() => navigate('/issues'), 2500);
    } catch (err) {
      console.error('Issue submission error:', err);
      if (err.response?.status === 401) {
        setMessage('❌ Your session has expired or you are not logged in. Please sign in to submit.');
      } else if (err.response?.data) {
        const errData = err.response.data;
        const msg = typeof errData === 'object'
          ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : String(errData);
        setMessage(`❌ Submission Error: ${msg}`);
      } else {
        setMessage('❌ Failed to submit issue. Please check all fields and try again.');
      }
      setMessageType('error');
    }
    setLoading(false);
  };

  const categories = [
    { value: 'roads', emoji: '🛣️', label: 'Roads & Bridges' },
    { value: 'water', emoji: '💧', label: 'Water & Sewage' },
    { value: 'electricity', emoji: '⚡', label: 'Electricity & Lights' },
    { value: 'sanitation', emoji: '🧹', label: 'Waste & Sanitation' },
    { value: 'other', emoji: '🛡️', label: 'Public Health' },
  ];

  return (
    <div className={styles.body}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Report an Issue</h1>
          <p className={styles.subtitle}>Help make Ahmedabad cleaner, safer, and better with AI-assisted automatic dispatch.</p>
        </div>

        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Issue Title <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                type="text"
                name="title"
                placeholder="e.g., Deep pothole causing accidents near Vastrapur Lake"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Description <span className={styles.required}>*</span>
              </label>
              <textarea
                className={`${styles.input} ${styles.textarea || ''}`}
                name="description"
                placeholder="Provide details about the issue... What is broken? Any severe hazards, live wires, flooding, or accidents?"
                value={formData.description}
                onChange={handleChange}
                onBlur={() => triggerAiAnalysis(formData.title, formData.description, photoBase64, formData.category)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Upload Photo</label>
              <input
                className={styles.input}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {photo && (
                <div className={styles.fileName}>📷 {photo.name}</div>
              )}
            </div>

            {/* AI Intelligence Live Analysis Card */}
            {(aiAnalyzing || aiAnalysis) && (
              <div className={styles.aiCard}>
                <div className={styles.aiHeader}>
                  <div className={styles.aiTitle}>
                    <SparklesIcon size={16} />
                    <span>AMC AI Triage & Routing Engine</span>
                  </div>
                  <span
                    className={styles.aiBadge}
                    style={aiAnalysis && (!aiAnalysis.category || aiAnalysis.category === 'none') ? {
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.4)'
                    } : {}}
                  >
                    {aiAnalyzing
                      ? 'Analyzing Inputs...'
                      : !aiAnalysis?.category || aiAnalysis.category === 'none'
                        ? '⚠️ Unrecognized Input'
                        : `Precision: ${(aiAnalysis.confidence * 100).toFixed(0)}%`}
                  </span>
                </div>

                {aiAnalysis && (
                  <>
                    <div className={styles.aiGrid}>
                      <div className={styles.aiStat}>
                        <div className={styles.aiStatLabel}>Detected Category</div>
                        <div className={styles.aiStatValue} style={{
                          color: aiAnalysis.category && aiAnalysis.category !== 'none' ? 'inherit' : '#ef4444'
                        }}>
                          {aiAnalysis.category && aiAnalysis.category !== 'none'
                            ? aiAnalysis.category.toUpperCase()
                            : 'NONE'}
                        </div>
                      </div>

                      <div className={styles.aiStat}>
                        <div className={styles.aiStatLabel}>Assigned Priority</div>
                        <div className={styles.aiStatValue} style={{
                          color: !aiAnalysis.category || aiAnalysis.category === 'none'
                            ? '#94a3b8'
                            : aiAnalysis.priority === 'critical'
                              ? '#ef4444'
                              : aiAnalysis.priority === 'high'
                                ? '#f97316'
                                : aiAnalysis.priority === 'low'
                                  ? '#10b981'
                                  : '#f59e0b'
                        }}>
                          {aiAnalysis.category && aiAnalysis.category !== 'none' && aiAnalysis.priority
                            ? aiAnalysis.priority.toUpperCase()
                            : 'NONE'}
                        </div>
                      </div>

                      <div className={styles.aiStat}>
                        <div className={styles.aiStatLabel}>Assigned Department</div>
                        <div className={styles.aiStatValue} style={{
                          color: aiAnalysis.category && aiAnalysis.category !== 'none' ? 'inherit' : '#ef4444',
                          fontSize: (!aiAnalysis.category || aiAnalysis.category === 'none') ? '13px' : undefined
                        }}>
                          {aiAnalysis.category && aiAnalysis.category !== 'none'
                            ? aiAnalysis.department_name
                            : 'None (Unrecognized Issue)'}
                        </div>
                      </div>
                    </div>

                    <div className={styles.aiReasoning}>
                      <strong>AI Triage Insights:</strong> {aiAnalysis.ai_reasoning}
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{
                        fontSize: '12px',
                        color: aiAnalysis.is_mismatch || (!aiAnalysis.category || aiAnalysis.category === 'none')
                          ? '#ef4444'
                          : userSelectedCategory
                            ? '#f59e0b'
                            : '#10b981',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {aiAnalysis.is_mismatch
                          ? '⚠️ Topic Mismatch: Title, description, and photo describe conflicting issues. Alignment required.'
                          : (!aiAnalysis.category || aiAnalysis.category === 'none')
                            ? '⚠️ Unrecognized Civic Issue: No municipal category detected. Please describe your civic issue or select below.'
                            : !userSelectedCategory
                              ? '✨ Auto-applied to this report'
                              : '⚙️ Custom manual override selected'}
                      </span>
                      {userSelectedCategory && aiAnalysis.category && aiAnalysis.category !== 'none' && (
                        <button
                          type="button"
                          className={styles.aiActionBtn}
                          style={{ margin: 0, background: '#4b5563' }}
                          onClick={handleResetToAi}
                        >
                          Re-sync with AI Recommendation
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <label className={styles.label} style={{ margin: 0 }}>
                  Category <span className={styles.required}>*</span>
                </label>
                {formData.category ? (
                  <span style={{ fontSize: '12px', color: userSelectedCategory ? '#3b82f6' : '#10b981', fontWeight: 700 }}>
                    {userSelectedCategory ? '✓ Manually Selected' : '✨ AI Auto-Selected'}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    (None selected — AI will detect or tap below)
                  </span>
                )}
              </div>
              <div className={styles.categoryGrid}>
                {categories.map((cat) => (
                  <div
                    key={cat.value}
                    className={`${styles.categoryOption} ${formData.category === cat.value ? styles.categoryOptionSelected : ''}`}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    <div className={styles.categoryEmoji}>{cat.emoji}</div>
                    <div className={styles.categoryLabel}>{cat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Location in Ahmedabad <span className={styles.required}>*</span>
              </label>

              <div className={styles.locationSearchContainer}>
                <input
                  className={styles.locationSearchInput}
                  type="text"
                  placeholder="🔍 Search location in Ahmedabad (e.g. Navrangpura, SG Highway, Bopal)..."
                  value={searchQuery}
                  onChange={handleSearchLocation}
                />
                <button
                  type="button"
                  className={styles.geolocateBtn}
                  onClick={handleGetCurrentLocation}
                  disabled={searchLoading}
                  title="Use my current location"
                >
                  📍
                </button>

                {showSearchResults && searchResults.length > 0 && (
                  <div className={styles.searchResultsDropdown}>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className={styles.searchResultItem}
                        onClick={() => handleSelectLocation(result)}
                      >
                        <div className={styles.resultName}>{result.name}</div>
                        <div className={styles.resultCoords}>
                          {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {locationName && (
                <div className={styles.selectedLocation}>
                  ✅ <strong>{locationName}</strong>
                </div>
              )}

              <MapContainer
                center={[formData.latitude, formData.longitude]}
                zoom={13}
                className={styles.map}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={[formData.latitude, formData.longitude]}>
                  <Popup>Selected Location: {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E</Popup>
                </Marker>
                <LocationPicker onLocationSelect={handleLocationSelect} />
                <MapRecenter lat={formData.latitude} lng={formData.longitude} />
              </MapContainer>

              <div className={styles.locationInfo}>
                📍 {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
              </div>
              <p className={styles.mapHint}>Click on the map or search to pin location in Ahmedabad</p>
            </div>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting & Routing to Department...' : '🚀 Submit Issue Report'}
            </button>
          </form>

          {message && (
            <div className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmitIssue;
