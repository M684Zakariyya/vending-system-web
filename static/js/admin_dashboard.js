// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin dashboard loaded');
    initializeProductManagement();
});

// CSRF Token function
function getCSRFToken() {
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
    return cookieValue;
}

function initializeProductManagement() {
    // Add product form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function (e) {
            e.preventDefault();
            addNewProduct();
        });
    }

    // Update product form submission
    const updateProductForm = document.getElementById('updateProductForm');
    if (updateProductForm) {
        updateProductForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateExistingProduct();
        });
    }
}

// Product Management Functions
function showAddProduct() {
    document.getElementById('addProductModal').style.display = 'block';
}

function hideAddProduct() {
    document.getElementById('addProductModal').style.display = 'none';
    document.getElementById('addProductForm').reset();
}

function showUpdateProduct() {
    document.getElementById('updateProductModal').style.display = 'block';
}

function hideUpdateProduct() {
    document.getElementById('updateProductModal').style.display = 'none';
    document.getElementById('updateProductSelect').value = '';
    document.getElementById('updateProductForm').style.display = 'none';
    document.getElementById('updateProductForm').reset();
}

function showDeleteProduct() {
    document.getElementById('deleteProductModal').style.display = 'block';
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
    } else {
        document.getElementById('updateProductForm').style.display = 'none';
    }
}

function addNewProduct() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    showLoading();

    fetch('/admin/add-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.success) {
                alert('Product added successfully!');
                hideAddProduct();
                refreshDashboard();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            hideLoading();
            alert('Error adding product: ' + error.message);
        });
}

function updateExistingProduct() {
    const form = document.getElementById('updateProductForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    showLoading();

    fetch('/admin/update-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.success) {
                alert('Product updated successfully!');
                hideUpdateProduct();
                refreshDashboard();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            hideLoading();
            alert('Error updating product: ' + error.message);
        });
}

function confirmDelete() {
    const productId = document.getElementById('deleteProductSelect').value;

    if (!productId) {
        alert('Please select a product to delete');
        return;
    }

    showLoading();

    fetch('/admin/delete-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ product_id: productId })
    })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.success) {
                alert('Product deleted successfully!');
                hideDeleteProduct();
                refreshDashboard();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            hideLoading();
            alert('Error deleting product: ' + error.message);
        });
}

// Delete product selection handler
document.getElementById('deleteProductSelect').addEventListener('change', function () {
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

// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function getCSRFToken() {
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
    return cookieValue;
}

function refreshDashboard() {
    showLoading();
    setTimeout(() => {
        window.location.reload();
    }, 1000);
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

// Enhanced form loading states
function setFormLoading(form, isLoading) {
    if (isLoading) {
        form.classList.add('form-loading');
        const buttons = form.querySelectorAll('button[type="submit"], button[type="button"]');
        buttons.forEach(button => {
            button.disabled = true;
            const originalText = button.textContent;
            button.setAttribute('data-original-text', originalText);
            button.textContent = 'Processing...';
        });
    } else {
        form.classList.remove('form-loading');
        const buttons = form.querySelectorAll('button[type="submit"], button[type="button"]');
        buttons.forEach(button => {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
        });
    }
}

// Enhanced add product function
function addNewProduct() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate form
    if (!validateProductForm(data)) {
        return;
    }

    setFormLoading(form, true);
    showLoading();

    fetch('/admin/add-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            setFormLoading(form, false);
            if (result.success) {
                showNotification('Product added successfully!', 'success');
                hideAddProduct();
                refreshDashboard();
            } else {
                showNotification('Error: ' + result.message, 'error');
            }
        })
        .catch(error => {
            hideLoading();
            setFormLoading(form, false);
            showNotification('Error adding product: ' + error.message, 'error');
        });
}

// Enhanced update product function
function updateExistingProduct() {
    const form = document.getElementById('updateProductForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate form
    if (!validateProductForm(data)) {
        return;
    }

    setFormLoading(form, true);
    showLoading();

    fetch('/admin/update-product/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            setFormLoading(form, false);
            if (result.success) {
                showNotification('Product updated successfully!', 'success');
                hideUpdateProduct();
                refreshDashboard();
            } else {
                showNotification('Error: ' + result.message, 'error');
            }
        })
        .catch(error => {
            hideLoading();
            setFormLoading(form, false);
            showNotification('Error updating product: ' + error.message, 'error');
        });
}

// Form validation
function validateProductForm(data) {
    if (!data.product_id || !data.name || !data.price || !data.stock || !data.max_stock || !data.min_stock) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }

    if (parseFloat(data.price) <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return false;
    }

    if (parseInt(data.stock) < 0) {
        showNotification('Stock cannot be negative', 'error');
        return false;
    }

    if (parseInt(data.max_stock) <= 0) {
        showNotification('Max stock must be greater than 0', 'error');
        return false;
    }

    if (parseInt(data.min_stock) < 0) {
        showNotification('Min stock cannot be negative', 'error');
        return false;
    }

    if (parseInt(data.stock) > parseInt(data.max_stock)) {
        showNotification('Current stock cannot exceed max stock', 'error');
        return false;
    }

    if (parseInt(data.min_stock) > parseInt(data.max_stock)) {
        showNotification('Min stock cannot exceed max stock', 'error');
        return false;
    }

    return true;
}

// Enhanced notification system for admin
function showNotification(message, type = 'info') {
    // Use the existing notification system from vending.js
    if (window.notifications) {
        window.notifications.show(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
}

// Enhanced modal show/hide with animations
// Enhanced modal show/hide with proper centering
function showAddProduct() {
    const modal = document.getElementById('addProductModal');
    const modalContent = modal.querySelector('.modal-content');
    modal.style.display = 'block';

    // Force reflow
    modal.offsetHeight;

    // Add show class for animation
    setTimeout(() => {
        modalContent.classList.add('show');
    }, 10);
}

function hideAddProduct() {
    const modal = document.getElementById('addProductModal');
    const modalContent = modal.querySelector('.modal-content');

    // Remove show class for animation
    modalContent.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('addProductForm').reset();
    }, 300);
}

// Add similar enhanced show/hide for other modals...
function showUpdateProduct() {
    const modal = document.getElementById('updateProductModal');
    const modalContent = modal.querySelector('.modal-content');
    modal.style.display = 'block';

    // Force reflow
    modal.offsetHeight;

    // Add show class for animation
    setTimeout(() => {
        modalContent.classList.add('show');
    }, 10);
}

function hideUpdateProduct() {
    const modal = document.getElementById('updateProductModal');
    const modalContent = modal.querySelector('.modal-content');

    // Remove show class for animation
    modalContent.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('updateProductSelect').value = '';
        document.getElementById('updateProductForm').style.display = 'none';
        document.getElementById('updateProductForm').reset();
    }, 300);
}

function showDeleteProduct() {
    const modal = document.getElementById('deleteProductModal');
    const modalContent = modal.querySelector('.modal-content');
    modal.style.display = 'block';

    // Force reflow
    modal.offsetHeight;

    // Add show class for animation
    setTimeout(() => {
        modalContent.classList.add('show');
    }, 10);
}

function hideDeleteProduct() {
    const modal = document.getElementById('deleteProductModal');
    const modalContent = modal.querySelector('.modal-content');

    // Remove show class for animation
    modalContent.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('deleteProductSelect').value = '';
        document.getElementById('deleteWarning').style.display = 'none';
        document.querySelector('.confirm-delete-btn').style.display = 'none';
    }, 300);
}

// Close modals when clicking outside (updated for centered modals)
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            const modalContent = modal.querySelector('.modal-content');
            modalContent.classList.remove('show');

            setTimeout(() => {
                modal.style.display = 'none';
                // Reset forms based on which modal is closing
                if (modal.id === 'addProductModal') {
                    document.getElementById('addProductForm').reset();
                } else if (modal.id === 'updateProductModal') {
                    document.getElementById('updateProductSelect').value = '';
                    document.getElementById('updateProductForm').style.display = 'none';
                    document.getElementById('updateProductForm').reset();
                } else if (modal.id === 'deleteProductModal') {
                    document.getElementById('deleteProductSelect').value = '';
                    document.getElementById('deleteWarning').style.display = 'none';
                    document.querySelector('.confirm-delete-btn').style.display = 'none';
                }
            }, 300);
        }
    });
}

// Initialize product management when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin dashboard loaded');
    initializeProductManagement();

    // Add CSS for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
        .modal-content {
            transition: all 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(style);
});

// Add CSS transitions to modal content
const style = document.createElement('style');
style.textContent = `
    .modal-content {
        transition: all 0.3s ease-in-out;
        transform: scale(0.9);
        opacity: 0;
    }
`;
document.head.appendChild(style);

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