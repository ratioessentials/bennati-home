// API Client per il backend Python
// L'URL viene preso dalla variabile d'ambiente o usa localhost come default

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
        const error = await response.json();
        throw new Error(error.message || 'API Error');
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
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

  // SUPPLIES
  async getSupplies(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/supplies?${params}`);
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

  async inviteUser(data) {
    return this.request('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
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