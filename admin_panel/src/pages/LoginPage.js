// admin_panel/src/pages/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios'; // Ou fetch
import { useNavigate } from 'react-router-dom'; // Pour la redirection

// **ATTENTION : REMPLACE PAR L'URL DE TON BACKEND EN LOCAL**
// Puisque l'admin panel tournera aussi sur localhost (sur un autre port), localhost fonctionnera ici.
const API_BASE_URL = 'http://localhost:3001/api'; 

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (user && user.role === 'admin') { // Vérifier si l'utilisateur est bien un admin
        localStorage.setItem('adminToken', token); // Stocker le token dans localStorage
        localStorage.setItem('adminUser', JSON.stringify(user)); // Stocker les infos user
        console.log('Connexion Admin réussie:', user);
        navigate('/dashboard'); // Rediriger vers le tableau de bord admin
      } else {
        setError('Accès refusé. Vous devez être administrateur.');
      }
    } catch (err) {
      console.error("Erreur de connexion admin:", err);
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect, ou problème serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h2>Connexion Administrateur Artiva</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="password">Mot de passe:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isLoading} style={{ padding: '10px', backgroundColor: 'tomato', color: 'white', border: 'none', cursor: 'pointer' }}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;