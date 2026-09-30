import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '../index.css'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Home from './Home.jsx'
import Login from './Login.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
       </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
//<Route path="/register" element={<Register />} />