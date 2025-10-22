// Admin Dashboard JavaScript - COMPLETE FIXED VERSION

// Connection test function
function testConnection() {
    console.log('Testing connection to server...');

    fetch('/admin-dashboard/')
        .then(response => {
            console.log('Dashboard connection test:', response.status);
            return response.text();
        })
        .then(data => {
            console.log('Dashboard loaded successfully');
        })
        .catch(error => {
            console.error('Connection test failed:', error);
        });
}

// Test admin endpoints
function testAdminEndpoints() {
    console.log('Testing admin endpoints...');

    const endpoints = [
        '/admin/add-product/',
        '/admin/update-product/',
        '/admin/delete-product/'
    ];

    endpoints.forEach(endpoint => {
        fetch(endpoint, {
            method: 'OPTIONS'
        })
            .then(response => {
                console.log(`${endpoint} status:`, response.status);
                if (response.status === 404) {
                    console.error(`${endpoint} NOT FOUND!`);
                } else {
                    console.log(`${endpoint} is accessible`);
                }
            })
            .catch(error => {
                console.error(`Error testing ${endpoint}:`, error);
            });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin dashboard loaded');
    testConnection();
    testAdminEndpoints();
    initializeProductManagement();
});

function initializeProductManagement() {
    console.log('Initializing product management...');

    // Add product form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Add product form submitted');
            addNewProduct();
        });
    }

    // Update product form submission
    const updateProductForm = document.getElementById('updateProductForm');
    if (updateProductForm) {
        updateProductForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Update product form submitted');
            updateExistingProduct();
        });
    }

    // Delete product selection handler
    const deleteProductSelect = document.getElementById('deleteProductSelect');
    if (deleteProductSelect) {
        deleteProductSelect.addEventListener('change', function () {
            const warning = document.getElementById('deleteWarning');
            const confirmBtn = document.querySelector('.confirm-delete-btn');

            if (this.value) {
                warning.style.display = 'block';
                confirmBtn.style.display = 'block';
            } else {
                warning.style.display = 'none';
                confirmBtn.style.display = 'none';
            }
        });
    }
}

// Product Management Functions
function showAddProduct() {
    console.log('Showing add product modal');
    const modal = document.getElementById('addProductModal');
    modal.style.display = 'block';

    // Scroll to top of form
    const formContent = modal.querySelector('.modal-form-content');
    if (formContent) {
        formContent.scrollTop = 0;
    }
}

function hideAddProduct() {
    document.getElementById('addProductModal').style.display = 'none';
    document.getElementById('addProductForm').reset();
}

function showUpdateProduct() {
    console.log('Showing update product modal');
    const modal = document.getElementById('updateProductModal');
    modal.style.display = 'block';

    // Scroll to top of form
    const formContent = modal.querySelector('.modal-form-content');
    if (formContent) {
        formContent.scrollTop = 0;
    }
}

function hideUpdateProduct() {
    document.getElementById('updateProductModal').style.display = 'none';
    document.getElementById('updateProductSelect').value = '';
    document.getElementById('updateProductForm').style.display = 'none';
    document.getElementById('updateProductForm').reset();
}

function showDeleteProduct() {
    console.log('Showing delete product modal');
    const modal = document.getElementById('deleteProductModal');
    modal.style.display = 'block';

    // Scroll to top
    const formContent = modal.querySelector('.modal-form-content');
    if (formContent) {
        formContent.scrollTop = 0;
    }
}

function hideDeleteProduct() {
    document.getElementById('deleteProductModal').style.display = 'none';
    document.getElementById('deleteProductSelect').value = '';
    document.getElementById('deleteWarning').style.display = 'none';
    document.querySelector('.confirm-delete-btn').style.display = 'none';
}

function loadProductData() {
    const select = document.getElementById('updateProductSelect');
    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption.value) {
        document.getElementById('updateProductForm').style.display = 'block';
        document.getElementById('updateProductId').value = selectedOption.value;
        document.getElementById('updateProductName').value = selectedOption.getAttribute('data-name');
        document.getElementById('updateProductPrice').value = selectedOption.getAttribute('data-price');
        document.getElementById('updateProductStock').value = selectedOption.getAttribute('data-stock');
        document.getElementById('updateProductMaxStock').value = selectedOption.getAttribute('data-max-stock');
        document.getElementById('updateProductMinStock').value = selectedOption.getAttribute('data-min-stock');
        document.getElementById('updateProductCategory').value = selectedOption.getAttribute('data-category');

        // Scroll to form when product is selected
        const formContent = document.querySelector('#updateProductModal .modal-form-content');
        if (formContent) {
            formContent.scrollTop = 0;
        }
    } else {
        document.getElementById('updateProductForm').style.display = 'none';
    }
}

function addNewProduct() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('Adding new product:', data);

    // Validate form
    if (!validateProductForm(data)) {
        return;
    }

    showLoading();

    showLoading();

    // FIXED: Use the correct URL
    fetch('/admin/add-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })

        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response URL:', response.url);

            if (response.status === 404) {
                throw new Error('Endpoint not found (404). Check server URLs.');
            }
            if (response.status === 500) {
                throw new Error('Server error (500). Check server logs.');
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Try to parse as JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.warn('Expected JSON, got:', text);
                    throw new Error('Server returned non-JSON response');
                });
            }
        })
        .then(result => {
            console.log('Add product result:', result);
            hideLoading();
            if (result.success) {
                showNotification(result.message || 'Product added successfully!', 'success');
                hideAddProduct();
                refreshDashboard();
            } else {
                showNotification('Error: ' + (result.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error adding product:', error);
            hideLoading();
            showNotification('Error adding product: ' + error.message, 'error');
        });
}

function updateExistingProduct() {
    const form = document.getElementById('updateProductForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('Updating product:', data);

    // Validate form
    if (!validateProductForm(data)) {
        return;
    }

    showLoading();

    fetch('/admin/update-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            console.log('Update product result:', result);
            hideLoading();
            if (result.success) {
                showNotification('Product updated successfully!', 'success');
                hideUpdateProduct();
                refreshDashboard();
            } else {
                showNotification('Error: ' + result.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error updating product:', error);
            hideLoading();
            showNotification('Error updating product: ' + error.message, 'error');
        });
}

function confirmDelete() {
    const productId = document.getElementById('deleteProductSelect').value;

    if (!productId) {
        showNotification('Please select a product to delete', 'error');
        return;
    }

    console.log('Deleting product:', productId);
    showLoading();

    fetch('/admin/delete-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ product_id: productId })
    })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            console.log('Delete product result:', result);
            hideLoading();
            if (result.success) {
                showNotification('Product deleted successfully!', 'success');
                hideDeleteProduct();
                refreshDashboard();
            } else {
                showNotification('Error: ' + result.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            hideLoading();
            showNotification('Error deleting product: ' + error.message, 'error');
        });
}

// Utility Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function getCSRFToken() {
    // Try to get from cookie first
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }

    // If not found in cookie, try to get from form input
    if (!cookieValue) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) {
            cookieValue = csrfInput.value;
        }
    }

    return cookieValue;
}

function refreshDashboard() {
    showLoading();
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Form validation
function validateProductForm(data) {
    console.log('Validating form data:', data);

    // Check for empty fields
    if (!data.product_id || !data.name || !data.price || !data.stock || !data.max_stock || !data.min_stock) {
        const missing = [];
        if (!data.product_id) missing.push('Product ID');
        if (!data.name) missing.push('Product Name');
        if (!data.price) missing.push('Price');
        if (!data.stock) missing.push('Stock');
        if (!data.max_stock) missing.push('Max Stock');
        if (!data.min_stock) missing.push('Min Stock');

        showNotification(`Please fill in all required fields: ${missing.join(', ')}`, 'error');
        return false;
    }

    // Validate product ID format
    if (data.product_id.trim() === '') {
        showNotification('Product ID cannot be empty', 'error');
        return false;
    }

    // Validate product name
    if (data.name.trim() === '') {
        showNotification('Product name cannot be empty', 'error');
        return false;
    }

    // Validate numeric fields
    try {
        const price = parseFloat(data.price);
        const stock = parseInt(data.stock);
        const maxStock = parseInt(data.max_stock);
        const minStock = parseInt(data.min_stock);

        if (isNaN(price) || price <= 0) {
            showNotification('Price must be a number greater than 0', 'error');
            return false;
        }

        if (isNaN(stock) || stock < 0) {
            showNotification('Stock must be a non-negative number', 'error');
            return false;
        }

        if (isNaN(maxStock) || maxStock <= 0) {
            showNotification('Max stock must be a number greater than 0', 'error');
            return false;
        }

        if (isNaN(minStock) || minStock < 0) {
            showNotification('Min stock must be a non-negative number', 'error');
            return false;
        }

        if (stock > maxStock) {
            showNotification('Current stock cannot exceed max stock', 'error');
            return false;
        }

        if (minStock > maxStock) {
            showNotification('Min stock cannot exceed max stock', 'error');
            return false;
        }

    } catch (error) {
        showNotification('Invalid number format in form fields', 'error');
        return false;
    }

    return true;
}

// Notification system
function showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        z-index: 10000;
        color: white;
        ${type === 'success' ? 'background: rgba(0, 255, 0, 0.8); border: 2px solid #00ff00;' : ''}
        ${type === 'error' ? 'background: rgba(255, 0, 0, 0.8); border: 2px solid #ff0000;' : ''}
        ${type === 'info' ? 'background: rgba(0, 243, 255, 0.8); border: 2px solid var(--neon-blue);' : ''}
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        animation: slideInRight 0.5s ease forwards;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.5s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }
    }, 3000);
}

// Add CSS animations for notifications
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Close modals when clicking outside
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            if (modal.id === 'addProductModal') hideAddProduct();
            if (modal.id === 'updateProductModal') hideUpdateProduct();
            if (modal.id === 'deleteProductModal') hideDeleteProduct();
        }
    });
}

// Close modals with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        hideAddProduct();
        hideUpdateProduct();
        hideDeleteProduct();
    }
});

// Make functions globally available
window.showAddProduct = showAddProduct;
window.hideAddProduct = hideAddProduct;
window.showUpdateProduct = showUpdateProduct;
window.hideUpdateProduct = hideUpdateProduct;
window.showDeleteProduct = showDeleteProduct;
window.hideDeleteProduct = hideDeleteProduct;
window.loadProductData = loadProductData;
window.confirmDelete = confirmDelete;
window.refreshDashboard = refreshDashboard;

console.log('Admin dashboard JavaScript loaded successfully');