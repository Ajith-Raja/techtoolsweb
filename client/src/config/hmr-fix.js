/**
 * This script patches Vite's HMR WebSocket connection to prevent errors on Replit
 * The error occurs because the WebSocket tries to connect to localhost:undefined
 */

(function fixHMRWebSocket() {
  // Only run if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Patch the WebSocket creation in Vite's client HMR code
  const originalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    // Check if this is a Vite HMR WebSocket connection
    if (url && typeof url === 'string' && url.includes('token=') && url.includes('localhost:undefined')) {
      // Fix the URL by using the current window.location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const path = '/';
      const tokenMatch = url.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';
      
      // Construct a valid WebSocket URL
      url = `${protocol}//${host}${path}?token=${token}`;
      
      console.log('Fixed HMR WebSocket URL:', url);
    }
    
    return new originalWebSocket(url, protocols);
  };
  
  // Copy properties from the original WebSocket constructor
  Object.keys(originalWebSocket).forEach(key => {
    window.WebSocket[key] = originalWebSocket[key];
  });
  
  window.WebSocket.prototype = originalWebSocket.prototype;
})();