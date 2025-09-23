// Update manager for automatic app updates
export class UpdateManager {
  constructor() {
    this.checkInterval = 60000; // Check every minute
    this.lastCheck = 0;
  }

  init() {
    // Check for updates on app start
    this.checkForUpdates();
    
    // Set up periodic checks
    setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);

    // Check when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  async checkForUpdates() {
    const now = Date.now();
    if (now - this.lastCheck < 30000) return; // Throttle checks
    
    this.lastCheck = now;

    try {
      // Check if there's a new version by fetching index.html
      const response = await fetch('/?v=' + now, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const currentVersion = this.extractVersion(html);
        const storedVersion = localStorage.getItem('app-version');

        if (storedVersion && currentVersion !== storedVersion) {
          this.handleUpdate();
        } else if (!storedVersion) {
          localStorage.setItem('app-version', currentVersion);
        }
      }
    } catch (error) {
      console.log('Update check failed:', error);
    }
  }

  extractVersion(html) {
    // Extract version from build files or timestamp
    const match = html.match(/static\/js\/main\.([a-f0-9]+)\.js/) || 
                  html.match(/static\/css\/main\.([a-f0-9]+)\.css/);
    return match ? match[1] : Date.now().toString();
  }

  handleUpdate() {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Clear localStorage except essential data
    const preserve = ['auth-token', 'user-preferences'];
    const toRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!preserve.includes(key)) {
        toRemove.push(key);
      }
    }
    
    toRemove.forEach(key => localStorage.removeItem(key));

    // Force reload
    window.location.reload(true);
  }
}

// Auto-initialize
const updateManager = new UpdateManager();
updateManager.init();