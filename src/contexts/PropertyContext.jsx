import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/components/api/apiClient';

const PropertyContext = createContext(null);

export function PropertyProvider({ children }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProperties();
      setProperties(data || []);
    } catch (error) {
      console.error('Errore nel caricamento delle strutture:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica le strutture all'avvio se c'è un token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadProperties();
    }
  }, [loadProperties]);

  // Seleziona automaticamente la prima struttura quando vengono caricate
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      // Prova a recuperare la struttura salvata in localStorage
      const savedPropertyId = localStorage.getItem('selectedPropertyId');
      if (savedPropertyId) {
        const savedProperty = properties.find(p => p.id === parseInt(savedPropertyId));
        if (savedProperty) {
          setSelectedPropertyId(savedProperty.id);
          return;
        }
      }
      // Altrimenti seleziona la prima struttura disponibile
      const firstProperty = properties[0];
      if (firstProperty) {
        setSelectedPropertyId(firstProperty.id);
        localStorage.setItem('selectedPropertyId', firstProperty.id.toString());
      }
    }
  }, [properties, selectedPropertyId]);

  const selectProperty = (propertyId) => {
    setSelectedPropertyId(propertyId);
    localStorage.setItem('selectedPropertyId', propertyId.toString());
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const value = {
    selectedPropertyId,
    selectedProperty,
    properties,
    loading,
    selectProperty,
    refreshProperties: loadProperties,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}

