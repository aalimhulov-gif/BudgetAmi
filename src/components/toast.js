// Toast уведомления
let toastCounter = 0;

export function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        createToastContainer();
    }
    
    const toastId = `toast-${++toastCounter}`;
    const toast = createToastElement(toastId, message, type);
    
    // Добавляем toast в контейнер
    toastContainer.appendChild(toast);
    
    // Показываем toast с анимацией
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Автоматически скрываем toast
    if (duration > 0) {
        setTimeout(() => {
            hideToast(toastId);
        }, duration);
    }
    
    return toastId;
}

export function hideToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

export function hideAllToasts() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        hideToast(toast.id);
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
}

function createToastElement(id, message, type) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="hideToast('${id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    return toast;
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    return icons[type] || icons.info;
}

// Делаем функцию глобальной для кнопок закрытия
window.hideToast = hideToast;