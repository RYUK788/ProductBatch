// In your api.js file

import axios from 'axios';

// The base URL for your server
const API_URL = 'http://localhost:3005/api';

/**
 * ✅ NEW SECURE FUNCTION
 * This function calls the secure `/api/batches` endpoint.
 */
// export const fetchBatchNumbers = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/batches`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching batch numbers:', error);
//     throw error;
//   }
// };

/**
 * ⚠️ OLD INSECURE FUNCTION
 * This function is needed for your other queries to work temporarily.
 * It calls the insecure `/api/query` endpoint.
 */
export const fetchData = async (query) => {
  try {
    const response = await axios.post(`${API_URL}/query`, { query });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};