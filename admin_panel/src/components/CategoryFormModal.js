// admin_panel/src/components/CategoryFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ProductFormModal.css'; // On peut réutiliser le style du modal produit pour commencer

function CategoryFormModal({ isOpen, onClose, onSave, categoryToEdit, apiBaseUrl, adminToken }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    slug: '',
    parent_id: '', // Sera un select ou un input simple pour l'ID
    display_order: '0',
  });
  const [allCategories, setAllCategories] = useState([]); // Pour le sélecteur de catégorie parente
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pré-remplir le formulaire pour l'édition
  useEffect(() => {
    if (categoryToEdit && categoryToEdit.id) {
      setFormData({
        name: categoryToEdit.name || '',
        description: categoryToEdit.description || '',
        image_url: categoryToEdit.image_url || '',
        slug: categoryToEdit.slug || '',
        parent_id: categoryToEdit.parent_id ? String(categoryToEdit.parent_id) : '',
        display_order: categoryToEdit.display_order !== undefined ? String(categoryToEdit.display_order) : '0',
      });
    } else {
      setFormData({ name: '', description: '', image_url: '', slug: '', parent_id: '', display_order: '0' });
    }
  }, [categoryToEdit, isOpen]);

  // Charger les catégories pour le sélecteur de parent_id
  const fetchParentCategories = useCallback(async () => {
     if (!isOpen) return;
     // Ne pas charger la catégorie en cours d'édition dans la liste des parents potentiels
     const currentCategoryId = categoryToEdit ? categoryToEdit.id : null;
     try {
         const response = await axios.get(`${apiBaseUrl}/categories`, {
             headers: { 'Authorization': `Bearer ${adminToken}` }
         });
         setAllCategories(
             (response.data || []).filter(cat => cat.id !== currentCategoryId) // Exclure la catégorie actuelle de ses propres parents
         );
     } catch (err) {
         console.error("Erreur chargement catégories parentes:", err);
         // Gérer l'erreur si besoin
     }
  }, [apiBaseUrl, adminToken, isOpen, categoryToEdit]);

  useEffect(() => {
     fetchParentCategories();
  }, [fetchParentCategories]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload = {
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      display_order: formData.display_order ? parseInt(formData.display_order, 10) : 0,
    };
    if (payload.slug === '') delete payload.slug; // Envoyer null si vide pour auto-génération par le backend
    if (payload.image_url === '') delete payload.image_url;
    if (payload.description === '') delete payload.description;


    try {
      if (categoryToEdit && categoryToEdit.id) { // Mode Édition
        await axios.put(`${apiBaseUrl}/categories/${categoryToEdit.id}`, payload, {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        });
      } else { // Mode Ajout
        await axios.post(`${apiBaseUrl}/categories`, payload, {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        });
      }
      onSave(); // Appelle la fonction pour recharger et fermer
    } catch (err) {
      console.error("Erreur sauvegarde catégorie:", err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde de la catégorie.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{categoryToEdit ? 'Modifier la Catégorie' : 'Ajouter une Nouvelle Catégorie'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cat-name">Nom :</label>
            <input type="text" name="name" id="cat-name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="cat-description">Description :</label>
            <textarea name="description" id="cat-description" value={formData.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="cat-image_url">URL Image :</label>
            <input type="text" name="image_url" id="cat-image_url" value={formData.image_url} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="cat-slug">Slug (optionnel, sera auto-généré si vide) :</label>
            <input type="text" name="slug" id="cat-slug" value={formData.slug} onChange={handleChange} />
          </div>
          <div className="form-group">
             <label htmlFor="cat-parent_id">Catégorie Parente (optionnel) :</label>
             <select 
                 name="parent_id" 
                 id="cat-parent_id" 
                 value={formData.parent_id} 
                 onChange={handleChange}
                 style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em'}}
             >
                 <option value="">-- Aucune --</option>
                 {allCategories.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                 ))}
             </select>
          </div>
          <div className="form-group">
            <label htmlFor="cat-display_order">Ordre d'affichage :</label>
            <input type="number" name="display_order" id="cat-display_order" value={formData.display_order} onChange={handleChange} step="1"/>
          </div>

          {error && <p className="error-message-form">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={isLoading} className="save-btn">
              {isLoading ? 'Sauvegarde...' : (categoryToEdit ? 'Mettre à Jour' : 'Ajouter Catégorie')}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryFormModal;