// admin_panel/src/pages/ProductManagementPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate est importé mais pas utilisé directement ici, peut l'être plus tard
import ProductFormModal from '../components/ProductFormModal'; // Assure-toi que le chemin est correct
import './ProductManagementPage.css'; // Assure-toi que ce fichier CSS existe et est stylé

const API_BASE_URL = 'http://localhost:3001/api'; // URL de ton backend

function ProductManagementPage() {
  const [allProducts, setAllProducts] = useState([]); // Stocke tous les produits récupérés de l'API
  const [isLoading, setIsLoading] = useState(false); // Pour le chargement initial et les actions
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false); // État pour l'ouverture/fermeture du modal
  const [selectedProduct, setSelectedProduct] = useState(null); // Produit à modifier, ou null pour ajout

  const [searchTerm, setSearchTerm] = useState(''); // État pour le terme de recherche

  const adminToken = localStorage.getItem('adminToken');
  // const navigate = useNavigate(); // Si tu as besoin de naviguer programmement

  // Fonction pour récupérer tous les produits
  const fetchProducts = useCallback(async () => {
    if (!adminToken) {
      // Idéalement, ProtectedRoute gère cela, mais une sécurité en plus
      console.error("Admin non authentifié, impossible de charger les produits.");
      setError("Authentification requise.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Idéalement, cette route devrait permettre à un admin de voir TOUS les produits (publiés ou non)
      // Tu pourrais avoir une route /api/admin/products ou passer un query param
      const response = await axios.get(`${API_BASE_URL}/products`, { 
        // headers: { 'Authorization': `Bearer ${adminToken}` } // Décommente si GET /products est protégé
      });
      setAllProducts(response.data || []);
      console.log("Produits chargés pour l'admin:", response.data.length);
    } catch (err) {
      console.error("Erreur chargement produits (admin):", err);
      setError(err.response?.data?.message || 'Impossible de charger les produits.');
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  // Charger les produits au montage du composant
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtrer les produits basés sur le terme de recherche
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return allProducts; // Retourne tous les produits si la recherche est vide
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allProducts.filter(product =>
      (product.name && product.name.toLowerCase().includes(lowerSearchTerm)) ||
      (product.sku && product.sku.toLowerCase().includes(lowerSearchTerm)) ||
      (product.id && String(product.id).toLowerCase().includes(lowerSearchTerm))
    );
  }, [allProducts, searchTerm]);

  // Ouvre le modal pour ajouter un nouveau produit
  const handleOpenModalForAdd = () => {
    setSelectedProduct(null); // Aucun produit sélectionné signifie mode "ajout"
    setIsModalOpen(true);
  };

  // Ouvre le modal pour modifier un produit existant
  const handleOpenModalForEdit = (product) => {
    console.log("Ouverture du modal pour édition avec le produit:", product); // Log pour déboguer
    setSelectedProduct(product); // Le produit sélectionné est passé au modal
    setIsModalOpen(true);
  };

  // Ferme le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null); // Réinitialise le produit sélectionné
  };

  // Appelé après qu'un produit a été sauvegardé (ajouté ou modifié) via le modal
  const handleSaveProduct = () => {
    fetchProducts(); // Recharge la liste des produits pour refléter les changements
    handleCloseModal(); // Ferme le modal
  };

  // Gère la publication/dépublication (soft delete/toggle active) d'un produit
  const handleTogglePublishStatus = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "publier" : "masquer";
    if (window.confirm(`Voulez-vous vraiment ${action} ce produit ?`)) {
      setIsLoading(true); // Indiquer une action en cours sur la page principale
      setError('');
      try {
        await axios.put(`${API_BASE_URL}/products/${productId}`, 
          { is_published: newStatus }, // Ne met à jour que le statut de publication
          { headers: { 'Authorization': `Bearer ${adminToken}` } }
        );
        // Mettre à jour la liste locale pour un retour visuel immédiat ou re-fetcher
        // fetchProducts(); // Re-fetcher est plus simple pour garantir la fraîcheur des données
         setAllProducts(prevProducts => 
            prevProducts.map(p => p.id === productId ? { ...p, is_published: newStatus } : p)
        );

      } catch (err) {
        console.error(`Erreur lors de la tentative de ${action} le produit:`, err);
        setError(err.response?.data?.message || `Erreur lors de la mise à jour du statut du produit.`);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Pour une vraie suppression (si tu l'implémentes)
  // const handleDeleteProduct = async (productId) => { ... };


  // Affichage pendant le chargement initial
  if (isLoading && allProducts.length === 0) {
    return (
      <div className="product-management-page">
        <div className="page-header"><h1>Gestion des Produits</h1></div>
        <p>Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="product-management-page">
      <div className="page-header">
        <h1>Gestion des Produits</h1>
        <button onClick={handleOpenModalForAdd} className="add-product-btn">+ Ajouter Produit</button>
      </div>
      <Link to="/dashboard" className="back-link">← Retour au Tableau de Bord</Link>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Rechercher par nom, SKU, ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <p className="error-message">{error}</p>}
      {isLoading && searchTerm && <p className="loading-indicator">Recherche en cours...</p>} {/* Si la recherche était asynchrone */}
      {/* L'indicateur isLoading est global, il s'affichera aussi pendant le toggle de publication */}
      {isLoading && <p className="loading-indicator">Opération en cours...</p>}


      <div className="table-responsive"> {/* Pour le scroll horizontal sur petits écrans */}
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Catégories</th>
              <th>Tags</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  <img 
                    src={product.image_url || 'https://via.placeholder.com/50?text=N/A'} 
                    alt={product.name || 'Produit'} 
                    className="product-thumbnail"
                  />
                </td>
                <td>{product.name || 'N/A'}</td>
                <td>{product.price !== undefined ? `${product.price} FCFA` : 'N/A'}</td>
                <td>{product.stock !== undefined ? product.stock : 'N/A'}</td>
                <td>{(product.categories_names || []).join(', ') || '-'}</td>
                <td>{(product.tags_names || []).join(', ') || '-'}</td>
                <td>
                  <span 
                    className={product.is_published ? 'status-active' : 'status-inactive'}
                    onClick={() => handleTogglePublishStatus(product.id, product.is_published)} // Rendre le statut cliquable
                    style={{cursor: 'pointer', padding: '3px 6px', borderRadius: '3px', display: 'inline-block'}} // Style pour indiquer que c'est cliquable
                    title={product.is_published ? "Publié (cliquer pour masquer)" : "Masqué (cliquer pour publier)"}
                  >
                    {product.is_published ? 'Publié' : 'Masqué'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button onClick={() => handleOpenModalForEdit(product)} className="action-btn edit-btn" title="Modifier">✎</button>
                  {/* Tu peux ajouter un bouton de suppression définitive si besoin */}
                  {/* <button onClick={() => handleDeleteProduct(product.id)} className="action-btn delete-btn" title="Supprimer">🗑️</button> */}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '20px'}}>
                  {searchTerm ? "Aucun produit ne correspond à votre recherche." : "Aucun produit à afficher. Cliquez sur '+ Ajouter Produit' pour commencer."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Le Modal pour ajouter/modifier un produit */}
      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          productToEdit={selectedProduct} // Renommé pour plus de clarté
          apiBaseUrl={API_BASE_URL}
          adminToken={adminToken}
        />
      )}
    </div>
  );
}

export default ProductManagementPage;