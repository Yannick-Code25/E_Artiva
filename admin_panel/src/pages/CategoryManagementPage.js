// admin_panel/src/pages/CategoryManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CategoryFormModal from '../components/CategoryFormModal'; // Importer le modal
// Tu peux créer un CategoryManagementPage.css ou réutiliser des styles de ProductManagementPage.css
import './ProductManagementPage.css'; // Réutilisation pour l'exemple

const API_BASE_URL = 'http://localhost:3001/api';

function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const adminToken = localStorage.getItem('adminToken');

  const fetchCategories = useCallback(async () => {
    if (!adminToken) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, {
        // headers: { 'Authorization': `Bearer ${adminToken}` } // GET /categories est public
      });
      setCategories(response.data || []);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
      setError(err.response?.data?.message || 'Impossible de charger les catégories.');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModalForAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = () => {
    fetchCategories(); // Recharger
    handleCloseModal();
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cela pourrait affecter les produits liés.`)) {
      setIsLoading(true);
      setError('');
      try {
        await axios.delete(`${API_BASE_URL}/categories/${categoryId}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        fetchCategories(); // Recharger
      } catch (err) {
        console.error("Erreur suppression catégorie:", err);
        setError(err.response?.data?.message || 'Erreur lors de la suppression de la catégorie.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && categories.length === 0) {
    return <div className="management-page"><p>Chargement des catégories...</p></div>;
  }

  return (
    <div className="management-page"> {/* Classe de style générale */}
      <div className="page-header">
        <h1>Gestion des Catégories</h1>
        <button onClick={handleOpenModalForAdd} className="add-btn">+ Ajouter Catégorie</button>
      </div>
      <Link to="/dashboard" className="back-link">← Retour au Tableau de Bord</Link>

      {error && <p className="error-message">{error}</p>}
      {isLoading && <p className="loading-indicator">Opération en cours...</p>}

      <div className="table-responsive">
        <table className="custom-table"> {/* Classe de style pour la table */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Slug</th>
              <th>Parente</th>
              <th>Ordre</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? categories.map(category => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.slug || '-'}</td>
                <td>{category.parent_id ? (categories.find(c=>c.id === category.parent_id)?.name || category.parent_id) : '-'}</td>
                <td>{category.display_order}</td>
                <td className="actions-cell">
                  <button onClick={() => handleOpenModalForEdit(category)} className="action-btn edit-btn" title="Modifier">✎</button>
                  <button onClick={() => handleDeleteCategory(category.id, category.name)} className="action-btn delete-btn" title="Supprimer">🗑️</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{textAlign: 'center'}}>Aucune catégorie trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCategory}
          categoryToEdit={selectedCategory}
          apiBaseUrl={API_BASE_URL}
          adminToken={adminToken}
        />
      )}
    </div>
  );
}

export default CategoryManagementPage;