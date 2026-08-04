import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API, { clearAuth } from '../services/api';
import GeocodingService from '../services/geocoding';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
    category: 'roads',
    latitude: 23.0225,
    longitude: 72.5714,
  });
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleCategorySelect = (category) => {
    setFormData({ ...formData, category });
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
    } catch (error) {
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
    // Ensure selected location is within Ahmedabad
    try {
      const locCheck = await GeocodingService.getLocationName(formData.latitude, formData.longitude);
      if (locCheck === 'Outside Ahmedabad') {
        setMessage('❌ Please select a location within Ahmedabad before submitting.');
        setMessageType('error');
        setLoading(false);
        return;
      }
    } catch (err) {
      // ignore and proceed; backend will validate
    }
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('department', 1);
      if (photo) {
        submitData.append('photo', photo);
      }

      await API.post('/issues/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('✅ Your issue has been submitted successfully! We\'ll review it shortly and route it to the appropriate department.');
      setMessageType('success');
      setFormData({
        title: '',
        description: '',
        category: 'roads',
        latitude: 23.0225,
        longitude: 72.5714,
      });
      setPhoto(null);
      setLocationName('');

      setTimeout(() => navigate('/issues'), 2000);
    } catch (err) {
      setMessage('❌ Failed to submit issue. Please check all fields and try again.');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    clearAuth();
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 0);
  };

  const categories = [
    { value: 'roads', emoji: '🛣️', label: 'Roads' },
    { value: 'water', emoji: '💧', label: 'Water' },
    { value: 'electricity', emoji: '⚡', label: 'Electricity' },
    { value: 'sanitation', emoji: '🧹', label: 'Sanitation' },
    { value: 'other', emoji: '📋', label: 'Other' },
  ];

  return (
    <div className={styles.body}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Report an Issue</h1>
          <p className={styles.subtitle}>Help us make your city better. Tell us about problems you've spotted.</p>
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
                placeholder="e.g., Big pothole on Main Street"
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
                placeholder="Provide details about the issue... What's broken? When did you notice it? Any safety concerns?"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Category <span className={styles.required}>*</span>
              </label>
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

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Location <span className={styles.required}>*</span>
              </label>

              <div className={styles.locationSearchContainer}>
                <input
                  className={styles.locationSearchInput}
                  type="text"
                  placeholder="🔍 Search location... e.g., Main Street, Central Park"
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
                  <Popup>Issue Location</Popup>
                </Marker>
                <LocationPicker onLocationSelect={handleLocationSelect} />
                <MapRecenter lat={formData.latitude} lng={formData.longitude} />
              </MapContainer>

              <div className={styles.locationInfo}>
                📍 {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
              </div>
              <p className={styles.mapHint}>Click on the map to pin location or search above</p>
            </div>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Issue Report'}
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