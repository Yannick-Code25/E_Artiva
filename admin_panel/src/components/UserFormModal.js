// admin_panel/src/components/UserFormModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Réutiliser les styles du modal existant si possible, ou créer UserFormModal.css
import './ProductFormModal.css'; // Supposons qu'on réutilise la base

function UserFormModal({ isOpen, onClose, onSave, userToEdit, apiBaseUrl, adminToken }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    role: 'customer', // Rôle par défaut
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Rôles disponibles (tu peux les charger depuis une API si tu veux plus de flexibilité)
  const availableRoles = ['customer', 'vendor', 'editor']; // Ajoute les rôles que tu utilises

  useEffect(() => {
    if (userToEdit && userToEdit.id) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        address: userToEdit.address || '',
        phone: userToEdit.phone || '',
        role: userToEdit.role || 'customer',
      });
    } else {
      // Mode ajout n'est pas géré par ce modal, mais on garde une initialisation
      setFormData({ name: '', email: '', address: '', phone: '', role: 'customer' });
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Ne pas envoyer les champs que l'admin ne devrait pas modifier directement (comme password)
    // Le backend updateUserByAdmin ne prend que name, email, address, phone, role
    const payload = { 
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        role: formData.role
    };
    // Retirer les clés avec des valeurs vides si on ne veut pas les envoyer pour écraser avec vide
    // Object.keys(payload).forEach(key => (payload[key] === '' || payload[key] === null) && delete payload[key]);


    try {
      if (userToEdit && userToEdit.id) {
        await axios.put(`${apiBaseUrl}/users/${userToEdit.id}`, payload, {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        });
      } else {
        // Ce modal est principalement pour l'édition. L'ajout d'utilisateur se fait via le register client.
        setError("Ce formulaire est pour la modification uniquement.");
        setIsSubmitting(false);
        return;
      }
      onSave(); // Appelle la fonction pour recharger la liste et fermer
    } catch (err) {
      console.error("Erreur sauvegarde utilisateur:", err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde de l\'utilisateur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Modifier l'Utilisateur</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user-name">Nom :</label>
            <input type="text" name="name" id="user-name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="user-email">Email :</label>
            <input type="email" name="email" id="user-email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="user-address">Adresse :</label>
            <textarea name="address" id="user-address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="user-phone">Téléphone :</label>
            <input type="tel" name="phone" id="user-phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="user-role">Rôle :</label>
            <select 
                name="role" 
                id="user-role" 
                value={formData.role} 
                onChange={handleChange}
                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em'}}
            >
                {availableRoles.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
            </select>
          </div>

          {error && <p className="error-message-form" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="save-btn">
              {isSubmitting ? 'Sauvegarde...' : 'Mettre à Jour Utilisateur'}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;