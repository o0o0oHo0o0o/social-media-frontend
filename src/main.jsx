import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { CONFIG } from './config/constants'

const app = <App />

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {CONFIG.RECAPTCHA_SITE_KEY ? (
        <GoogleReCaptchaProvider
          reCaptchaKey={CONFIG.RECAPTCHA_SITE_KEY}
          scriptProps={{ async: true, defer: true }}
        >
          {app}
        </GoogleReCaptchaProvider>
      ) : (
        app
      )}
    </BrowserRouter>
  </StrictMode>,
)
