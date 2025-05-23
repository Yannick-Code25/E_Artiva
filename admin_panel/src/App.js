// admin_panel/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
// Importer les futures pages ici (ex: ProductAddPage)
import ProductAddPage from './pages/ProductAddPage';

import CategoryAddPage from './pages/CategoryAddPage';

// Composant pour protéger les routes admin
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
        />
        <Route // Nouvelle route pour ajouter un produit
          path="/products/add"
          element={<ProtectedRoute><ProductAddPage /></ProtectedRoute>}
        />
        <Route // NOUVELLE ROUTE POUR AJOUTER UNE CATÉGORIE
          path="/categories/add"
          element={<ProtectedRoute><CategoryAddPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} /> 
      </Routes>
    </Router>
  );
}

export default App;
