// admin_panel/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link,useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductManagementPage from './pages/ProductManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import OrderManagementPage from './pages/OrderManagementPage';
import ReportsPage from './pages/ReportsPage';

import ProductTagsPage from './pages/ProductTagsPage';

import './App.css'; // Ou './styles/Layout.css' si tu l'as mis là

// Icônes Lucide
import { LayoutDashboard, ShoppingCart, Tag, Users, Settings,BarChart2, LogOut as LogOutIcon, ShieldCheck,FolderTree,ListOrdered } from 'lucide-react';
//import { Icon } from 'react-native-vector-icons/Icon';

// Icônes (tu peux utiliser une librairie comme lucide-react ou react-icons)
// Pour cet exemple, je vais simuler avec du texte.
//const IconPlaceholder = ({ name }) => <span className="nav-icon">{name.substring(0,1).toUpperCase()}</span>; 
// Remplace par de vraies icônes plus tard (ex: <HomeIcon /> de lucide-react)


// Composant pour la Sidebar
const Sidebar = ({ handleLogout }) => {
  const location = useLocation(); // Pour savoir quel lien est actif

  const navItems = [
    { path: "/dashboard", label: "Tableau de Bord", Icon: LayoutDashboard },
    { path: "/products", label: "Produits", Icon: ShoppingCart },
    // Pour la gestion des catégories, on peut avoir une page dédiée ou l'intégrer ailleurs
    { path: "/categories", label: "Catégories", Icon: FolderTree }, // Exemple si page dédiée
    { path: "/product-tags", label: "Tags Produits", Icon: Tag },
    { path: "/users", label: "Utilisateurs", Icon: Users },
    { path: "/orders", label: "Commandes", Icon: ListOrdered },
    { path: "/reports", label: "Reports", Icon: BarChart2 }
    // { path: "/settings", label: "Paramètres", Icon: Settings },
  ];

   return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo"><ShieldCheck size={28} strokeWidth={1.5}/></div>
        <h2 className="sidebar-title">Admin Artiva</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(item => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={
                  (location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/dashboard")) ||
                  (location.pathname === "/" && item.path === "/dashboard") 
                  ? "active" 
                  : ""
                }
              >
                <span className="nav-icon"><item.Icon size={18} strokeWidth={1.75}/></span> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button-sidebar">
          <span className="nav-icon"><LogOutIcon size={18} strokeWidth={1.75}/></span> Se déconnecter
        </button>
      </div>
    </aside>
  );
};


// Composant pour protéger les routes admin
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const navigate = useNavigate(); // Pour la redirection dans handleLogout

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login', { replace: true });
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si authentifié, rendre le layout avec sidebar et le contenu de la page
  return (
    <div className="admin-layout">
      <Sidebar handleLogout={handleLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductManagementPage /></ProtectedRoute>} />
        <Route path="/product-tags" element={<ProtectedRoute><ProductTagsPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoryManagementPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>}/>
        <Route path="/orders" element={<ProtectedRoute><OrderManagementPage /></ProtectedRoute>}/>
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>}
        />
        {/* Redirection par défaut vers dashboard si déjà loggué, sinon vers login */}
        <Route path="/" element={ localStorage.getItem('adminToken') ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={localStorage.getItem('adminToken') ? "/dashboard" : "/login"} replace />} /> 
        </Routes>
    </Router>
  );
}

export default App;