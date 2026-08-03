const GeocodingService = {
  // Search location by name
  searchLocation: async (query) => {
    try {
      // Restrict searches to Ahmedabad by default using Nominatim viewbox+bounded
      const citySuffix = 'Ahmedabad, India';
      const q = query.toLowerCase().includes('ahmedabad') ? query : `${query}, ${citySuffix}`;
      // viewbox: left(lon),top(lat),right(lon),bottom(lat) to roughly cover Ahmedabad
      const viewbox = '72.45,23.12,72.66,22.95';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&viewbox=${viewbox}&bounded=1`
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
      const addr = data.address || {};
      const display = data.display_name || '';
      const inAhmedabad = (
        (addr.city && addr.city.toLowerCase().includes('ahmedabad')) ||
        (addr.county && addr.county.toLowerCase().includes('ahmedabad')) ||
        display.toLowerCase().includes('ahmedabad')
      );
      if (!inAhmedabad) return 'Outside Ahmedabad';
      return addr.road || addr.neighbourhood || addr.suburb || addr.city || 'Location selected';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Location selected';
    }
  },
};

export default GeocodingService;