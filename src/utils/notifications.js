// Система уведомлений
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.idCounter = 0;
        this.init();
    }

    init() {
        // Создаем контейнер для уведомлений, если его нет
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    // Показать уведомление
    show(message, type = 'info', options = {}) {
        const id = ++this.idCounter;
        
        const defaultOptions = {
            duration: 5000,
            closable: true,
            persistent: false,
            action: null,
            title: null
        };
        
        const config = { ...defaultOptions, ...options };
        
        const notification = this.createNotification(id, message, type, config);
        this.container.appendChild(notification);
        this.notifications.set(id, { element: notification, config });
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Автоматическое скрытие
        if (!config.persistent && config.duration > 0) {
            this.startAutoHide(id, config.duration);
        }
        
        return id;
    }

    // Создать элемент уведомления
    createNotification(id, message, type, config) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const titles = {
            success: 'Успешно',
            error: 'Ошибка',
            warning: 'Внимание',
            info: 'Информация'
        };
        
        const icon = icons[type] || icons.info;
        const title = config.title || titles[type] || titles.info;
        
        let html = `
            <div class="notification-header">
                <div class="notification-title">
                    <i class="${icon}"></i>
                    ${title}
                </div>
                ${config.closable ? '<button class="notification-close" onclick="notifications.hide(' + id + ')"><i class="fas fa-times"></i></button>' : ''}
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        if (config.action) {
            html += `
                <div class="notification-actions">
                    <button class="btn btn-primary btn-sm" onclick="${config.action.handler}">${config.action.text}</button>
                </div>
            `;
        }
        
        if (!config.persistent && config.duration > 0) {
            html += `<div class="notification-progress"></div>`;
        }
        
        notification.innerHTML = html;
        
        return notification;
    }

    // Запустить автоматическое скрытие
    startAutoHide(id, duration) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const progressBar = notification.element.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${duration}ms linear`;
            
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 10);
        }
        
        setTimeout(() => {
            this.hide(id);
        }, duration);
    }

    // Скрыть уведомление
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.element.classList.remove('show');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    // Скрыть все уведомления
    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    // Показать уведомление об успехе
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    // Показать уведомление об ошибке
    error(message, options = {}) {
        return this.show(message, 'error', { 
            duration: 8000, 
            ...options 
        });
    }

    // Показать предупреждение
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    // Показать информационное уведомление
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Показать уведомление с подтверждением
    confirm(message, onConfirm, onCancel = null) {
        const id = this.show(message, 'warning', {
            persistent: true,
            closable: false,
            title: 'Подтверждение'
        });
        
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const actionsHtml = `
            <div class="notification-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-primary btn-sm" onclick="notifications.handleConfirm(${id}, true)">Да</button>
                <button class="btn btn-secondary btn-sm" onclick="notifications.handleConfirm(${id}, false)">Нет</button>
            </div>
        `;
        
        notification.element.insertAdjacentHTML('beforeend', actionsHtml);
        notification.config.onConfirm = onConfirm;
        notification.config.onCancel = onCancel;
        
        return id;
    }

    // Обработать ответ на подтверждение
    handleConfirm(id, confirmed) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        if (confirmed && notification.config.onConfirm) {
            notification.config.onConfirm();
        } else if (!confirmed && notification.config.onCancel) {
            notification.config.onCancel();
        }
        
        this.hide(id);
    }

    // Показать уведомление с прогрессом
    showProgress(message, title = 'Загрузка...') {
        const id = this.show(message, 'info', {
            persistent: true,
            closable: false,
            title: title
        });
        
        const notification = this.notifications.get(id);
        if (!notification) return id;
        
        const progressHtml = `
            <div class="progress-bar" style="margin-top: 10px;">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        
        notification.element.insertAdjacentHTML('beforeend', progressHtml);
        
        return id;
    }

    // Обновить прогресс
    updateProgress(id, percent, message = null) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const progressFill = notification.element.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        
        if (message) {
            const messageElement = notification.element.querySelector('.notification-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    // Показать уведомление о подключении к интернету
    showConnectionStatus(isOnline) {
        // Убираем предыдущие уведомления о соединении
        this.notifications.forEach((notification, id) => {
            if (notification.element.classList.contains('connection-status')) {
                this.hide(id);
            }
        });
        
        if (isOnline) {
            const id = this.success('Соединение восстановлено', {
                duration: 3000
            });
            const notification = this.notifications.get(id);
            if (notification) {
                notification.element.classList.add('connection-status');
            }
        } else {
            const id = this.error('Отсутствует подключение к интернету', {
                persistent: true
            });
            const notification = this.notifications.get(id);
            if (notification) {
                notification.element.classList.add('connection-status');
            }
        }
    }

    // Показать уведомление о сохранении данных
    showSaveStatus(status, error = null) {
        if (status === 'saving') {
            return this.showProgress('Сохранение данных...', 'Синхронизация');
        } else if (status === 'saved') {
            this.success('Данные сохранены', { duration: 2000 });
        } else if (status === 'error') {
            this.error(`Ошибка сохранения: ${error || 'Неизвестная ошибка'}`, {
                duration: 10000
            });
        }
    }

    // Показать уведомление о новой версии
    showUpdateAvailable(version, updateUrl) {
        return this.show(
            `Доступна новая версия ${version}. Обновите страницу для получения последних улучшений.`,
            'info',
            {
                persistent: true,
                title: 'Обновление доступно',
                action: {
                    text: 'Обновить',
                    handler: `window.location.reload()`
                }
            }
        );
    }

    // Показать уведомление о новом участнике бюджета
    showNewMember(memberName) {
        return this.info(
            `${memberName} присоединился к вашему бюджету`,
            {
                duration: 7000,
                title: 'Новый участник'
            }
        );
    }

    // Показать уведомление о превышении лимита
    showLimitExceeded(categoryName, spent, limit) {
        return this.warning(
            `Превышен лимит по категории "${categoryName}". Потрачено: ${spent}, лимит: ${limit}`,
            {
                duration: 10000,
                title: 'Превышение лимита'
            }
        );
    }

    // Показать уведомление о достижении цели
    showGoalAchieved(goalName) {
        return this.success(
            `Поздравляем! Вы достигли цели "${goalName}"!`,
            {
                duration: 8000,
                title: 'Цель достигнута'
            }
        );
    }

    // Получить количество активных уведомлений
    getActiveCount() {
        return this.notifications.size;
    }

    // Проверить, есть ли активные уведомления определенного типа
    hasType(type) {
        for (const notification of this.notifications.values()) {
            if (notification.element.classList.contains(type)) {
                return true;
            }
        }
        return false;
    }
}

// Создаем глобальный экземпляр
const notifications = new NotificationManager();

// Экспортируем для использования в модулях
export default notifications;

// Делаем доступным глобально для использования в HTML
window.notifications = notifications;