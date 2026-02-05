import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // 🔥 Import ye zaroori hai

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 🔥 App ko iske andar wrap karo */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)