// Main JavaScript utilities
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded - initializing vending machine');
    updateLogoAnimation();
    initializeNotificationSystem();
    loadInitialData();
});

function updateLogoAnimation() {
    const logo = document.getElementById('astroLogo');
    if (!logo) return;

    const totalMoney = parseFloat(sessionStorage.getItem('totalMoney') || '0');

    if (totalMoney > 0) {
        logo.classList.add('animated');
    } else {
        logo.classList.remove('animated');
    }
}

function initializeNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    }
}

function loadInitialData() {
    // Load any saved money from session
    const savedMoney = sessionStorage.getItem('totalMoney');
    if (savedMoney) {
        window.totalMoney = parseFloat(savedMoney);
        updateMoneyDisplay();
    }

    // Update cart total on page load
    updateCartTotal();
}