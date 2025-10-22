// Vending machine specific functionality
let totalMoney = 0;
let currentConfirmationResolve = null;
let currentConfirmationReject = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Vending machine JS loaded');
    initializeEventListeners();
    loadSessionData();
});

function initializeEventListeners() {
    console.log('Initializing event listeners');

    // Add Funds button
    const addFundsBtn = document.querySelector('button[onclick*="showAddFunds"]');
    if (addFundsBtn) {
        addFundsBtn.onclick = showAddFunds;
    }

    // View Cart button
    const viewCartBtn = document.querySelector('button[onclick*="viewCart"]');
    if (viewCartBtn) {
        viewCartBtn.onclick = viewCart;
    }

    // Clear Cart button
    const clearCartBtn = document.querySelector('button[onclick*="showClearCartConfirmation"]');
    if (clearCartBtn) {
        clearCartBtn.onclick = showClearCartConfirmation;
    }

    // Withdraw Money button
    const withdrawMoneyBtn = document.querySelector('button[onclick*="showWithdrawMoneyConfirmation"]');
    if (withdrawMoneyBtn) {
        withdrawMoneyBtn.onclick = showWithdrawMoneyConfirmation;
    }

    // Purchase button
    const purchaseBtn = document.querySelector('button[onclick*="processPayment"]');
    if (purchaseBtn) {
        purchaseBtn.onclick = processPayment;
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.onclick = function () {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        };
    });

    // Close modals when clicking outside
    window.onclick = function (event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        const confirmationModal = document.getElementById('confirmationModal');
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
            if (currentConfirmationReject) {
                currentConfirmationReject(false);
            }
        }
    };
}

function loadSessionData() {
    // Load money from session storage
    const savedMoney = sessionStorage.getItem('totalMoney');
    if (savedMoney) {
        totalMoney = parseFloat(savedMoney);
        updateMoneyDisplay();
        updateLogoAnimation();
    }

    // Load cart total
    updateCartTotal();
}

// Enhanced Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.notifications = [];
        this.zIndex = 10000;

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.id = 'notificationContainer';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress';
        notification.appendChild(progressBar);

        // Create message content
        const messageContent = document.createElement('div');
        messageContent.textContent = message;
        notification.appendChild(messageContent);

        // Add to container (bottom of stack)
        this.container.appendChild(notification);

        // Add to notifications array
        const notificationObj = {
            element: notification,
            id: Date.now() + Math.random()
        };
        this.notifications.unshift(notificationObj);

        // Update z-index for stacking
        notification.style.zIndex = this.zIndex++;

        // Remove after duration
        setTimeout(() => {
            this.remove(notificationObj.id);
        }, duration);

        return notificationObj.id;
    }

    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            const notification = this.notifications[index];
            notification.element.classList.add('exiting');

            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
                this.notifications.splice(index, 1);
            }, 500);
        }
    }

    clearAll() {
        this.notifications.forEach(notification => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        });
        this.notifications = [];
    }
}

// Initialize notification manager
const notifications = new NotificationManager();

// Custom Confirmation System
function showConfirmation(title, message) {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('confirmationModal');
        const titleElement = document.getElementById('confirmationTitle');
        const messageElement = document.getElementById('confirmationMessage');
        const confirmBtn = document.getElementById('confirmAction');
        const cancelBtn = document.getElementById('cancelAction');

        if (!modal || !titleElement || !messageElement || !confirmBtn || !cancelBtn) {
            console.error('Confirmation modal elements not found');
            reject(false);
            return;
        }

        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;

        // Store resolve/reject functions
        currentConfirmationResolve = resolve;
        currentConfirmationReject = reject;

        // Show modal
        modal.style.display = 'block';

        // Remove previous event listeners
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;

        // Add new event listeners
        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            if (currentConfirmationResolve) {
                currentConfirmationResolve(true);
            }
        };

        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            if (currentConfirmationReject) {
                currentConfirmationReject(false);
            }
        };
    });
}

// Money functions
function showAddFunds() {
    console.log('Show add funds called');
    const modal = document.getElementById('addFundsModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('currentFunds').textContent = 'Rs ' + totalMoney.toFixed(2);
    } else {
        console.error('Add funds modal not found');
    }
}

function hideAddFunds() {
    const modal = document.getElementById('addFundsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function addFunds(denomination) {
    console.log('Adding funds:', denomination);

    fetch('/add-funds/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ denomination: denomination })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Add funds response:', data);
            if (data.success) {
                totalMoney = data.total_money;
                updateMoneyDisplay();
                updateLogoAnimation();
                const currentFundsElement = document.getElementById('currentFunds');
                if (currentFundsElement) {
                    currentFundsElement.textContent = 'Rs ' + totalMoney.toFixed(2);
                }
                notifications.show('Funds added successfully!', 'success');
            } else {
                notifications.show('Failed to add funds', 'error');
            }
        })
        .catch(error => {
            console.error('Error adding funds:', error);
            notifications.show('Error adding funds: ' + error.message, 'error');
        });
}

// Withdraw Money functions
function showWithdrawMoneyConfirmation() {
    console.log('Withdraw money confirmation called');
    console.log('Current total money:', totalMoney);

    if (totalMoney <= 0) {
        notifications.show('No money to withdraw. Please add funds first.', 'info');
        return;
    }

    showConfirmation(
        'Withdraw Money',
        `Are you sure you want to withdraw Rs ${totalMoney.toFixed(2)}? This will cancel any pending purchases and return all your money.`
    )
        .then((confirmed) => {
            if (confirmed) {
                console.log('User confirmed withdrawal');
                withdrawMoney();
            }
        })
        .catch(() => {
            // User cancelled
            console.log('User cancelled withdrawal');
            notifications.show('Money withdrawal cancelled', 'info');
        });
}

function withdrawMoney() {
    console.log('Withdrawing money...');

    fetch('/withdraw-money/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
        .then(response => {
            console.log('Withdrawal response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Withdraw money response:', data);
            if (data.success) {
                let withdrawalMessage = `Money withdrawal successful! Returned: Rs ${data.withdrawn_amount.toFixed(2)}`;

                // Add breakdown of returned money
                if (data.money_breakdown) {
                    const breakdown = data.money_breakdown;
                    let breakdownDetails = '\nReturned:';
                    let hasMoney = false;

                    const denominations = [
                        { key: 'rs200', name: 'Rs 200', value: 200 },
                        { key: 'rs100', name: 'Rs 100', value: 100 },
                        { key: 'rs50', name: 'Rs 50', value: 50 },
                        { key: 'rs25', name: 'Rs 25', value: 25 },
                        { key: 'rs20', name: 'Rs 20', value: 20 },
                        { key: 'rs10', name: 'Rs 10', value: 10 },
                        { key: 'rs5', name: 'Rs 5', value: 5 },
                        { key: 'rs1', name: 'Rs 1', value: 1 }
                    ];

                    denominations.forEach(denom => {
                        if (breakdown[denom.key] > 0) {
                            breakdownDetails += `\n${denom.name} x ${breakdown[denom.key]}`;
                            hasMoney = true;
                        }
                    });

                    if (hasMoney) {
                        withdrawalMessage += breakdownDetails;
                    }
                }

                notifications.show(withdrawalMessage, 'success', 5000);

                // Reset everything
                totalMoney = 0;
                updateMoneyDisplay();
                updateLogoAnimation();
                updateCartTotal();
                hideAddFunds();
                hideCart();

            } else {
                console.error('Withdrawal failed:', data.message);
                notifications.show(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error withdrawing money:', error);
            notifications.show('Error withdrawing money: ' + error.message, 'error');
        });
}
function updateMoneyDisplay() {
    const totalMoneyElement = document.getElementById('totalMoney');
    if (totalMoneyElement) {
        totalMoneyElement.textContent = 'Rs ' + totalMoney.toFixed(2);
    }
    sessionStorage.setItem('totalMoney', totalMoney);

    // Also update change display
    updateCartTotal();
}

function updateLogoAnimation() {
    const logo = document.getElementById('astroLogo');
    if (logo) {
        if (totalMoney > 0) {
            logo.classList.add('animated');
        } else {
            logo.classList.remove('animated');
        }
    }
}

// Cart functions
function addToCart(productId) {
    console.log('Adding to cart:', productId);
    const quantityInput = document.getElementById('qty-' + productId);
    if (!quantityInput) {
        notifications.show('Quantity input not found', 'error');
        return;
    }

    const quantity = parseInt(quantityInput.value);

    if (isNaN(quantity) || quantity < 1) {
        notifications.show('Please enter a valid quantity', 'error');
        return;
    }

    // Check if money is inserted first
    if (totalMoney <= 0) {
        notifications.show('Please insert money before adding to cart', 'error');
        return;
    }

    fetch('/add-to-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Add to cart response:', data);
            if (data.success) {
                notifications.show('Product added to cart!', 'success');
                updateCartTotal();
            } else {
                notifications.show(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            notifications.show('Error adding to cart: ' + error.message, 'error');
        });
}

function viewCart() {
    console.log('View cart called');
    const modal = document.getElementById('cartModal');
    const cartContent = document.getElementById('cartContent');

    if (!modal || !cartContent) {
        console.error('Cart modal elements not found');
        return;
    }

    fetch('/get-cart/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Cart data:', data);
            if (data.cart_items.length === 0) {
                cartContent.innerHTML = '<p>Your cart is empty</p>';
            } else {
                let cartHTML = '';
                data.cart_items.forEach(item => {
                    cartHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <strong>${item.name}</strong><br>
                            Rs ${item.price} x ${item.quantity} = Rs ${item.total.toFixed(2)}
                        </div>
                        <div class="cart-item-actions">
                            <button class="remove-btn" onclick="removeFromCart('${item.product_id}')">Remove</button>
                        </div>
                    </div>
                `;
                });
                cartContent.innerHTML = cartHTML;
            }
            const cartTotalElement = document.getElementById('cartTotal');
            if (cartTotalElement) {
                cartTotalElement.textContent = 'Rs ' + data.cart_total.toFixed(2);
            }
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading cart:', error);
            notifications.show('Error loading cart: ' + error.message, 'error');
        });
}

function hideCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function removeFromCart(productId) {
    console.log('Removing from cart:', productId);

    fetch('/remove-from-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ product_id: productId })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Remove from cart response:', data);
            if (data.success) {
                notifications.show('Item removed from cart', 'success');
                viewCart(); // Refresh cart view
                updateCartTotal(); // Update expenses display
            } else {
                notifications.show(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error removing from cart:', error);
            notifications.show('Error removing from cart: ' + error.message, 'error');
        });
}

// Enhanced Clear Cart with Custom Confirmation
function showClearCartConfirmation() {
    console.log('Clear cart confirmation called');

    fetch('/get-cart/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Cart data for clearance:', data);
            if (data.cart_items.length === 0) {
                notifications.show('Your cart is already empty', 'info');
                return;
            }

            showConfirmation(
                'Clear Cart',
                `Are you sure you want to clear your cart? This will remove ${data.cart_items.length} item(s) totaling Rs ${data.cart_total.toFixed(2)}.`
            )
                .then((confirmed) => {
                    if (confirmed) {
                        clearCart();
                    }
                })
                .catch(() => {
                    // User cancelled
                    notifications.show('Cart clearance cancelled', 'info');
                });
        })
        .catch(error => {
            console.error('Error checking cart:', error);
            notifications.show('Error checking cart: ' + error.message, 'error');
        });
}

function clearCart() {
    console.log('Clearing cart');

    fetch('/clear-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Clear cart response:', data);
            if (data.success) {
                notifications.show('Cart cleared successfully!', 'success');
                updateCartTotal();
                // Refresh cart view if open
                if (document.getElementById('cartModal').style.display === 'block') {
                    viewCart();
                }
            } else {
                notifications.show(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error clearing cart:', error);
            notifications.show('Error clearing cart: ' + error.message, 'error');
        });
}

function updateCartTotal() {
    fetch('/get-cart/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const totalExpensesElement = document.getElementById('totalExpenses');
            const totalChangeElement = document.getElementById('totalChange');

            if (totalExpensesElement) {
                totalExpensesElement.textContent = 'Rs ' + data.cart_total.toFixed(2);
            }

            if (totalChangeElement) {
                const change = totalMoney - data.cart_total;
                totalChangeElement.textContent = 'Rs ' + Math.max(0, change).toFixed(2);
            }
        })
        .catch(error => {
            console.error('Error updating cart total:', error);
            // Don't show notification for this as it's a background update
        });
}

// Payment functions
function processPayment() {
    console.log('Processing payment');

    // Check if cart has items
    fetch('/get-cart/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(cartData => {
            if (cartData.cart_items.length === 0) {
                notifications.show('Your cart is empty. Add some products first!', 'error');
                return;
            }

            if (totalMoney <= 0) {
                notifications.show('Please insert money before making a purchase', 'error');
                return;
            }

            // Proceed with payment
            fetch('/process-payment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Payment response:', data);
                    if (data.success) {
                        let changeMessage = `Purchase successful! Transaction ID: ${data.transaction_id}`;
                        if (data.change > 0) {
                            changeMessage += ` | Change: Rs ${data.change.toFixed(2)}`;

                            // Suggest additional purchases if change can buy something
                            setTimeout(() => {
                                notifications.show(`You have Rs ${data.change.toFixed(2)} change available for additional purchases!`, 'info', 5000);
                            }, 1000);
                        }

                        notifications.show(changeMessage, 'success', 5000);

                        // Reset everything
                        totalMoney = 0;
                        updateMoneyDisplay();
                        updateLogoAnimation();
                        updateCartTotal();
                        hideCart();

                    } else {
                        if (data.required) {
                            notifications.show(`${data.message} - Additional Rs ${data.required.toFixed(2)} needed`, 'error');
                        } else {
                            notifications.show(data.message, 'error');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error processing payment:', error);
                    notifications.show('Error processing payment: ' + error.message, 'error');
                });
        })
        .catch(error => {
            console.error('Error checking cart for payment:', error);
            notifications.show('Error checking cart: ' + error.message, 'error');
        });
}

// Utility functions
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

// Make functions globally available
window.showAddFunds = showAddFunds;
window.hideAddFunds = hideAddFunds;
window.addFunds = addFunds;
window.viewCart = viewCart;
window.hideCart = hideCart;
window.removeFromCart = removeFromCart;
window.showClearCartConfirmation = showClearCartConfirmation;
window.clearCart = clearCart;
window.showWithdrawMoneyConfirmation = showWithdrawMoneyConfirmation;
window.withdrawMoney = withdrawMoney;
window.processPayment = processPayment;
window.addToCart = addToCart;