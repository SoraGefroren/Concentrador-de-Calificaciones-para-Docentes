import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// PrimeReact styles
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
