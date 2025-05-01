/**
 * This script completely disables Vite's HMR WebSocket connection to prevent errors on Replit
 * 
 * Since trying to fix the connection hasn't worked, we're taking a more radical approach:
 * We're completely disabling the WebSocket functionality by overriding key Vite HMR functions
 */

(function disableHMR() {
  // Wait for the document to be fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    // This will run after Vite has initialized
    setTimeout(() => {
      try {
        // Completely disable Vite's WebSocket connection attempts
        
        // First override the setupWebSocket function
        if (window.__vite_plugin_react_preamble_installed__) {
          console.log('[HMR fix] Vite React plugin detected, disabling HMR connections');
          
          // Override the global fetch to block specific HMR-related fetches
          const originalFetch = window.fetch;
          window.fetch = function(resource, init) {
            if (resource && typeof resource === 'string' && 
                (resource.includes('/@vite/client') || resource.includes('hmr'))) {
              console.log('[HMR fix] Blocked HMR-related fetch:', resource);
              return Promise.resolve(new Response('// HMR disabled', { status: 200 }));
            }
            return originalFetch.apply(this, arguments);
          };
          
          // Try to disable any existing WebSocket connections
          if (window.__vite_ws) {
            try {
              window.__vite_ws.close();
              window.__vite_ws = null;
            } catch (e) {
              console.warn('[HMR fix] Failed to close existing WebSocket', e);
            }
          }
          
          // Create empty "no-op" versions of functions to prevent errors
          window.__HMR__ = {
            send: () => {},
            connect: () => {}
          };
          
          console.log('[HMR fix] HMR connections disabled');
        }
      } catch (err) {
        console.warn('[HMR fix] Error disabling HMR:', err);
      }
    }, 500); // Wait for Vite to initialize
  });
  
  // Completely suppress any HMR related console errors
  if (window.console) {
    const originalConsoleError = console.error;
    console.error = function(...args) {
      if (args.length > 0 && typeof args[0] === 'string') {
        // Filter out all WebSocket and HMR related errors
        if (args[0].includes('WebSocket') || 
            args[0].includes('localhost:undefined') ||
            args[0].includes('HMR') ||
            args[0].includes('hmr') ||
            args[0].includes('vite')) {
          return; // Suppress the error
        }
      }
      return originalConsoleError.apply(this, args);
    };
    
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      if (args.length > 0 && typeof args[0] === 'string') {
        // Filter out all WebSocket and HMR related warnings
        if (args[0].includes('WebSocket') || 
            args[0].includes('localhost:undefined') ||
            args[0].includes('HMR') ||
            args[0].includes('hmr') ||
            args[0].includes('vite')) {
          return; // Suppress the warning
        }
      }
      return originalConsoleWarn.apply(this, args);
    };
  }
})();