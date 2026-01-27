import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// En développement, utilise le proxy pour éviter les erreurs CORS
const POCKETBASE_URL = process.env.NODE_ENV === 'development'
  ? '/pocketbase'
  : process.env.REACT_APP_POCKETBASE_URL;

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("pb_admin_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("pb_admin_token");
    const storedAdmin = localStorage.getItem("pb_admin_data");

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

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

      setToken(data.token);
      setAdmin(data.record); // PocketBase retourne 'record' pour les users, pas 'admin'
      localStorage.setItem("pb_admin_token", data.token);
      localStorage.setItem("pb_admin_data", JSON.stringify(data.record));

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

  const isAuthenticated = () => {
    return !!token && !!admin;
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        login,
        logout,
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
