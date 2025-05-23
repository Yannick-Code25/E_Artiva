// ARTIVA/back_end/controllers/productController.js
const db = require("../config/db");

// --- Créer un nouveau produit (Admin) ---
exports.createProduct = async (req, res) => {
  const { 
    name, description, price, stock, image_url, 
    sku, is_published, // Champs pour la table products
    category_ids, tag_ids // Tableaux d'IDs pour les liaisons
  } = req.body;

  // Validation des champs principaux
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Le nom, le prix et le stock du produit sont requis.' });
  }
  const parsedPrice = parseFloat(price);
  const parsedStock = parseInt(stock, 10);
  // Si is_published n'est pas envoyé, il sera false par défaut grâce à la DB ou ici
  const publishedStatus = is_published !== undefined ? Boolean(is_published) : false; 

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: 'Le prix doit être un nombre positif ou nul.' });
  }
  if (isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: 'Le stock doit être un entier positif ou nul.' });
  }

  const client = await db.pool.connect(); // Obtenir un client du pool pour la transaction

  try {
    await client.query('BEGIN'); // Démarrer la transaction

    // Insérer le produit principal
    const productQuery = `
      INSERT INTO products (name, description, price, stock, image_url, sku, is_published) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`; // RETURNING * récupère tous les champs du produit inséré
    const productResult = await client.query(productQuery, [
      name, 
      description || null, 
      parsedPrice, 
      parsedStock, 
      image_url || null, 
      sku || null, // SKU peut être unique, géré par la BDD
      publishedStatus
    ]);
    const createdProduct = productResult.rows[0];
    console.log(`Produit créé ID: ${createdProduct.id}, Nom: ${createdProduct.name}`);

    // Lier les catégories si fournies
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      console.log(`Liaison du produit ${createdProduct.id} aux catégories: ${category_ids.join(', ')}`);
      const categoryPromises = category_ids
        .map(id => parseInt(id, 10)) // Convertir en nombres
        .filter(idNum => !isNaN(idNum)) // Filtrer les NaN
        .map(validCategoryId => {
          console.log(`  -> Ajout lien catégorie ID: ${validCategoryId}`);
          return client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [createdProduct.id, validCategoryId]);
        });
      if (categoryPromises.length > 0) await Promise.all(categoryPromises);
    }

    // Lier les tags si fournis
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      console.log(`Liaison du produit ${createdProduct.id} aux tags: ${tag_ids.join(', ')}`);
      const tagPromises = tag_ids
        .map(id => parseInt(id, 10)) // Convertir en nombres
        .filter(idNum => !isNaN(idNum)) // Filtrer les NaN
        .map(validTagId => {
          console.log(`  -> Ajout lien tag ID: ${validTagId}`);
          return client.query('INSERT INTO product_tag_assignments (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [createdProduct.id, validTagId]);
        });
      if (tagPromises.length > 0) await Promise.all(tagPromises);
    }

    await client.query('COMMIT'); // Valider la transaction
    res.status(201).json({ message: 'Produit créé avec succès!', product: createdProduct });

  } catch (error) {
    await client.query('ROLLBACK'); // Annuler la transaction en cas d'erreur
    console.error('Erreur détaillée lors de la création du produit:', error);
    if (error.code === '23505') { // Violation de contrainte unique (ex: SKU ou nom de produit si unique)
        return res.status(409).json({ message: 'Conflit de données. Un produit avec un identifiant unique (comme SKU ou nom) similaire existe déjà.', detail: error.detail });
    }
    if (error.code === '23503') { // Violation de clé étrangère (ex: category_id ou tag_id inexistant)
        return res.status(400).json({ message: 'Référence invalide. Une catégorie ou un tag spécifié n\'existe pas.', detail: error.detail });
    }
    res.status(500).json({ message: 'Erreur serveur lors de la création du produit.' });
  } finally {
    client.release(); // Toujours rendre le client au pool
  }
};

// --- Récupérer tous les produits (Publique) ---
exports.getAllProducts = async (req, res) => {
  try {
    // Requête pour lister les produits publiés, avec les noms de leurs catégories et tags
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image_url, -- Colonne image principale de la table products
        p.sku,
        p.is_published,
        p.created_at,
        p.updated_at,
        (SELECT ARRAY_AGG(c.name ORDER BY c.name) 
         FROM categories c 
         JOIN product_categories pc ON c.id = pc.category_id 
         WHERE pc.product_id = p.id) as categories_names,
        (SELECT ARRAY_AGG(t.name ORDER BY t.name) 
         FROM product_tags t 
         JOIN product_tag_assignments pta ON t.id = pta.tag_id 
         WHERE pta.product_id = p.id) as tags_names
      FROM products p
      WHERE p.is_published = TRUE -- Afficher uniquement les produits publiés
      ORDER BY p.created_at DESC; 
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les produits:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des produits.' });
  }
};

// --- Récupérer un produit par son ID (Publique) ---
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const productQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.image_url, 
        p.sku, p.is_published, p.created_at, p.updated_at,
        (SELECT ARRAY_AGG(c.id ORDER BY c.name) -- Récupérer les ID des catégories
         FROM categories c 
         JOIN product_categories pc ON c.id = pc.category_id 
         WHERE pc.product_id = p.id) as category_ids,
        (SELECT ARRAY_AGG(t.id ORDER BY t.name) -- Récupérer les ID des tags
         FROM product_tags t 
         JOIN product_tag_assignments pta ON t.id = pta.tag_id 
         WHERE pta.product_id = p.id) as tag_ids,
        (SELECT ARRAY_AGG(c.name ORDER BY c.name) 
         FROM categories c 
         JOIN product_categories pc ON c.id = pc.category_id 
         WHERE pc.product_id = p.id) as categories_names,
        (SELECT ARRAY_AGG(t.name ORDER BY t.name) 
         FROM product_tags t 
         JOIN product_tag_assignments pta ON t.id = pta.tag_id 
         WHERE pta.product_id = p.id) as tags_names
      FROM products p
      WHERE p.id = $1; -- Un admin pourrait vouloir voir un produit non publié par son ID
      -- Si tu veux que ce soit public et ne montre que les publiés : WHERE p.id = $1 AND p.is_published = TRUE;
    `;
    const { rows } = await db.query(productQuery, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }
    // Remplacer les tableaux NULL par des tableaux vides si aucune catégorie/tag n'est associé
    const product = rows[0];
    if (product.category_ids === null) product.category_ids = [];
    if (product.tag_ids === null) product.tag_ids = [];
    if (product.categories_names === null) product.categories_names = [];
    if (product.tags_names === null) product.tags_names = [];

    res.status(200).json(product);
  } catch (error) {
    console.error(`Erreur récupération produit ID ${id}:`, error);
    res.status(500).json({ message: 'Erreur serveur récupération produit.' });
  }
};

// --- Mettre à jour un produit (Admin) ---
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url, sku, is_published, category_ids, tag_ids } = req.body;

  // Construire dynamiquement la requête de mise à jour pour ne modifier que les champs fournis
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
  if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description || null); }
  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ message: 'Prix invalide.' });
    fields.push(`price = $${paramIndex++}`); values.push(parsedPrice);
  }
  if (stock !== undefined) {
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) return res.status(400).json({ message: 'Stock invalide.' });
    fields.push(`stock = $${paramIndex++}`); values.push(parsedStock);
  }
  if (image_url !== undefined) { fields.push(`image_url = $${paramIndex++}`); values.push(image_url || null); }
  if (sku !== undefined) { fields.push(`sku = $${paramIndex++}`); values.push(sku || null); }
  if (is_published !== undefined) { fields.push(`is_published = $${paramIndex++}`); values.push(Boolean(is_published)); }
  
  if (fields.length === 0 && !category_ids && !tag_ids) { // Si rien n'est à mettre à jour (sauf potentiellement les liaisons)
    // Si seulement les liaisons sont à mettre à jour, on peut quand même continuer.
    // Si même les liaisons ne sont pas à mettre à jour, on pourrait retourner une erreur ou le produit tel quel.
    // Pour cet exemple, on suppose qu'une mise à jour sans champs de produit mais avec category/tag ids est valide
    // pour juste changer les liaisons.
    if (fields.length === 0 && (!category_ids || category_ids.length === 0) && (!tag_ids || tag_ids.length === 0)) {
        return res.status(400).json({ message: 'Aucun champ à mettre à jour pour le produit.' });
    }
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let updatedProduct;

    if (fields.length > 0) {
        fields.push(`updated_at = CURRENT_TIMESTAMP`); // Toujours mettre à jour updated_at
        const updateProductQuery = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
        values.push(id);
        const updatedProductResult = await client.query(updateProductQuery, values);
    
        if (updatedProductResult.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(404).json({ message: 'Produit non trouvé pour la mise à jour.' });
        }
        updatedProduct = updatedProductResult.rows[0];
    } else {
        // Si aucun champ du produit n'est mis à jour, récupérer le produit pour la réponse
        const currentProductResult = await client.query('SELECT * FROM products WHERE id = $1', [id]);
        if (currentProductResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }
        updatedProduct = currentProductResult.rows[0];
    }


    // Gérer les catégories : supprimer les anciennes liaisons, ajouter les nouvelles
    if (category_ids !== undefined) { // Permet d'envoyer un tableau vide pour tout délier
        await client.query('DELETE FROM product_categories WHERE product_id = $1', [id]);
        if (Array.isArray(category_ids) && category_ids.length > 0) {
            const catPromises = category_ids
            .map(cId => parseInt(cId, 10)).filter(cId => !isNaN(cId))
            .map(catId => client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, catId]));
            if (catPromises.length > 0) await Promise.all(catPromises);
        }
    }

    // Gérer les tags : supprimer les anciennes liaisons, ajouter les nouvelles
    if (tag_ids !== undefined) { // Permet d'envoyer un tableau vide pour tout délier
        await client.query('DELETE FROM product_tag_assignments WHERE product_id = $1', [id]);
        if (Array.isArray(tag_ids) && tag_ids.length > 0) {
            const tagPromises = tag_ids
            .map(tId => parseInt(tId, 10)).filter(tId => !isNaN(tId))
            .map(tagId => client.query('INSERT INTO product_tag_assignments (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagId]));
            if (tagPromises.length > 0) await Promise.all(tagPromises);
        }
    }

    await client.query('COMMIT');
    
    // Récupérer le produit mis à jour avec ses nouvelles liaisons pour la réponse
    const finalProductQuery = `
      SELECT p.*, 
             (SELECT ARRAY_AGG(c.name) FROM categories c JOIN product_categories pc ON c.id = pc.category_id WHERE pc.product_id = p.id) as categories_names,
             (SELECT ARRAY_AGG(t.name) FROM product_tags t JOIN product_tag_assignments pta ON t.id = pta.tag_id WHERE pta.product_id = p.id) as tags_names
      FROM products p WHERE p.id = $1;`;
    const finalProductResult = await db.query(finalProductQuery, [id]); // Utilise db.query ici car la transaction est finie


    res.status(200).json({ message: 'Produit mis à jour avec succès!', product: finalProductResult.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Erreur mise à jour produit ID ${id}:`, error);
    if (error.code === '23505') return res.status(409).json({ message: 'Conflit de données (ex: SKU).', detail: error.detail });
    if (error.code === '23503') return res.status(400).json({ message: 'Référence invalide (catégorie/tag).', detail: error.detail });
    res.status(500).json({ message: 'Erreur serveur mise à jour produit.' });
  } finally {
    client.release();
  }
};

// --- Supprimer un produit (Admin) ---
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  // Les liaisons dans product_categories et product_tag_assignments seront supprimées
  // automatiquement grâce à ON DELETE CASCADE.
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const deleteQuery = 'DELETE FROM products WHERE id = $1 RETURNING *;';
    const result = await client.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK'); // Pas nécessaire si rien n'a été supprimé, mais par sécurité
      client.release();
      return res.status(404).json({ message: 'Produit non trouvé pour la suppression.' });
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Produit supprimé avec succès.', product: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Erreur suppression produit ID ${id}:`, error);
    res.status(500).json({ message: 'Erreur serveur suppression produit.' });
  } finally {
    if (client) client.release(); // S'assurer que client est défini avant release
  }
};
