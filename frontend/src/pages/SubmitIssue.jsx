import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../services/api';
import GeocodingService from '../services/geocoding';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

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
    localStorage.removeItem('token');
    navigate('/login');
  };

  const categories = [
    { value: 'roads', emoji: '🛣️', label: 'Roads' },
    { value: 'water', emoji: '💧', label: 'Water' },
    { value: 'electricity', emoji: '⚡', label: 'Electricity' },
    { value: 'sanitation', emoji: '🧹', label: 'Sanitation' },
    { value: 'other', emoji: '📋', label: 'Other' },
  ];

  return (
    <div style={styles.body}>
      {/* NAVBAR */}
      <Navbar userType="citizen" />


      {/* MAIN CONTAINER */}
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.headerSection}>
          <h1 style={styles.title}>Report an Issue</h1>
          <p style={styles.subtitle}>Help us make your city better. Tell us about problems you've spotted.</p>
        </div>

        {/* FORM CARD */}
        <div style={styles.formCard}>
          <form onSubmit={handleSubmit}>
            {/* TITLE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Issue Title <span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                type="text"
                name="title"
                placeholder="e.g., Big pothole on Main Street"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Description <span style={styles.required}>*</span>
              </label>
              <textarea
                style={{ ...styles.input, minHeight: '110px' }}
                name="description"
                placeholder="Provide details about the issue... What's broken? When did you notice it? Any safety concerns?"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* CATEGORY */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Category <span style={styles.required}>*</span>
              </label>
              <div style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <div
                    key={cat.value}
                    style={{
                      ...styles.categoryOption,
                      ...(formData.category === cat.value ? styles.categoryOptionSelected : {}),
                    }}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    <div style={styles.categoryEmoji}>{cat.emoji}</div>
                    <div style={styles.categoryLabel}>{cat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PHOTO UPLOAD */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Photo</label>
              <input
                style={styles.input}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {photo && (
                <div style={styles.fileName}>📷 {photo.name}</div>
              )}
            </div>

            {/* LOCATION SEARCH & MAP */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Location <span style={styles.required}>*</span>
              </label>

              {/* Search Bar */}
              <div style={styles.locationSearchContainer}>
                <input
                  style={styles.locationSearchInput}
                  type="text"
                  placeholder="🔍 Search location... e.g., Main Street, Central Park"
                  value={searchQuery}
                  onChange={handleSearchLocation}
                />
                <button
                  type="button"
                  style={styles.geolocateBtn}
                  onClick={handleGetCurrentLocation}
                  disabled={searchLoading}
                  title="Use my current location"
                >
                  📍
                </button>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div style={styles.searchResultsDropdown}>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        style={styles.searchResultItem}
                        onClick={() => handleSelectLocation(result)}
                      >
                        <div style={styles.resultName}>{result.name}</div>
                        <div style={styles.resultCoords}>
                          {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Location Display */}
              {locationName && (
                <div style={styles.selectedLocation}>
                  ✅ <strong>{locationName}</strong>
                </div>
              )}

              {/* MAP */}
              <MapContainer
                center={[formData.latitude, formData.longitude]}
                zoom={13}
                style={styles.map}
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

              <div style={styles.locationInfo}>
                📍 {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
              </div>
              <p style={styles.mapHint}>Click on the map to pin location or search above</p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Issue Report'}
            </button>
          </form>

          {/* MESSAGE */}
          {message && (
            <div style={{
              ...styles.message,
              ...(messageType === 'success' ? styles.messageSuccess : styles.messageError),
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 100%)',
    minHeight: '100vh',
    padding: '20px',
  },
  navbar: {
    background: 'white',
    padding: '16px 24px',
    boxShadow: '0 2px 12px rgba(11, 17, 32, 0.08)',
    borderRadius: '12px',
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarBrand: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0B1120',
  },
  brandAccent: {
    color: '#00E5A0',
  },
  logoutBtn: {
    backgroundColor: '#F0F4FF',
    color: '#0B1120',
    padding: '10px 20px',
    border: '1px solid #D0D8F0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
  },
  container: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    color: '#0B1120',
    marginBottom: '8px',
    fontWeight: '700',
  },
  subtitle: {
    color: '#8A9BBE',
    fontSize: '14px',
  },
  formCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(11, 17, 32, 0.08)',
    border: '1px solid #F0F4FF',
  },
  formGroup: {
    marginBottom: '28px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: '600',
    color: '#0B1120',
    fontSize: '14px',
  },
  required: {
    color: '#FF6B6B',
    marginLeft: '4px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #E8ECFF',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#FAFBFF',
    transition: 'all 0.3s ease',
  },
  locationSearchContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    position: 'relative',
  },
  locationSearchInput: {
    flex: 1,
    padding: '14px 16px',
    border: '1.5px solid #E8ECFF',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#FAFBFF',
    transition: 'all 0.3s ease',
  },
  geolocateBtn: {
    padding: '14px 16px',
    border: '1.5px solid #E8ECFF',
    borderRadius: '10px',
    backgroundColor: '#F0F4FF',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: '50px',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1.5px solid #E8ECFF',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(11, 17, 32, 0.1)',
    zIndex: 1001,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  searchResultItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #F0F4FF',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  resultName: {
    fontWeight: '600',
    color: '#0B1120',
    fontSize: '14px',
    marginBottom: '4px',
  },
  resultCoords: {
    color: '#8A9BBE',
    fontSize: '12px',
  },
  selectedLocation: {
    marginTop: '12px',
    padding: '12px 16px',
    backgroundColor: '#E7F9F4',
    borderRadius: '8px',
    color: '#00B87A',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #00E5A0',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
  },
  categoryOption: {
    padding: '16px',
    border: '2px solid #E8ECFF',
    borderRadius: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
  },
  categoryOptionSelected: {
    borderColor: '#00E5A0',
    backgroundColor: '#E7F9F4',
  },
  categoryEmoji: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  categoryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0B1120',
  },
  fileName: {
    marginTop: '10px',
    padding: '10px 14px',
    backgroundColor: '#F0F4FF',
    borderRadius: '8px',
    color: '#00E5A0',
    fontSize: '13px',
    fontWeight: '500',
  },
  map: {
    width: '100%',
    height: '300px',
    borderRadius: '12px',
    border: '2px dashed #D0D8F0',
    marginTop: '12px',
  },
  locationInfo: {
    marginTop: '12px',
    padding: '10px',
    backgroundColor: '#00E5A0',
    color: '#0B1120',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  mapHint: {
    marginTop: '8px',
    color: '#8A9BBE',
    fontSize: '13px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #00E5A0 0%, #00B87A 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '28px',
    boxShadow: '0 4px 12px rgba(0, 229, 160, 0.3)',
  },
  message: {
    marginTop: '24px',
    padding: '16px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
  },
  messageSuccess: {
    backgroundColor: '#E7F9F4',
    color: '#00B87A',
    borderLeft: '4px solid #00E5A0',
  },
  messageError: {
    backgroundColor: '#FFE7E7',
    color: '#FF6B6B',
    borderLeft: '4px solid #FF6B6B',
  },
};

export default SubmitIssue;