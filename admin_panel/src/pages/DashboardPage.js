// admin_panel/src/pages/DashboardPage.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DashboardPage.css'; // Importer le fichier CSS

function DashboardPage() {
  const navigate = useNavigate();
  const adminUserString = localStorage.getItem('adminUser');
  let adminUserName = 'Admin'; // Valeur par défaut

  if (adminUserString) {
    try {
      const adminUser = JSON.parse(adminUserString);
      adminUserName = adminUser.name || 'Admin';
    } catch (e) {
      console.error("Erreur de parsing JSON pour adminUser:", e);
      // Garder adminUserName par défaut
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <div className="dashboard-container"> {/* Utiliser la classe CSS */}
      <h1>Tableau de Bord Administrateur</h1>
      <p>Bienvenue, {adminUserName} !</p>
      <nav className="dashboard-nav"> {/* Utiliser la classe CSS */}
        <ul>
          <li><Link to="/products/add">Ajouter un Produit</Link></li>
          <li><Link to="/categories/add">Ajouter une Catégorie</Link></li>
          {/* Ajouter d'autres liens plus tard */}
        </ul>
      </nav>
      <button onClick={handleLogout} className="logout-button">Se déconnecter</button>
    </div>
  );
}
export default DashboardPage;