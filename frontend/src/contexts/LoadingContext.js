import React, { createContext, useState } from 'react';

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  return (
    <LoadingContext.Provider value={{ isFirstLoad, setIsFirstLoad }}>
      {children}
    </LoadingContext.Provider>
  );
};