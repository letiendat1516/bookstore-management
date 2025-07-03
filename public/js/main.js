// Common functions and utilities for Bookstore Management System

const API_BASE_URL = 'http://localhost:9999';

// Utility functions
const utils = {
    // Format currency to Vietnamese Dong
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    },

    // Format date to Vietnamese format
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    // Show notification
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },

    // Show loading state
    showLoading: (element) => {
        element.classList.add('loading');
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Đang tải...
        `;
        return originalContent;
    },

    // Hide loading state
    hideLoading: (element, originalContent) => {
        element.classList.remove('loading');
        element.innerHTML = originalContent;
    },

    // Debounce function for search
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate unique ID
    generateId: () => {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
};

// API service for handling HTTP requests
const apiService = {
    // Generic GET request
    get: async (endpoint) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API GET error:', error);
            utils.showNotification('Lỗi khi tải dữ liệu: ' + error.message, 'danger');
            throw error;
        }
    },

    // Generic POST request
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            utils.showNotification('Lỗi khi tạo dữ liệu: ' + error.message, 'danger');
            throw error;
        }
    },

    // Generic PUT request
    put: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API PUT error:', error);
            utils.showNotification('Lỗi khi cập nhật dữ liệu: ' + error.message, 'danger');
            throw error;
        }
    },

    // Generic DELETE request
    delete: async (endpoint) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error('API DELETE error:', error);
            utils.showNotification('Lỗi khi xóa dữ liệu: ' + error.message, 'danger');
            throw error;
        }
    }
};

// Navigation helper
const navigation = {
    // Set active navigation item
    setActive: (currentPage) => {
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage || 
                (currentPage === '/' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });
    },

    // Initialize navigation
    init: () => {
        const currentPath = window.location.pathname;
        const currentPage = currentPath === '/' ? 'index.html' : currentPath.split('/').pop();
        navigation.setActive(currentPage);
    }
};

// Form validation helpers
const validation = {
    // Validate required fields
    validateRequired: (form) => {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    },

    // Validate number fields
    validateNumber: (value, min = 0, max = Infinity) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    // Validate phone number (Vietnamese format)
    validatePhone: (phone) => {
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        return phoneRegex.test(phone);
    },

    // Clear validation states
    clearValidation: (form) => {
        const fields = form.querySelectorAll('.form-control');
        fields.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });
    }
};

// Local storage helpers
const storage = {
    // Save data to localStorage
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },

    // Load data from localStorage
    load: (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    },

    // Remove data from localStorage
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    navigation.init();
    
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Export for use in other modules
window.utils = utils;
window.apiService = apiService;
window.navigation = navigation;
window.validation = validation;
window.storage = storage;