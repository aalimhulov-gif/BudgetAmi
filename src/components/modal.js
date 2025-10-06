// Компонент для работы с модальными окнами
class ModalComponent {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        // Обработчик для закрытия модалок по клику на overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.close(e.target.id);
            }
        });

        // Обработчик для закрытия модалок по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });
    }

    // Открыть модальное окно
    open(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Модальное окно с ID "${modalId}" не найдено`);
            return false;
        }

        // Заполняем форму данными, если они переданы
        if (Object.keys(data).length > 0) {
            this.populateForm(modal, data);
        }

        // Показываем модальное окно
        modal.classList.add('active');
        this.activeModals.add(modalId);

        // Фокусируемся на первом поле ввода
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        // Блокируем прокрутку фона
        if (this.activeModals.size === 1) {
            document.body.style.overflow = 'hidden';
        }

        // Вызываем событие открытия
        this.dispatchEvent(modalId, 'opened', data);

        return true;
    }

    // Закрыть модальное окно
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        modal.classList.remove('active');
        this.activeModals.delete(modalId);

        // Очищаем форму
        this.clearForm(modal);

        // Разблокируем прокрутку, если нет других модалок
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }

        // Вызываем событие закрытия
        this.dispatchEvent(modalId, 'closed');

        return true;
    }

    // Закрыть все модальные окна
    closeAll() {
        const modals = Array.from(this.activeModals);
        modals.forEach(modalId => this.close(modalId));
    }

    // Заполнить форму данными
    populateForm(modal, data) {
        Object.keys(data).forEach(key => {
            const field = modal.querySelector(`[name="${key}"], #${key}`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = data[key];
                } else {
                    field.value = data[key];
                }
            }
        });
    }

    // Очистить форму
    clearForm(modal) {
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }

        // Очищаем дополнительные поля
        const fields = modal.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = false;
            } else if (field.type !== 'submit' && field.type !== 'button') {
                field.value = '';
            }
        });
    }

    // Получить данные из формы
    getFormData(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return null;

        const form = modal.querySelector('form');
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};

        // Преобразуем FormData в обычный объект
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Обрабатываем дополнительные поля
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (field.name || field.id) {
                const key = field.name || field.id;
                if (field.type === 'checkbox') {
                    data[key] = field.checked;
                } else if (field.type === 'number') {
                    data[key] = parseFloat(field.value) || 0;
                } else if (field.type === 'date') {
                    data[key] = field.value ? new Date(field.value) : null;
                }
            }
        });

        return data;
    }

    // Показать состояние загрузки в модальном окне
    showLoading(modalId, message = 'Загрузка...') {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const submitButton = modal.querySelector('.btn-primary, button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        }

        // Блокируем все поля формы
        const fields = modal.querySelectorAll('input, select, textarea, button');
        fields.forEach(field => {
            field.disabled = true;
        });
    }

    // Скрыть состояние загрузки
    hideLoading(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const submitButton = modal.querySelector('.btn-primary, button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            // Восстанавливаем оригинальный текст кнопки
            const originalText = submitButton.dataset.originalText || 'Сохранить';
            submitButton.innerHTML = originalText;
        }

        // Разблокируем поля формы
        const fields = modal.querySelectorAll('input, select, textarea, button');
        fields.forEach(field => {
            field.disabled = false;
        });
    }

    // Показать ошибку в модальном окне
    showError(modalId, message) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Удаляем предыдущие ошибки
        const existingError = modal.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }

        // Создаем элемент ошибки
        const errorElement = document.createElement('div');
        errorElement.className = 'modal-error';
        errorElement.style.cssText = `
            background: var(--error-color);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            margin: 10px 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

        // Вставляем ошибку в начало тела модального окна
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.insertBefore(errorElement, modalBody.firstChild);
        }

        // Автоматически убираем ошибку через 5 секунд
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    // Создать подтверждающее модальное окно
    createConfirm(title, message, onConfirm, onCancel = null) {
        const modalId = 'confirm-modal-' + Date.now();
        
        const modalHtml = `
            <div id="${modalId}" class="modal modal-confirm">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                    </div>
                    <div class="modal-body">
                        <div class="confirm-icon">
                            <i class="fas fa-question-circle"></i>
                        </div>
                        <div class="confirm-message">${message}</div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="modal.handleConfirm('${modalId}', false)">
                            Отмена
                        </button>
                        <button type="button" class="btn btn-primary" onclick="modal.handleConfirm('${modalId}', true)">
                            Подтвердить
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Сохраняем колбэки
        const modal = document.getElementById(modalId);
        modal._onConfirm = onConfirm;
        modal._onCancel = onCancel;

        // Открываем модальное окно
        this.open(modalId);

        return modalId;
    }

    // Обработать ответ на подтверждение
    handleConfirm(modalId, confirmed) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const result = confirmed;

        if (result && modal._onConfirm) {
            modal._onConfirm();
        } else if (!result && modal._onCancel) {
            modal._onCancel();
        }

        // Закрываем и удаляем модальное окно
        this.close(modalId);
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // Создать модальное окно с произвольным содержимым
    create(options = {}) {
        const defaultOptions = {
            id: 'dynamic-modal-' + Date.now(),
            title: 'Модальное окно',
            content: '',
            size: 'medium', // small, medium, large
            closable: true,
            actions: []
        };

        const config = { ...defaultOptions, ...options };
        
        const sizeClass = {
            small: 'modal-small',
            medium: '',
            large: 'modal-large'
        };

        const actionsHtml = config.actions.map(action => 
            `<button type="button" class="btn ${action.class || 'btn-secondary'}" 
                onclick="${action.handler}">${action.text}</button>`
        ).join('');

        const modalHtml = `
            <div id="${config.id}" class="modal ${sizeClass[config.size] || ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${config.title}</h2>
                        ${config.closable ? `<button class="close-btn" onclick="modal.close('${config.id}')"><i class="fas fa-times"></i></button>` : ''}
                    </div>
                    <div class="modal-body">
                        ${config.content}
                    </div>
                    ${actionsHtml ? `<div class="modal-actions">${actionsHtml}</div>` : ''}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.open(config.id);

        return config.id;
    }

    // Обновить содержимое модального окна
    updateContent(modalId, content) {
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
            return true;
        }

        return false;
    }

    // Отправить событие
    dispatchEvent(modalId, eventType, data = {}) {
        const event = new CustomEvent(`modal:${eventType}`, {
            detail: { modalId, data }
        });
        document.dispatchEvent(event);
    }

    // Проверить, открыто ли модальное окно
    isOpen(modalId) {
        return this.activeModals.has(modalId);
    }

    // Получить список активных модальных окон
    getActiveModals() {
        return Array.from(this.activeModals);
    }
}

// Создаем глобальный экземпляр
const modal = new ModalComponent();

// Экспортируем для использования в модулях
export default modal;

// Делаем доступным глобально
window.modal = modal;

// Глобальные функции для использования в HTML
window.openModal = (modalId, data) => modal.open(modalId, data);
window.closeModal = (modalId) => modal.close(modalId);