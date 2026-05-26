import axios from 'axios';

// Create an instance specifically for external APIs that strips the Authorization header
const externalApi = axios.create();

externalApi.interceptors.request.use((config) => {
  // Strip authorization header added by AuthContext global defaults
  if (config.headers) {
    delete config.headers.Authorization;
    if (config.headers.common) {
        delete config.headers.common.Authorization;
    }
  }
  return config;
});

export default externalApi;
