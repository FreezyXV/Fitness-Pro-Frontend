// main.ts - CORRECTED STARTUP WITH ERROR HANDLING
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Global error handler
function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // Show user-friendly message for critical errors
    if (event.reason?.message?.includes('Cannot read properties of null')) {
      showErrorMessage('Erreur d\'initialisation', 'Un problème est survenu lors du chargement. Veuillez recharger la page.');
    }
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('🚨 JavaScript error:', event.error);
    
    // Handle specific initialization errors
    if (event.error?.message?.includes('Cannot read properties of null')) {
      showErrorMessage('Erreur de composant', 'Un composant n\'a pas pu se charger correctement.');
    }
  });
}

function showErrorMessage(title: string, message: string): void {
  if (typeof document !== 'undefined') {
    // Remove any existing error messages
    const existingError = document.querySelector('.app-error-message');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'app-error-message';
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee2e2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideInRight 0.3s ease;
      ">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="font-size: 1.2rem;">⚠️</span>
          <strong>${title}</strong>
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 1rem;">
          ${message}
        </div>
        <button onclick="window.location.reload()" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        ">
          Recharger la page
        </button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          color: #6b7280;
          border: none;
          padding: 0.5rem;
          margin-left: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
        ">
          Fermer
        </button>
      </div>
      <style>
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(errorDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 10000);
  }
}

function showStartupError(error: any): void {
  console.error('❌ Error starting FitnessPro app:', error);
  
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        background: linear-gradient(135deg, #21BF73 0%, #00B5AD 50%, #21BF73 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
      ">
        <div style="
          text-align: center; 
          padding: 3rem; 
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 1.5rem; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 500px;
          margin: 2rem;
        ">
          <div style="font-size: 4rem; margin-bottom: 1.5rem;">🚨</div>
          <h1 style="
            color: #dc3545; 
            margin-bottom: 1rem; 
            font-size: 1.75rem;
            font-weight: 700;
          ">Erreur de démarrage</h1>
          <p style="
            color: #6c757d; 
            margin-bottom: 1.5rem; 
            line-height: 1.6;
            font-size: 1.1rem;
          ">
            FitnessPro n'a pas pu démarrer correctement.<br>
            Cela peut être dû à un problème de connexion ou de configuration.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.location.reload()" style="
              background: linear-gradient(135deg, #21BF73 0%, #00B5AD 100%);
              color: white; 
              border: none; 
              padding: 0.875rem 2rem; 
              border-radius: 0.75rem; 
              cursor: pointer;
              font-size: 1rem;
              font-weight: 600;
              box-shadow: 0 4px 12px rgba(33, 191, 115, 0.3);
              transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              🔄 Réessayer
            </button>
            <button onclick="console.log('Debug info:', ${JSON.stringify(error?.message || 'Unknown error')})" style="
              background: rgba(108, 117, 125, 0.1);
              color: #6c757d; 
              border: 1px solid rgba(108, 117, 125, 0.3); 
              padding: 0.875rem 2rem; 
              border-radius: 0.75rem; 
              cursor: pointer;
              font-size: 1rem;
              font-weight: 600;
              transition: all 0.3s ease;
            " onmouseover="this.style.backgroundColor='rgba(108, 117, 125, 0.2)'" onmouseout="this.style.backgroundColor='rgba(108, 117, 125, 0.1)'">
              🔍 Debug
            </button>
          </div>
          <div style="
            margin-top: 2rem; 
            padding-top: 1.5rem; 
            border-top: 1px solid rgba(203, 213, 225, 0.3);
            font-size: 0.875rem; 
            color: #9ca3af;
          ">
            Si le problème persiste, vérifiez la console du navigateur<br>
            ou contactez le support technique.
          </div>
        </div>
      </div>
    `;
    
    // Clear the body and add our error message
    document.body.innerHTML = '';
    document.body.appendChild(errorDiv);
  }
}

// Setup global error handling first
setupGlobalErrorHandler();

// Bootstrap the application with comprehensive error handling
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('✅ FitnessPro application started successfully');
    
    // Additional success setup
    if (typeof document !== 'undefined') {
      document.title = 'FitnessPro - Votre coach fitness personnel';
    }
  })
  .catch(err => {
    showStartupError(err);
  });