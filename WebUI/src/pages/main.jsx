import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '../index.css'

import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'

import Home from './Home.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Dashboard from './Dashboard.jsx'
import Showcode from './ShowCode.jsx'
import NewRequest from './NewRequest.jsx'
import ConfirmCode from './ConfirmCode.jsx'
import Admin from './Admin.jsx'
import Map from './Map.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/*  pages that need to be centered */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* pages that need a navBar and not centered */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/new-request" element={<NewRequest />} />
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/deliveries/:id/code" element={<Showcode />} />
          <Route path="/deliveries/:id/confirm" element={<ConfirmCode />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/map" element={<Map />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)