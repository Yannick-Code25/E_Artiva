// admin_panel/src/pages/ReportsPage.js
import React from 'react';
import { Link } from 'react-router-dom';

function ReportsPage() {
  return (
    <div className="management-page">
      <div className="page-header">
        <h1>Rapports & Finance</h1>
      </div>
      <Link to="/dashboard" className="back-link">← Retour au Tableau de Bord</Link>
      <p>Cette section est en cours de développement.</p>
      <p>Ici, vous pourrez voir des statistiques sur les ventes, les produits populaires, les revenus, etc.</p>
      {/* Plus tard: graphiques, exportations de données, etc. */}
    </div>
  );
}
export default ReportsPage;