// ARTIVA/back_end/controllers/productController.js
const db = require("../config/db");

// --- Créer un nouveau produit (Admin) ---
exports.createProduct = async (req, res) => {
  const { 
    name, description, price, stock, image_url, 
    sku, is_published, // Champs pour la table products
    category_ids, tag_ids, // Tableaux d'IDs pour les liaisons
    images // NOUVEAU : Attend un tableau d'objets image. Ex: [{image_url: "url1", is_primary: true}, {image_url: "url2"}]
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

    // Utiliser une image principale si 'images' n'est pas fourni ou est vide, mais 'image_url' l'est
    let mainImageUrlFromRoot = req.body.image_url || null;

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
      mainImageUrlFromRoot, // On insère l'image principale ici pour la table 'products' 
      sku || null, // SKU peut être unique, géré par la BDD
      publishedStatus
    ]);
    const createdProduct = productResult.rows[0];
    console.log(`Produit créé ID: ${createdProduct.id}, Nom: ${createdProduct.name}`);

    // Gérer les images multiples de la table product_images
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`Ajout de ${images.length} images pour le produit ${createdProduct.id}`);
      const imagePromises = images.map((img, index) => {
        if (!img.image_url) return Promise.resolve(); // Ignorer si pas d'URL
        console.log(`  -> Ajout image URL: ${img.image_url}`);
        return client.query(
          'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES ($1, $2, $3, $4, $5)',
          [createdProduct.id, img.image_url, img.alt_text || null, img.is_primary || false, img.display_order || index]
        );
      });
      await Promise.all(imagePromises.filter(p => p)); // Filtrer les promesses nulles
    } else if (mainImageUrlFromRoot) {
      // Si pas de tableau 'images' mais une 'image_url' principale, l'ajouter à product_images aussi
      console.log(`Ajout de l'image principale ${mainImageUrlFromRoot} à product_images pour le produit ${createdProduct.id}`);
      await client.query(
        'INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES ($1, $2, TRUE, 0)',
        [createdProduct.id, mainImageUrlFromRoot]
      );
    }

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
// exports.getAllProducts = async (req, res) => {
//   const { 
//     category_id, 
//     tag_id,      
//     tag_name,    
//     limit,       
//     random,      
//     search       
//   } = req.query;

//   try {
//     let queryParams = [];
//     let paramIndex = 1;
    
//     // Note: SELECT DISTINCT ON (p.id) a été retiré
//     let baseQuery = `
//       SELECT 
//         p.id, p.name, p.description, p.price, p.stock, p.image_url, 
//         p.sku, p.is_published, p.created_at, p.updated_at,
//         (SELECT ARRAY_AGG(c.name ORDER BY c.name) 
//          FROM categories c 
//          JOIN product_categories pc_names ON c.id = pc_names.category_id 
//          WHERE pc_names.product_id = p.id) as categories_names,
//         (SELECT ARRAY_AGG(pc.category_id)
//          FROM product_categories pc
//          WHERE pc.product_id = p.id) as category_ids,
//         (SELECT ARRAY_AGG(t.name ORDER BY t.name) 
//          FROM product_tags t 
//          JOIN product_tag_assignments pta_names ON t.id = pta_names.tag_id 
//          WHERE pta_names.product_id = p.id) as tags_names,
//         (SELECT ARRAY_AGG(pta.tag_id)
//          FROM product_tag_assignments pta
//          WHERE pta.product_id = p.id) as tag_ids
//       FROM products p
//     `;
    
//     let joinClauses = "";
//     let whereClauses = ["p.is_published = TRUE", "p.stock > 0"];

//     // Ajout : Filtrer par category_id
//     if (category_id) {
//       joinClauses += ` JOIN product_categories pc_filter ON p.id = pc_filter.product_id`;
//       whereClauses.push(`pc_filter.category_id = $${paramIndex++}`);
//       queryParams.push(parseInt(category_id, 10));
//     }

//     if (tag_id) {
//       joinClauses += ` JOIN product_tag_assignments pta_filter ON p.id = pta_filter.product_id`;
//       whereClauses.push(`pta_filter.tag_id = $${paramIndex++}`);
//       queryParams.push(parseInt(tag_id, 10));
//     } else if (tag_name) {
//       joinClauses += ` JOIN product_tag_assignments pta_filter ON p.id = pta_filter.product_id JOIN product_tags pt_filter ON pta_filter.tag_id = pt_filter.id`;
//       whereClauses.push(`pt_filter.name = $${paramIndex++}`);
//       queryParams.push(tag_name);
//     }

//     if (search) {
//       whereClauses.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
//       queryParams.push(`%${search}%`);
//       paramIndex++;
//     }

//     let finalQuery = baseQuery + joinClauses;
//     if (whereClauses.length > 0) {
//       finalQuery += ` WHERE ${whereClauses.join(' AND ')}`;
//     }

//     if (random === 'true' || random === true) {
//       finalQuery += " ORDER BY RANDOM()";
//     } else {
//       finalQuery += " ORDER BY p.created_at DESC"; 
//     }

//     // La requête pour COUNT doit avoir les mêmes JOINs et WHERE que la requête principale
//     let countQuery = `SELECT COUNT(DISTINCT p.id) FROM products p ${joinClauses}`;
//     if (whereClauses.length > 0) {
//         countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
//     }
//     const countResult = await db.query(countQuery, queryParams.slice(0, paramIndex -1));
//     const totalItems = parseInt(countResult.rows[0].count, 10);
//     const totalPages = Math.ceil(totalItems / (parseInt(limit, 10) || 20));

//     if (limit) {
//       finalQuery += ` LIMIT $${paramIndex++}`;
//       queryParams.push(parseInt(limit, 10));
//     } else {
//       finalQuery += ` LIMIT $${paramIndex++}`; 
//       queryParams.push(20); 
//     }
//     // Ajout de OFFSET pour la pagination
//     const offset = ( (parseInt(req.query.page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);
//     finalQuery += ` OFFSET $${paramIndex++}`;
//     queryParams.push(offset);

//     console.log("SQL pour getAllProducts:", finalQuery);
//     console.log("Params pour getAllProducts:", queryParams);

//     const { rows } = await db.query(finalQuery, queryParams);
    
//     const productsData = rows.map(product => ({
//         ...product,
//         category_ids: product.category_ids || [],
//         categories_names: product.categories_names || [],
//         tag_ids: product.tag_ids || [],
//         tags_names: product.tags_names || []
//     }));

//     // Si aucun produit n'est trouvé, renvoyer un tableau vide
//     if (!productsData || productsData.length === 0) {
//         return res.status(200).json({
//             products: [],
//             currentPage: parseInt(req.query.page, 10) || 1,
//             totalPages: 0,
//             totalItems: 0
//         });
//     }

//     res.status(200).json({
//         products: productsData,
//         currentPage: parseInt(req.query.page, 10) || 1,
//         totalPages,
//         totalItems
//     });

//   } catch (error) {
//     console.error('Erreur lors de la récupération de tous les produits:', error);
//     res.status(500).json({ message: 'Erreur serveur lors de la récupération des produits.' });
//   }
// };
// --- Récupérer tous les produits (Publique) ---
exports.getAllProducts = async (req, res) => {
  const { 
    category_id, 
    tag_id,      
    tag_name,    
    limit,       
    random,      
    search       
  } = req.query;

  try {
    let queryParams = [];
    let paramIndex = 1;
    
    // Note: SELECT DISTINCT ON (p.id) a été retiré
    let baseQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.image_url, 
        p.sku, p.is_published, p.created_at, p.updated_at,
        (SELECT ARRAY_AGG(c.name ORDER BY c.name) 
         FROM categories c 
         JOIN product_categories pc_names ON c.id = pc_names.category_id 
         WHERE pc_names.product_id = p.id) as categories_names,
        (SELECT ARRAY_AGG(pc.category_id)
         FROM product_categories pc
         WHERE pc.product_id = p.id) as category_ids,
        (SELECT ARRAY_AGG(t.name ORDER BY t.name) 
         FROM product_tags t 
         JOIN product_tag_assignments pta_names ON t.id = pta_names.tag_id 
         WHERE pta_names.product_id = p.id) as tags_names,
        (SELECT ARRAY_AGG(pta.tag_id)
         FROM product_tag_assignments pta
         WHERE pta.product_id = p.id) as tag_ids
      FROM products p
    `;
    
    let joinClauses = "";
    let whereClauses = ["p.is_published = TRUE", "p.stock > 0"];

    // Ajout : Filtrer par category_id
    if (category_id) {
      joinClauses += ` JOIN product_categories pc_filter ON p.id = pc_filter.product_id`;
      whereClauses.push(`pc_filter.category_id = $${paramIndex++}`);
      queryParams.push(parseInt(category_id, 10));
    }

    if (tag_id) {
      joinClauses += ` JOIN product_tag_assignments pta_filter ON p.id = pta_filter.product_id`;
      whereClauses.push(`pta_filter.tag_id = $${paramIndex++}`);
      queryParams.push(parseInt(tag_id, 10));
    } else if (tag_name) {
      joinClauses += ` JOIN product_tag_assignments pta_filter ON p.id = pta_filter.product_id JOIN product_tags pt_filter ON pta_filter.tag_id = pt_filter.id`;
      whereClauses.push(`pt_filter.name = $${paramIndex++}`);
      queryParams.push(tag_name);
    }

      if (search) {
          whereClauses.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
          queryParams.push(`%${search}%`);
          paramIndex++;
      }

    let finalQuery = baseQuery + joinClauses;
    if (whereClauses.length > 0) {
      finalQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (random === 'true' || random === true) {
      finalQuery += " ORDER BY RANDOM()";
    } else {
      finalQuery += " ORDER BY p.created_at DESC"; 
    }

    // La requête pour COUNT doit avoir les mêmes JOINs et WHERE que la requête principale
    let countQuery = `SELECT COUNT(DISTINCT p.id) FROM products p ${joinClauses}`;
    if (whereClauses.length > 0) {
        countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    const countResult = await db.query(countQuery, queryParams.slice(0, paramIndex -1));
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / (parseInt(limit, 10) || 20));

    if (limit) {
      finalQuery += ` LIMIT $${paramIndex++}`;
      queryParams.push(parseInt(limit, 10));
    } else {
      finalQuery += ` LIMIT $${paramIndex++}`; 
      queryParams.push(20); 
    }
    // Ajout de OFFSET pour la pagination
    const offset = ( (parseInt(req.query.page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);
    finalQuery += ` OFFSET $${paramIndex++}`;
    queryParams.push(offset);

    console.log("SQL pour getAllProducts:", finalQuery);
    console.log("Params pour getAllProducts:", queryParams);

    const { rows } = await db.query(finalQuery, queryParams);
    
    const productsData = rows.map(product => ({
        ...product,
        category_ids: product.category_ids || [],
        categories_names: product.categories_names || [],
        tag_ids: product.tag_ids || [],
        tags_names: product.tags_names || []
    }));

    // Si aucun produit n'est trouvé, renvoyer un tableau vide
    if (!productsData || productsData.length === 0) {
        return res.status(200).json({
            products: [],
            currentPage: parseInt(req.query.page, 10) || 1,
            totalPages: 0,
            totalItems: 0
        });
    }

    res.status(200).json({
        products: productsData,
        currentPage: parseInt(req.query.page, 10) || 1,
        totalPages,
        totalItems
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de tous les produits:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des produits.' });
  }
};




// --- Récupérer un produit par son ID (pour le public ou admin) ---

exports.getProductById = async (req, res) => {
  const { id } = req.params; // L'ID du produit demandé

  try {
    const productQuery = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.stock, 
        p.image_url AS main_image_url, -- On renomme p.image_url en main_image_url pour éviter confusion
        p.sku, 
        p.is_published, 
        p.created_at, 
        p.updated_at,
        -- Sous-requête pour récupérer toutes les images de la table 'product_images' associées à ce produit
        (SELECT ARRAY_AGG(
            json_build_object(
              'id', pi.id,                   -- ID de l'enregistrement dans product_images
              'image_url', pi.image_url,     -- URL de l'image de la galerie
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'display_order', pi.display_order
            ) ORDER BY pi.display_order ASC, pi.is_primary DESC NULLS LAST -- Ordonner les images
         ) 
         FROM product_images pi 
         WHERE pi.product_id = p.id
        ) as images, -- Ce champ 'images' sera un tableau d'objets image

        -- Sous-requête pour les IDs des catégories
        (SELECT ARRAY_AGG(pc.category_id ORDER BY c.name)
         FROM categories c 
         JOIN product_categories pc ON c.id = pc.category_id 
         WHERE pc.product_id = p.id
        ) as category_ids,

        -- Sous-requête pour les noms des catégories
        (SELECT ARRAY_AGG(c.name ORDER BY c.name) 
         FROM categories c 
         JOIN product_categories pc ON c.id = pc.category_id 
         WHERE pc.product_id = p.id
        ) as categories_names,

        -- Sous-requête pour les IDs des tags
        (SELECT ARRAY_AGG(pta.tag_id ORDER BY t.name)
         FROM product_tags t 
         JOIN product_tag_assignments pta ON t.id = pta.tag_id 
         WHERE pta.product_id = p.id
        ) as tag_ids,

        -- Sous-requête pour les noms des tags
        (SELECT ARRAY_AGG(t.name ORDER BY t.name) 
         FROM product_tags t 
         JOIN product_tag_assignments pta ON t.id = pta.tag_id 
         WHERE pta.product_id = p.id
        ) as tags_names
      FROM products p
      WHERE p.id = $1 
      -- Si cette route est pour le public et ne doit montrer que les produits publiés :
      -- AND p.is_published = TRUE; 
      -- Si c'est aussi pour l'admin (ex: pour modifier), tu peux retirer le filtre is_published
      -- ou avoir une logique pour l'appliquer conditionnellement.
      -- Pour l'instant, je le laisse sans le filtre is_published pour que l'admin puisse voir tout.
    `;

    const { rows } = await db.query(productQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    const product = rows[0]; 

    // `ARRAY_AGG` retourne NULL si aucune ligne n'est agrégée.
    // On s'assure que 'images', 'category_ids', etc., sont des tableaux vides si NULL.
    product.images = product.images || [];
    product.category_ids = product.category_ids || [];
    product.categories_names = product.categories_names || [];
    product.tag_ids = product.tag_ids || [];
    product.tags_names = product.tags_names || [];

    // Si le tableau 'images' est vide après la sous-requête (aucune image dans product_images)
    // ET que le produit a une 'main_image_url' (ancienne colonne image_url de la table products),
    // on peut créer un tableau 'images' avec cette image principale comme fallback.
    if (product.images.length === 0 && product.main_image_url) {
      product.images = [{ 
        id: `main_${product.id}`, // Générer un ID temporaire/descriptif
        image_url: product.main_image_url, 
        is_primary: true, 
        display_order: 0 
      }];
    }else if (product.images === null) { // Double sécurité si la ligne précédente n'a pas suffi
      product.images = [];
  }
    // On peut maintenant supprimer main_image_url de l'objet final si on ne veut pas de redondance
    // delete product.main_image_url; // Optionnel

    res.status(200).json(product);

  } catch (error) {
    console.error(`Erreur récupération produit ID ${id}:`, error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du produit.' });
  }
};

// --- Mettre à jour un produit (Admin) ---
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url, sku, is_published, category_ids, tag_ids,images // NOUVEAU : Tableau d'objets image pour product_images 
  } = req.body;

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

    // Gérer les images multiples pour product_images
    if (images !== undefined) { // Si le tableau 'images' est explicitement fourni (même vide)
      console.log(`Mise à jour des images pour le produit ${id}. Tableau reçu:`, images);
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]); // Supprimer les anciennes
      if (Array.isArray(images) && images.length > 0) {
        const imagePromises = images.map((img, index) => {
          if (!img.image_url) return Promise.resolve();
          console.log(`  -> Ajout/MAJ image URL: ${img.image_url}`);
          return client.query(
            'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES ($1, $2, $3, $4, $5)',
            [id, img.image_url, img.alt_text || null, img.is_primary || false, img.display_order || index]
          );
        });
        await Promise.all(imagePromises.filter(p => p));
      }
    }
    // Si 'images' n'est pas dans req.body, on ne touche pas à product_images.
    // Si 'images' est un tableau vide, toutes les images de product_images sont supprimées.

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
     const finalProductResult = await db.query( /* ... ta requête SELECT complète de getProductById ... */ `
      SELECT p.*, 
             (SELECT ARRAY_AGG(json_build_object('id', pi.id, 'image_url', pi.image_url, 'alt_text', pi.alt_text, 'is_primary', pi.is_primary, 'display_order', pi.display_order) ORDER BY pi.display_order, pi.is_primary DESC) FROM product_images pi WHERE pi.product_id = p.id) as images,
             (SELECT ARRAY_AGG(pc.category_id) FROM product_categories pc WHERE pc.product_id = p.id) as category_ids,
             (SELECT ARRAY_AGG(c.name) FROM categories c JOIN product_categories pc ON c.id = pc.category_id WHERE pc.product_id = p.id) as categories_names,
             (SELECT ARRAY_AGG(pta.tag_id) FROM product_tag_assignments pta WHERE pta.product_id = p.id) as tag_ids,
             (SELECT ARRAY_AGG(t.name) FROM product_tags t JOIN product_tag_assignments pta ON t.id = pta.tag_id WHERE pta.product_id = p.id) as tags_names
      FROM products p WHERE p.id = $1;`, [id]);

    const finalProduct = finalProductResult.rows[0];
    finalProduct.images = finalProduct.images || [];
    finalProduct.category_ids = finalProduct.category_ids || [];
    finalProduct.categories_names = finalProduct.categories_names || [];
    finalProduct.tag_ids = finalProduct.tag_ids || [];
    finalProduct.tags_names = finalProduct.tags_names || [];


  res.status(200).json({ message: 'Produit mis à jour avec succès!', product: finalProduct });

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

 
// NOUVELLE FONCTION : Lister tous les produits pour l'ADMIN (publiés ou non)
exports.getAllProductsAdmin = async (req, res) => {
  // Optionnel: Ajouter pagination et filtres ici aussi si besoin pour l'admin
  const { page = 1, limit = 1000 } = req.query; // Par défaut, limite haute pour voir tout, ou implémenter pagination
  const offset = (page - 1) * limit;

  try {
    // Pas de filtre is_published = TRUE ici
    const query = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.image_url, 
        p.sku, p.is_published, p.created_at, p.updated_at,
        (SELECT ARRAY_AGG(c.name ORDER BY c.name) 
         FROM categories c 
         JOIN product_categories pc ON c.id = pc.category_id 
         WHERE pc.product_id = p.id) as categories_names,
        (SELECT ARRAY_AGG(pc.category_id)
         FROM product_categories pc
         WHERE pc.product_id = p.id) as category_ids,
        (SELECT ARRAY_AGG(t.name ORDER BY t.name) 
         FROM product_tags t 
         JOIN product_tag_assignments pta ON t.id = pta.tag_id 
         WHERE pta.product_id = p.id) as tags_names,
        (SELECT ARRAY_AGG(pta.tag_id)
         FROM product_tag_assignments pta
         WHERE pta.product_id = p.id) as tag_ids,
        COUNT(*) OVER() AS total_count 
      FROM products p
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const { rows } = await db.query(query, [limit, offset]);
    
    const totalItems = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalItems / limit);

    const productsData = rows.map(({total_count, ...product}) => ({
        ...product,
        category_ids: product.category_ids || [],
        categories_names: product.categories_names || [],
        tag_ids: product.tag_ids || [],
        tags_names: product.tags_names || []
    }));

    res.status(200).json({
        products: productsData, // Assure-toi que le frontend admin attend un objet avec une clé 'products'
        currentPage: parseInt(page, 10),
        totalPages,
        totalItems
    });
  } catch (error) {
    console.error('Erreur admin récupération de tous les produits:', error);
    res.status(500).json({ message: 'Erreur serveur admin lors de la récupération des produits.' });
  }
};