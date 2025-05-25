// admin_panel/src/components/OrderDetailsModal.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// On peut réutiliser certains styles de ProductFormModal.css ou créer un OrderDetailsModal.css
import './ProductFormModal.css'; // Pour les styles de base du modal-overlay, modal-content
import './OrderDetailsModal.css';

function OrderDetailsModal({ isOpen, onClose, orderId, apiBaseUrl, adminToken }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrderDetails = useCallback(async () => {
    if (!isOpen || !orderId || !adminToken) {
      setOrderDetails(null); // Réinitialiser si pas d'ID ou pas ouvert
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      console.log(`OrderDetailsModal: Fetching details for order ID: ${orderId}`);
      const response = await axios.get(`${apiBaseUrl}/orders/admin/${orderId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      setOrderDetails(response.data);
      console.log("OrderDetailsModal: Details fetched:", response.data);
    } catch (err) {
      console.error("OrderDetailsModal: Erreur chargement détails commande:", err);
      setError(err.response?.data?.message || 'Impossible de charger les détails de la commande.');
      setOrderDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, orderId, apiBaseUrl, adminToken]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]); // Se déclenche quand isOpen, orderId, ou les autres deps changent

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Fonction pour parser et afficher joliment les adresses JSONB
  const renderAddress = (addressString) => {
    if (!addressString) return <p>Non spécifiée</p>;
    try {
      const addressObj = typeof addressString === 'string' ? JSON.parse(addressString) : addressString;
      // Adapte les champs à ce que ton objet adresse contient réellement
      return (
        <>
          {addressObj.name && <p>{addressObj.name}</p>}
          {addressObj.line1 && <p>{addressObj.line1}</p>}
          {addressObj.line2 && <p>{addressObj.line2}</p>}
          <p>{addressObj.city}{addressObj.postal_code && `, ${addressObj.postal_code}`}</p>
          {addressObj.country && <p>{addressObj.country}</p>}
          {addressObj.phone && <p>Tél: {addressObj.phone}</p>}
        </>
      );
    } catch (e) {
      // Si ce n'est pas du JSON, affiche la chaîne brute
      return <p>{String(addressString)}</p>;
    }
  };


  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Détails de la Commande</h2>
        
        {isLoading && <p>Chargement des détails...</p>}
        {error && <p className="error-message-form" style={{color: 'red'}}>{error}</p>}

        {orderDetails && !isLoading && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}> {/* Pour rendre le contenu du modal scrollable */}
            <div className="order-section">
              <h4>Informations Générales</h4>
              <p><strong>N° Commande :</strong> {orderDetails.order_number}</p>
              <p><strong>ID Commande :</strong> {orderDetails.orderId}</p>
              <p><strong>Date :</strong> {formatDate(orderDetails.createdAt)}</p>
              <p><strong>Statut :</strong> <span className={`status-${orderDetails.status}`}>{orderDetails.status}</span></p>
              <p><strong>Total :</strong> {orderDetails.total} {orderDetails.currency}</p>
            </div>

            <div className="order-section">
              <h4>Client</h4>
              <p><strong>Nom :</strong> {orderDetails.userName || 'N/A'}</p>
              <p><strong>Email :</strong> {orderDetails.userEmail || 'N/A'}</p>
              <p><strong>Numéro de Téléphone :</strong> {orderDetails.userPhone || 'N/A'}</p>
            </div>
            
            <div className="order-section">
              <h4>Adresse de Livraison</h4>
              <div className="address-details">{renderAddress(orderDetails.shipping_address)}</div>
            </div>

            {orderDetails.billing_address && (
              <div className="order-section">
                <h4>Adresse de Facturation</h4>
                <div className="address-details">{renderAddress(orderDetails.billing_address)}</div>
              </div>
            )}

            <div className="order-section">
              <h4>Articles Commandés ({orderDetails.items?.length || 0})</h4>
              {orderDetails.items && orderDetails.items.length > 0 ? (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>SKU</th>
                      <th>Qté</th>
                      <th>Prix Unit.</th>
                      <th>Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.items.map(item => (
                      <tr key={item.itemId || item.product_id}> {/* Utilise itemId si disponible */}
                        <td>{item.product_name}</td>
                        <td>{item.sku || '-'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit_price} {orderDetails.currency}</td>
                        <td>{item.subtotal} {orderDetails.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Aucun article trouvé pour cette commande.</p>
              )}
            </div>

            {orderDetails.shipping_method && (
                <div className="order-section">
                    <h4>Livraison</h4>
                    <p><strong>Méthode :</strong> {orderDetails.shipping_method}</p>
                    <p><strong>Coût :</strong> {orderDetails.shipping_cost} {orderDetails.currency}</p>
                </div>
            )}

            {orderDetails.notes && (
              <div className="order-section">
                <h4>Notes de la Commande</h4>
                <p>{orderDetails.notes}</p>
              </div>
            )}

          </div>
        )}
        <div className="form-actions" style={{marginTop: '20px', display: 'flex', justifyContent: 'space-between'}}>
          <button type="button" onClick={() => alert(`Imprimer facture pour commande ${orderDetails?.order_number} (à implémenter)`)} className="action-btn print-btn" disabled={!orderDetails || isLoading}>
            🖨️ Imprimer Facture
          </button>
          <button type="button" onClick={onClose} className="cancel-btn">Fermer</button>
        </div>
      </div>
    </div>
  );
}
// Petit composant Text pour React Web (si tu n'importes pas react-native)
//const Text = ({children, style}) => <span style={style}>{children}</span>;


export default OrderDetailsModal;