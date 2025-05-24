// admin_panel/src/pages/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import UserFormModal from '../components/UserFormModal';
// Importer les styles généraux si besoin (ex: ProductManagementPage.css)
import './ProductManagementPage.css'; // Réutilisation pour la structure de base

const API_BASE_URL = 'http://localhost:3001/api';

// TODO: Créer un UserFormModal.js similaire à ProductFormModal ou CategoryFormModal
// pour la modification des utilisateurs si tu veux un modal.
// Pour l'instant, on va juste lister et prévoir les boutons.

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const adminToken = localStorage.getItem('adminToken');
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    if (!adminToken) {
        navigate('/login');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      setUsers(response.data || []);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      setError(err.response?.data?.message || 'Impossible de charger les utilisateurs.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fonctions pour ouvrir le modal d'édition (à implémenter avec UserFormModal)
  const handleOpenModalForEdit = (user) => {
     setSelectedUser(user);
     setIsModalOpen(true);
   };
   const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setError(''); // Nettoyer l'erreur du modal
  };

  const handleSaveUser = () => {
    fetchUsers(); // Recharger la liste des utilisateurs
    handleCloseModal();
  };
  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`)) {
      setIsLoading(true);
      setError('');
      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        fetchUsers(); // Recharger la liste
      } catch (err) {
        console.error("Erreur suppression utilisateur:", err);
        setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };


  if (isLoading && users.length === 0) {
    return <div className="management-page"><p>Chargement des utilisateurs...</p></div>;
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>Gestion des Utilisateurs</h1>
        {/* Pas de bouton "Ajouter Utilisateur" ici, car l'inscription se fait via l'app client ou une route admin spécifique */}
      </div>
      <Link to="/dashboard" className="back-link">← Retour au Tableau de Bord</Link>

      {error && <p className="error-message">{error}</p>}
      {isLoading && <p className="loading-indicator">Opération en cours...</p>}

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.address || '-'}</td>
                <td>{user.phone || '-'}</td>
                <td>{formatDate(user.created_at)}</td>
                <td className="actions-cell">
                  <button 
                    onClick={() => handleOpenModalForEdit(user)} 
                    className="action-btn edit-btn" 
                    title="Modifier"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.name)} 
                    className="action-btn delete-btn" 
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" style={{textAlign: 'center'}}>Aucun utilisateur trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Intégration du UserFormModal */}
      {isModalOpen && (
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          userToEdit={selectedUser}
          apiBaseUrl={API_BASE_URL}
          adminToken={adminToken}
        />
      )}
    </div>
  );
}

export default UserManagementPage;