import React, { useState, useEffect } from 'react';

const Age = ({ birthDate }) => {
  const [age, setAge] = useState(0);

  useEffect(() => {
    const calculateAge = () => {
      const birth = new Date(birthDate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDifference = today.getMonth() - birth.getMonth();
      const dayDifference = today.getDate() - birth.getDate();

      if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    };

    calculateAge();

    // Met à jour l'âge chaque année au cas où l'utilisateur laisse la page ouverte longtemps.
    const ageInterval = setInterval(calculateAge, 365 * 24 * 60 * 60 * 1000);

    return () => clearInterval(ageInterval);
  }, [birthDate]);

  return <span>{age} ans</span>;
};

export default Age;