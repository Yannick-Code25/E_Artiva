// // admin_panel/src/components/ProductFormModal.js
// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import './ProductFormModal.css'; // On créera ce fichier CSS

//   // Initialiser l'état du formulaire
//   const getInitialFormData = () => {
//     if (productToEdit && productToEdit.id) { // Vérifier si productToEdit est défini et a un ID (mode édition)
//       console.log("ProductFormModal: Mode ÉDITION, produit reçu:", productToEdit);
//       return {
//         name: productToEdit.name || '',
//         description: productToEdit.description || '',
//         price: productToEdit.price !== undefined ? String(productToEdit.price) : '',
//         stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '',
//         image_url: productToEdit.image_url || '',
//         sku: productToEdit.sku || '',
//         is_published: productToEdit.is_published || false,
//         // Les category_ids et tag_ids doivent être des tableaux d'IDs numériques
//         // Assure-toi que productToEdit.category_ids et productToEdit.tag_ids sont bien des tableaux d'IDs
//         // (venant de ton API GET /api/products/:id)
//         category_ids: productToEdit.category_ids || [], 
//         tag_ids: productToEdit.tag_ids || [],
//       };
//     } else { // Mode Ajout
//       console.log("ProductFormModal: Mode AJOUT");
//       return {
//         name: '', description: '', price: '', stock: '', image_url: '',
//         sku: '', is_published: false, category_ids: [], tag_ids: [],
//       };
//     }
//   };

//   const [formData, setFormData] = useState(getInitialFormData());
//   const [allCategories, setAllCategories] = useState([]);
//   const [allTags, setAllTags] = useState([]);
  
//   const [isLoadingOptions, setIsLoadingOptions] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false); // Chargement pour la soumission

//   const [error, setError] = useState('');

// // Re-calculer l'état initial du formulaire si productToEdit ou isOpen change
//   useEffect(() => {
//     console.log("ProductFormModal: useEffect pour productToEdit/isOpen. productToEdit:", productToEdit);
//     setFormData(getInitialFormData());
//   }, [productToEdit, isOpen]); // Dépendance importante !

//   // Charger les catégories et tags pour les sélecteurs/checkboxes
//   const fetchOptions = useCallback(async () => {
//     if (!isOpen) return;
//     console.log("ProductFormModal: Chargement des options (catégories/tags)");
//     setIsLoadingOptions(true); // Utiliser un état de chargement séparé pour les options
//     setError(''); // Réinitialiser l'erreur pour le chargement des options
//     try {
//       const [catRes, tagRes] = await Promise.all([
//         axios.get(`${apiBaseUrl}/categories`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
//         axios.get(`${apiBaseUrl}/product-tags`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
//       ]);
//       setAllCategories(catRes.data || []);
//       setAllTags(tagRes.data || []);
//       console.log("ProductFormModal: Options chargées.", {categories: catRes.data.length, tags: tagRes.data.length});
//     } catch (err) {
//       console.error("ProductFormModal: Erreur chargement options:", err);
//       setError("Impossible de charger les options de catégories/tags.");
//       setAllCategories([]);
//       setAllTags([]);
//     } finally {
//       setIsLoadingOptions(false);
//     }
//   }, [apiBaseUrl, adminToken, isOpen]); // isOpen en dépendance pour recharger si le modal s'ouvr

//   useEffect(() => {
//     fetchOptions();
//   }, [fetchOptions]);


//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//   };

//   const handleMultiSelectChange = (type, id) => {
//     const idNum = parseInt(id, 10);
//     setFormData(prev => {
//       const currentSelection = prev[type === 'category' ? 'category_ids' : 'tag_ids'];
//       const newSelection = currentSelection.includes(idNum)
//         ? currentSelection.filter(val => val !== idNum)
//         : [...currentSelection, idNum];
//       return {
//         ...prev,
//         [type === 'category' ? 'category_ids' : 'tag_ids']: newSelection,
//       };
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsSubmitting(true);

//     const payload = {
//       ...formData,
//       price: parseFloat(formData.price),
//       stock: parseInt(formData.stock, 10),
//       // category_ids et tag_ids sont déjà des tableaux d'ID (nombres)
//     };

//     // Retirer les champs vides ou non pertinents pour le payload si besoin
//     if (payload.sku === '') delete payload.sku;
//     if (payload.image_url === '') delete payload.image_url;

//     try {
//       if (productToEdit && productToEdit.id) { // Mode Édition
//         console.log(`ProductFormModal: Envoi MAJ pour produit ID ${productToEdit.id}`, payload);
//         await axios.put(`${apiBaseUrl}/products/${productToEdit.id}`, payload, {
//           headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
//         });
//       } else { // Mode Ajout
//         console.log("ProductFormModal: Envoi AJOUT nouveau produit", payload);
//         await axios.post(`${apiBaseUrl}/products`, payload, {
//           headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
//         });
//       }
//       onSave(); // Appelle la fonction pour recharger la liste et fermer le modal
//     }  catch (err) {
//       console.error("ProductFormModal: Erreur sauvegarde produit:", err);
//       setError(err.response?.data?.message || 'Erreur lors de la sauvegarde du produit.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <h2>{productToEdit ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</h2>
//         {isLoadingOptions && <p>Chargement des options...</p>}
//         {!isLoadingOptions && error && !isSubmitting && <p className="error-message-form">{error}</p>} 
//         {/* Afficher l'erreur de chargement des options seulement si pas en soumission */}
//         {!isLoadingOptions && success && !isSubmitting && <p className="success-message-form">{success}</p>} 
//         {/* Afficher le succès de la sauvegarde seulement si pas en soumission */}
//         {/* Le formulaire ne s'affiche que si les options ne chargent plus */}
//         {!isLoadingOptions && (
//           <form onSubmit={handleSubmit}>
//             {/* Nom */}
//             <div className="form-group">
//               <label htmlFor="modal-name">Nom :</label> {/* ID unique pour le label/input */}
//               <input type="text" name="name" id="modal-name" value={formData.name} onChange={handleChange} required />
//             </div>
//             {/* Description */}
//             <div className="form-group">
//               <label htmlFor="modal-description">Description :</label>
//               <textarea name="description" id="modal-description" value={formData.description} onChange={handleChange} />
//             </div>
//             {/* Prix & Stock */}
//             <div style={{display: 'flex', gap: '10px'}}>
//               <div className="form-group" style={{flex:1}}>
//                   <label htmlFor="modal-price">Prix (FCFA) :</label>
//                   <input type="number" name="price" id="modal-price" value={formData.price} onChange={handleChange} required step="0.01" />
//               </div>
//               <div className="form-group" style={{flex:1}}>
//                   <label htmlFor="modal-stock">Stock :</label>
//                   <input type="number" name="stock" id="modal-stock" value={formData.stock} onChange={handleChange} required step="1" />
//               </div>
//             </div>
//             {/* SKU & Image URL */}
//             <div style={{display: 'flex', gap: '10px'}}>
//               <div className="form-group" style={{flex:1}}>
//                   <label htmlFor="modal-sku">SKU :</label>
//                   <input type="text" name="sku" id="modal-sku" value={formData.sku} onChange={handleChange} />
//               </div>
//               <div className="form-group" style={{flex:1}}>
//                   <label htmlFor="modal-image_url">URL Image :</label>
//                   <input type="text" name="image_url" id="modal-image_url" value={formData.image_url} onChange={handleChange} />
//               </div>
//             </div>

//             {/* Catégories */}
//             <div className="form-group">
//               <label>Catégories :</label>
//               <div className="checkbox-group">
//                 {allCategories.length > 0 ? allCategories.map(cat => (
//                   <div key={`cat-opt-${cat.id}`} className="checkbox-item">
//                     <input 
//                       type="checkbox" 
//                       id={`modal-cat-${cat.id}`} 
//                       value={cat.id} 
//                       checked={formData.category_ids.includes(cat.id)}
//                       onChange={() => handleMultiSelectChange('category', cat.id)}
//                     />
//                     <label htmlFor={`modal-cat-${cat.id}`}>{cat.name}</label>
//                   </div>
//                 )) : <p>Aucune catégorie disponible.</p>}
//               </div>
//             </div>

//             {/* Tags */}
//             <div className="form-group">
//               <label>Tags :</label>
//               <div className="checkbox-group">
//                 {allTags.length > 0 ? allTags.map(tag => (
//                   <div key={`tag-opt-${tag.id}`} className="checkbox-item">
//                     <input 
//                       type="checkbox" 
//                       id={`modal-tag-${tag.id}`} 
//                       value={tag.id} 
//                       checked={formData.tag_ids.includes(tag.id)}
//                       onChange={() => handleMultiSelectChange('tag', tag.id)}
//                     />
//                     <label htmlFor={`modal-tag-${tag.id}`}>{tag.name}</label>
//                   </div>
//                 )) : <p>Aucun tag disponible.</p>}
//               </div>
//             </div>
            
//             {/* Publié */}
//             <div className="form-group checkbox-item" style={{marginTop: '10px'}}>
//               <input type="checkbox" name="is_published" id="modal-is_published" checked={formData.is_published} onChange={handleChange} />
//               <label htmlFor="modal-is_published">Publier ce produit ?</label>
//             </div>

//             {error && isSubmitting && <p className="error-message-form">{error}</p>} 
//             {/* Afficher l'erreur de soumission seulement si en soumission */}
//             <div className="form-actions">
//               <button type="submit" disabled={isSubmitting || isLoadingOptions} className="save-btn">
//                 {isSubmitting ? 'Sauvegarde...' : (productToEdit ? 'Mettre à Jour' : 'Ajouter Produit')}
//               </button>
//               <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>Annuler</button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }


// export default ProductFormModal;








// admin_panel/src/components/ProductFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ProductFormModal.css';

function ProductFormModal({ isOpen, onClose, onSave, productToEdit, apiBaseUrl, adminToken }) {
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getInitialFormData = useCallback(() => {
    if (productToEdit && productToEdit.id) {
      console.log("ProductFormModal: Mode ÉDITION, produit reçu:", productToEdit);
      return {
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price !== undefined ? String(productToEdit.price) : '',
        stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '',
        image_url: productToEdit.image_url || '',
        sku: productToEdit.sku || '',
        is_published: productToEdit.is_published || false,
        category_ids: productToEdit.category_ids || [], 
        tag_ids: productToEdit.tag_ids || [],
      };
    } else {
      console.log("ProductFormModal: Remplissage pour AJOUT (vide)");
      return {
        name: '', description: '', price: '', stock: '', image_url: '',
        sku: '', is_published: false, category_ids: [], tag_ids: [],
      };
    }
  }, [productToEdit]);

  const [formData, setFormData] = useState(getInitialFormData());
  const [allCategories, setAllCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("ProductFormModal: useEffect pour productToEdit/isOpen. productToEdit:", productToEdit);
    setFormData(getInitialFormData());
  }, [productToEdit, isOpen, getInitialFormData]); 

  const fetchOptions = useCallback(async () => {
    if (!isOpen) return;
    console.log("ProductFormModal: Chargement des options (catégories/tags)");
    setIsLoadingOptions(true); 
    setError(''); 
    try {
      const [catRes, tagRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/categories`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
        axios.get(`${apiBaseUrl}/product-tags`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
      ]);
      setAllCategories(catRes.data || []);
      setAllTags(tagRes.data || []);
      console.log("ProductFormModal: Options chargées.", {categories: catRes.data.length, tags: tagRes.data.length});
    } catch (err) {
      console.error("ProductFormModal: Erreur chargement options:", err);
      setError("Impossible de charger les options de catégories/tags.");
      setAllCategories([]);
      setAllTags([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [apiBaseUrl, adminToken, isOpen]); 

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMultiSelectChange = (type, id) => {
    const idNum = parseInt(id, 10);
    setFormData(prev => {
      const currentSelection = prev[type === 'category' ? 'category_ids' : 'tag_ids'];
      const newSelection = currentSelection.includes(idNum)
        ? currentSelection.filter(val => val !== idNum)
        : [...currentSelection, idNum];
      return {
        ...prev,
        [type === 'category' ? 'category_ids' : 'tag_ids']: newSelection,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price), 
      stock: parseInt(formData.stock, 10), 
    };
    
    if (payload.sku === '') delete payload.sku;
    if (payload.image_url === '') delete payload.image_url;


    try {
      if (productToEdit && productToEdit.id) { 
        console.log(`ProductFormModal: Envoi MAJ pour produit ID ${productToEdit.id}`, payload);
        await axios.put(`${apiBaseUrl}/products/${productToEdit.id}`, payload, {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        });
      } else { 
        console.log("ProductFormModal: Envoi AJOUT nouveau produit", payload);
        await axios.post(`${apiBaseUrl}/products`, payload, {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        });
      }
      onSave(); 
    } catch (err) {
      console.error("ProductFormModal: Erreur sauvegarde produit:", err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde du produit.');
    } finally {
      setIsSubmitting(false);
    }
  }; // <<< L'ACCOLADE FERMANTE DE handleSubmit DOIT ÊTRE ICI

  // Le 'return' principal du composant ProductFormModal commence ici
  if (!isOpen) return null; 

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{productToEdit ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</h2>
        
        {isLoadingOptions && <p>Chargement des options...</p>}
        {!isLoadingOptions && error && !isSubmitting && <p className="error-message-form">{error}</p>} 
        
        {!isLoadingOptions && (
          <form onSubmit={handleSubmit}>
            {/* Nom */}
            <div className="form-group">
              <label htmlFor="modal-name">Nom :</label>
              <input type="text" name="name" id="modal-name" value={formData.name} onChange={handleChange} required />
            </div>
            {/* Description */}
            <div className="form-group">
              <label htmlFor="modal-description">Description :</label>
              <textarea name="description" id="modal-description" value={formData.description} onChange={handleChange} />
            </div>
            {/* Prix & Stock */}
            <div style={{display: 'flex', gap: '10px'}}>
              <div className="form-group" style={{flex:1}}>
                  <label htmlFor="modal-price">Prix (FCFA) :</label>
                  <input type="number" name="price" id="modal-price" value={formData.price} onChange={handleChange} required/>
              </div>
              <div className="form-group" style={{flex:1}}>
                  <label htmlFor="modal-stock">Stock :</label>
                  <input type="number" name="stock" id="modal-stock" value={formData.stock} onChange={handleChange} required/>
              </div>
            </div>
            {/* SKU & Image URL */}
            <div style={{display: 'flex', gap: '10px'}}>
              <div className="form-group" style={{flex:1}}>
                  <label htmlFor="modal-sku">SKU :</label>
                  <input type="text" name="sku" id="modal-sku" value={formData.sku} onChange={handleChange} />
              </div>
              <div className="form-group" style={{flex:1}}>
                  <label htmlFor="modal-image_url">URL Image :</label>
                  <input type="text" name="image_url" id="modal-image_url" value={formData.image_url} onChange={handleChange} />
              </div>
            </div>

            {/* Catégories */}
            <div className="form-group">
              <label>Catégories :</label>
              <div className="checkbox-group">
                {allCategories.length > 0 ? allCategories.map(cat => (
                  <div key={`cat-opt-${cat.id}`} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      id={`modal-cat-${cat.id}`} 
                      value={cat.id} 
                      checked={formData.category_ids.includes(cat.id)}
                      onChange={() => handleMultiSelectChange('category', cat.id)}
                    />
                    <label htmlFor={`modal-cat-${cat.id}`}>{cat.name}</label>
                  </div>
                )) : <p>Aucune catégorie disponible.</p>}
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label>Tags :</label>
              <div className="checkbox-group">
                {allTags.length > 0 ? allTags.map(tag => (
                  <div key={`tag-opt-${tag.id}`} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      id={`modal-tag-${tag.id}`} 
                      value={tag.id} 
                      checked={formData.tag_ids.includes(tag.id)}
                      onChange={() => handleMultiSelectChange('tag', tag.id)}
                    />
                    <label htmlFor={`modal-tag-${tag.id}`}>{tag.name}</label>
                  </div>
                )) : <p>Aucun tag disponible.</p>}
              </div>
            </div>
            
            {/* Publié */}
            <div className="form-group checkbox-item" style={{marginTop: '10px'}}>
              <input type="checkbox" name="is_published" id="modal-is_published" checked={formData.is_published} onChange={handleChange} />
              <label htmlFor="modal-is_published">Publier ce produit ?</label>
            </div>

            {error && isSubmitting && <p className="error-message-form">{error}</p>} 
            <div className="form-actions">
              <button type="submit" disabled={isSubmitting || isLoadingOptions} className="save-btn">
                {isSubmitting ? 'Sauvegarde...' : (productToEdit ? 'Mettre à Jour' : 'Ajouter Produit')}
              </button>
              <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} // <<< L'ACCOLADE FERMANTE DE ProductFormModal DOIT ÊTRE ICI

export default ProductFormModal;