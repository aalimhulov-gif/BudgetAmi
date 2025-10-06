// Система модальных окон
class ModalManager {
    constructor() {
        this.currentModal = null;
        this.modalStack = [];
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        // Создаем контейнер для модальных окон
        this.createModalContainer();
        
        // Добавляем обработчики событий
        this.addEventListeners();
        
        this.initialized = true;
    }

    createModalContainer() {
        const existingContainer = document.getElementById('modal-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'modal-container';
        container.className = 'modal-container';
        document.body.appendChild(container);
    }

    addEventListeners() {
        // Закрытие по клику на оверлей
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
        });
    }

    // Открыть модальное окно
    openModal(modalContent, options = {}) {
        const defaultOptions = {
            title: '',
            size: 'medium', // small, medium, large, fullscreen
            showCloseButton: true,
            closeOnOverlay: true,
            closeOnEscape: true,
            className: '',
            animation: 'fade', // fade, slide, zoom
            onOpen: null,
            onClose: null
        };

        const config = { ...defaultOptions, ...options };

        // Если есть активное модальное окно, добавляем в стек
        if (this.currentModal) {
            this.modalStack.push(this.currentModal);
            this.currentModal.style.display = 'none';
        }

        // Создаем модальное окно
        const modal = this.createModal(modalContent, config);
        
        // Добавляем в контейнер
        const container = document.getElementById('modal-container');
        container.appendChild(modal);

        // Устанавливаем как текущее
        this.currentModal = modal;

        // Показываем модальное окно с анимацией
        setTimeout(() => {
            modal.classList.add('modal-show');
            if (config.onOpen) {
                config.onOpen(modal);
            }
        }, 10);

        // Блокируем скролл страницы
        document.body.style.overflow = 'hidden';

        return modal;
    }

    createModal(content, config) {
        const modal = document.createElement('div');
        modal.className = `modal-overlay modal-${config.size} modal-${config.animation} ${config.className}`;
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    ${config.title ? `
                        <div class="modal-header">
                            <h3 class="modal-title">${config.title}</h3>
                            ${config.showCloseButton ? '<button class="modal-close" aria-label="Закрыть">&times;</button>' : ''}
                        </div>
                    ` : ''}
                    <div class="modal-body">
                        ${typeof content === 'string' ? content : ''}
                    </div>
                </div>
            </div>
        `;

        // Если content - элемент DOM, добавляем его
        if (content instanceof HTMLElement) {
            const body = modal.querySelector('.modal-body');
            body.innerHTML = '';
            body.appendChild(content);
        }

        // Добавляем обработчик закрытия
        if (config.showCloseButton) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }
        }

        // Настройка закрытия по клику на оверлей
        if (!config.closeOnOverlay) {
            modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Сохраняем конфигурацию
        modal._modalConfig = config;

        return modal;
    }

    // Закрыть текущее модальное окно
    closeModal() {
        if (!this.currentModal) return;

        const config = this.currentModal._modalConfig;

        // Убираем класс показа
        this.currentModal.classList.remove('modal-show');

        // Удаляем после анимации
        setTimeout(() => {
            if (this.currentModal) {
                this.currentModal.remove();
                
                // Вызываем callback закрытия
                if (config && config.onClose) {
                    config.onClose();
                }
                
                // Восстанавливаем предыдущее модальное окно или убираем блокировку скролла
                if (this.modalStack.length > 0) {
                    this.currentModal = this.modalStack.pop();
                    this.currentModal.style.display = 'block';
                } else {
                    this.currentModal = null;
                    document.body.style.overflow = '';
                }
            }
        }, 300);
    }

    // Закрыть все модальные окна
    closeAllModals() {
        this.modalStack = [];
        if (this.currentModal) {
            this.closeModal();
        }
    }

    // Проверить, открыто ли модальное окно
    isModalOpen() {
        return this.currentModal !== null;
    }

    // ПРЕДУСТАНОВЛЕННЫЕ МОДАЛЬНЫЕ ОКНА

    // Диалог подтверждения
    confirm(message, title = 'Подтверждение') {
        return new Promise((resolve) => {
            const content = `
                <div class="confirm-dialog">
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn btn-secondary" data-action="cancel">Отмена</button>
                        <button class="btn btn-primary" data-action="confirm">Подтвердить</button>
                    </div>
                </div>
            `;

            const modal = this.openModal(content, {
                title,
                size: 'small',
                closeOnOverlay: false,
                showCloseButton: false
            });

            modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    this.closeModal();
                } else if (action === 'cancel') {
                    resolve(false);
                    this.closeModal();
                }
            });
        });
    }

    // Диалог предупреждения
    alert(message, title = 'Внимание') {
        return new Promise((resolve) => {
            const content = `
                <div class="alert-dialog">
                    <p>${message}</p>
                    <div class="alert-buttons">
                        <button class="btn btn-primary" data-action="ok">OK</button>
                    </div>
                </div>
            `;

            const modal = this.openModal(content, {
                title,
                size: 'small',
                closeOnOverlay: false,
                showCloseButton: false
            });

            modal.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'ok') {
                    resolve();
                    this.closeModal();
                }
            });
        });
    }

    // Форма добавления транзакции
    showTransactionForm(type = 'expense', transaction = null) {
        const isEdit = transaction !== null;
        const title = isEdit ? 'Редактировать транзакцию' : 
                     (type === 'income' ? 'Добавить доход' : 'Добавить расход');

        const content = `
            <form class="transaction-form" id="transaction-form">
                <div class="form-group">
                    <label for="amount">Сумма</label>
                    <input type="number" class="form-control" id="amount" 
                           value="${isEdit ? transaction.amount : ''}" 
                           step="0.01" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="category">Категория</label>
                    <select class="form-control" id="category" required>
                        <option value="">Выберите категорию</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="description">Описание</label>
                    <input type="text" class="form-control" id="description" 
                           value="${isEdit ? transaction.description || '' : ''}">
                </div>
                
                <div class="form-group">
                    <label for="date">Дата</label>
                    <input type="date" class="form-control" id="date" 
                           value="${isEdit ? transaction.date : new Date().toISOString().split('T')[0]}" 
                           required>
                </div>
                
                <div class="form-buttons">
                    <button type="button" class="btn btn-secondary" data-action="cancel">Отмена</button>
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </form>
        `;

        return this.openModal(content, {
            title,
            size: 'medium',
            className: 'transaction-modal'
        });
    }

    // Форма настроек
    showSettingsForm() {
        const content = `
            <form class="settings-form" id="settings-form">
                <div class="settings-section">
                    <h4>Основные настройки</h4>
                    
                    <div class="form-group">
                        <label for="user-name">Имя пользователя</label>
                        <input type="text" class="form-control" id="user-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="currency">Валюта</label>
                        <select class="form-control" id="currency">
                            <option value="PLN">PLN (Польский злотый)</option>
                            <option value="USD">USD (Доллар США)</option>
                            <option value="UAH">UAH (Украинская гривна)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="theme">Тема</label>
                        <select class="form-control" id="theme">
                            <option value="light">Светлая</option>
                            <option value="dark">Темная</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Совместный доступ</h4>
                    
                    <div class="form-group">
                        <label for="budget-id">ID бюджета для присоединения</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="budget-id" 
                                   placeholder="Введите ID бюджета">
                            <button type="button" class="btn btn-outline-secondary" id="join-budget-btn">
                                Присоединиться
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="form-buttons">
                    <button type="button" class="btn btn-secondary" data-action="cancel">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `;

        return this.openModal(content, {
            title: 'Настройки',
            size: 'large',
            className: 'settings-modal'
        });
    }
}

// Создаем глобальный экземпляр
const modalManager = new ModalManager();

// Экспортируем методы для удобства
export const openModal = (content, options) => modalManager.openModal(content, options);
export const closeModal = () => modalManager.closeModal();
export const closeAllModals = () => modalManager.closeAllModals();
export const isModalOpen = () => modalManager.isModalOpen();

// Предустановленные диалоги
export const confirm = (message, title) => modalManager.confirm(message, title);
export const alert = (message, title) => modalManager.alert(message, title);

// Модальные окна для бюджета
export const showTransactionForm = (type, transaction) => modalManager.showTransactionForm(type, transaction);
export const showSettingsForm = () => modalManager.showSettingsForm();

export default modalManager;