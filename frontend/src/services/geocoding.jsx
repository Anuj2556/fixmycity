const GeocodingService = {
  // Search location by name
  searchLocation: async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`
      );
      const data = await response.json();
      return data.map(item => ({
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  // Get current location
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  },

  // Get location name from coordinates (reverse geocoding)
  getLocationName: async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.address?.road || data.address?.city || 'Location selected';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Location selected';
    }
  },
};

export default GeocodingService;