import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


const CV = () => {
  const [pdfUrl, setPdfUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setPdfUrl('http://localhost:5001/api/cv');
  }, []);

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="cv-container">
      {pdfUrl ? (
        <iframe src={pdfUrl} width="100%" height="885px" title="CV" />
      ) : (
        <p>Chargement du CV...</p>
      )}
    </div>
  );
};

export default CV;