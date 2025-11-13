// API Client per il backend Python
// L'URL viene preso dalla variabile d'ambiente o rilevato automaticamente in produzione

// Rileva automaticamente l'URL in produzione
function getApiBaseUrl() {
  // Se è definita la variabile d'ambiente, usala
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL + '/api';
  }
  
  // In produzione, usa lo stesso dominio del frontend
  if (import.meta.env.PROD || window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Usa lo stesso protocollo e host del frontend, con /api
    return window.location.origin + '/api';
  }
  
  // Default per sviluppo locale
  return 'http://localhost:8000/api';
}

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        let errorMessage = 'Errore sconosciuto';
        let errorDetails = null;

        try {
          const errorData = await response.json();
          
          // Gestione errori di validazione (422)
          if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Errori di validazione Pydantic
              const fieldErrors = errorData.detail.map(err => {
                const field = err.loc ? err.loc.join('.') : 'campo';
                return `${field}: ${err.msg}`;
              }).join(', ');
              errorMessage = `Errore di validazione: ${fieldErrors}`;
            } else {
              errorMessage = errorData.detail;
            }
          }
          // Gestione errori di autenticazione (401)
          else if (response.status === 401) {
            errorMessage = errorData.detail || 'Email o password non corretti';
          }
          // Gestione errori di autorizzazione (403)
          else if (response.status === 403) {
            errorMessage = errorData.detail || 'Non hai i permessi per questa operazione';
          }
          // Gestione errori non trovato (404)
          else if (response.status === 404) {
            errorMessage = errorData.detail || 'Risorsa non trovata';
          }
          // Gestione altri errori
          else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }

          errorDetails = errorData;
        } catch (parseError) {
          // Se non riusciamo a parsare il JSON, usiamo il messaggio di default
          errorMessage = `Errore ${response.status}: ${response.statusText}`;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorDetails;
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Se l'errore è di rete (fetch fallito completamente)
      if (error.message === 'Failed to fetch') {
        const networkError = new Error('Impossibile contattare il server. Verifica la connessione.');
        console.error('Errore di rete:', networkError);
        throw networkError;
      }
      
      console.error('Errore API:', error.message);
      throw error;
    }
  }

  // AUTH
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    this.setToken(null);
    window.location.href = '/';
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateCurrentUser(data) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PROPERTIES
  async getProperties() {
    return this.request('/properties');
  }

  async createProperty(data) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProperty(id, data) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // APARTMENTS
  async getApartments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/apartments?${params}`);
  }

  async createApartment(data) {
    return this.request('/apartments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApartment(id, data) {
    return this.request(`/apartments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApartment(id) {
    return this.request(`/apartments/${id}`, {
      method: 'DELETE',
    });
  }

  // ROOMS
  async getRooms(apartmentId = null) {
    const params = apartmentId ? `?apartment_id=${apartmentId}` : '';
    return this.request(`/rooms${params}`);
  }

  async createRoom(data) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(id) {
    return this.request(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // CHECKLIST ITEMS
  async getChecklistItems(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/checklist-items?${params}`);
  }

  async createChecklistItem(data) {
    return this.request('/checklist-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChecklistItem(id, data) {
    return this.request(`/checklist-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChecklistItem(id) {
    return this.request(`/checklist-items/${id}`, {
      method: 'DELETE',
    });
  }

  // APARTMENT CHECKLIST ITEMS (Assegnazioni)
  async getApartmentChecklists(apartmentId) {
    return this.request(`/checklist-items/apartment/${apartmentId}/checklist-items`);
  }

  async addChecklistToApartment(apartmentId, data) {
    return this.request(`/checklist-items/apartment/${apartmentId}/checklist-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApartmentChecklistOrder(apartmentChecklistItemId, order) {
    return this.request(`/checklist-items/apartment-checklist-items/${apartmentChecklistItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ order }),
    });
  }

  async removeChecklistFromApartment(apartmentChecklistItemId) {
    return this.request(`/checklist-items/apartment-checklist-items/${apartmentChecklistItemId}`, {
      method: 'DELETE',
    });
  }

  // CHECKLIST COMPLETIONS
  async getCompletions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/completions?${params}`);
  }

  async createCompletion(data) {
    return this.request('/completions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCompletion(id) {
    return this.request(`/completions/${id}`, {
      method: 'DELETE',
    });
  }

  // SUPPLIES (Scorte Globali)
  async getSupplies(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/supplies?${params}`);
  }

  async getSupply(id) {
    return this.request(`/supplies/${id}`);
  }

  async createSupply(data) {
    return this.request('/supplies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupply(id, data) {
    return this.request(`/supplies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupply(id) {
    return this.request(`/supplies/${id}`, {
      method: 'DELETE',
    });
  }

  // APARTMENT SUPPLIES (Assegnazioni Scorte ad Appartamenti)
  async getApartmentSupplies(apartmentId) {
    return this.request(`/supplies/apartment/${apartmentId}/supplies`);
  }

  async addSupplyToApartment(apartmentId, data) {
    return this.request(`/supplies/apartment/${apartmentId}/supplies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApartmentSupply(apartmentSupplyId, data) {
    return this.request(`/supplies/apartment-supplies/${apartmentSupplyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeSupplyFromApartment(apartmentSupplyId) {
    return this.request(`/supplies/apartment-supplies/${apartmentSupplyId}`, {
      method: 'DELETE',
    });
  }

  // SUPPLY ALERTS
  async getSupplyAlerts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/supply-alerts?${params}`);
  }

  async createSupplyAlert(data) {
    return this.request('/supply-alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveSupplyAlert(id) {
    return this.request(`/supply-alerts/${id}/resolve`, {
      method: 'PUT',
    });
  }

  // USERS / OPERATORS
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/users?${params}`);
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async inviteUser(data) {
    return this.request('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // WORK SESSIONS / OPERATIONS
  async createWorkSession(data) {
    return this.request('/work-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkSessions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/work-sessions?${params}`);
  }

  async getWorkSession(sessionId) {
    return this.request(`/work-sessions/${sessionId}`);
  }

  async updateWorkSession(sessionId, data) {
    return this.request(`/work-sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkSession(sessionId) {
    return this.request(`/work-sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // EMAIL SERVICE
  async sendEmail(to, subject, body) {
    return this.request('/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    });
  }
}

export const apiClient = new ApiClient();