import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// En développement, utilise le proxy pour éviter les erreurs CORS
const POCKETBASE_URL = process.env.NODE_ENV === 'development'
  ? '/pocketbase'
  : process.env.REACT_APP_POCKETBASE_URL;

/**
 * Les tokens PocketBase (collection `users`) expirent au bout de 7 jours.
 * On décode la date d'expiration (`exp`) du JWT pour ne jamais considérer
 * un token mort comme une session valide : sinon le dashboard s'ouvre
 * (la liste des projets est publique) mais chaque écriture échoue en 404.
 */
const getTokenExp = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const exp = getTokenExp(token);
  if (exp === null) return true; // token illisible = invalide
  return Date.now() / 1000 > exp - 30; // marge de 30 s
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("pb_admin_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("pb_admin_token");
    const storedAdmin = localStorage.getItem("pb_admin_data");

    if (storedToken && storedAdmin && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    } else if (storedToken) {
      // Session expirée : on purge pour repasser par le login
      localStorage.removeItem("pb_admin_token");
      localStorage.removeItem("pb_admin_data");
      setToken(null);
    }
    setLoading(false);
  }, []);

  const persistAuth = (newToken, record) => {
    setToken(newToken);
    setAdmin(record);
    localStorage.setItem("pb_admin_token", newToken);
    localStorage.setItem("pb_admin_data", JSON.stringify(record));
  };

  const login = async (email, password) => {
    try {
      // Authentification via la collection users de PocketBase
      const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Identifiants incorrects");
      }

      const data = await response.json();
      persistAuth(data.token, data.record); // PocketBase retourne 'record' pour les users

      return { success: true };
    } catch (error) {
      console.error("Erreur de connexion:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem("pb_admin_token");
    localStorage.removeItem("pb_admin_data");
  };

  /**
   * Valide ET renouvelle la session auprès de PocketBase (auth-refresh).
   * À appeler à l'entrée du dashboard : tant qu'on l'utilise au moins une
   * fois par semaine, le token n'expire jamais. Retourne false (et purge)
   * si la session n'est plus valide -> rediriger vers le login.
   */
  const refreshAuth = async () => {
    const current = localStorage.getItem("pb_admin_token");
    if (!current || isTokenExpired(current)) {
      logout();
      return false;
    }

    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
        method: "POST",
        headers: { Authorization: current },
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();
      persistAuth(data.token, data.record);
      return true;
    } catch (error) {
      // Erreur réseau : on ne déconnecte pas (le token local est encore valide)
      console.error("Erreur auth-refresh:", error);
      return !isTokenExpired(current);
    }
  };

  const isAuthenticated = () => {
    return !!token && !!admin && !isTokenExpired(token);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        login,
        logout,
        refreshAuth,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

export default AuthContext;
