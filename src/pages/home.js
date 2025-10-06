// Главная страница приложения
import userCard from '../components/userCard.js';
import modal from '../components/modal.js';
import notifications from '../utils/notifications.js';
import currencyManager from '../utils/currency.js';
import formatters from '../utils/formatters.js';
import authManager from '../firebase/auth.js';
import dbManager from '../firebase/db.js';

class HomePage {
    constructor() {
        this.currentBudget = null;
        this.categories = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Слушаем открытие модалки транзакции
        window.openTransactionModal = (type, userId) => {
            this.openTransactionModal(type, userId);
        };

        // Обработчик формы добавления транзакции
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit(e);
            });
        }

        // Функция показа модалки приглашения
        window.showInviteModal = () => {
            this.showInviteModal();
        };
    }

    // Загрузить и отобразить данные
    async loadData() {
        try {
            const user = authManager.getCurrentUser();
            if (!user) return;

            // Получаем бюджет пользователя
            const budgetResult = await dbManager.getUserBudget(user.uid);
            if (!budgetResult.success) {
                console.error('Ошибка загрузки бюджета:', budgetResult.error);
                return;
            }

            this.currentBudget = budgetResult.budget;
            
            // Загружаем категории
            await this.loadCategories();
            
            // Отображаем данные
            this.renderBudgetData();
            this.renderUserCards();
            
            // Подписываемся на обновления в реальном времени
            this.subscribeToUpdates();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            notifications.error('Ошибка загрузки данных');
        }
    }

    // Загрузить категории
    async loadCategories() {
        if (!this.currentBudget) return;

        try {
            const result = await dbManager.getCategories(this.currentBudget.id);
            if (result.success) {
                this.categories = result.categories;
                this.updateCategorySelects();
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    // Отобразить данные бюджета
    renderBudgetData() {
        if (!this.currentBudget) return;

        // Вычисляем общий баланс
        const totalBalance = this.currentBudget.members.reduce((sum, member) => sum + member.balance, 0);
        
        // Обновляем отображение общего баланса
        const totalBalanceElement = document.getElementById('total-balance');
        const currencySymbolElement = document.getElementById('currency-symbol');
        
        if (totalBalanceElement) {
            totalBalanceElement.textContent = currencyManager.format(totalBalance).replace(/[^\d.,\-]/g, '');
        }
        
        if (currencySymbolElement) {
            currencySymbolElement.textContent = currencyManager.getSymbol();
        }
    }

    // Отобразить карточки пользователей
    renderUserCards() {
        if (!this.currentBudget) return;

        const container = document.getElementById('users-container');
        if (!container) return;

        // Очищаем контейнер
        container.innerHTML = '';

        // Создаем карточки для каждого участника
        this.currentBudget.members.forEach(member => {
            const cardElement = userCard.create(member);
            container.appendChild(cardElement);
        });

        // Добавляем карточку приглашения, если участников меньше 4
        if (this.currentBudget.members.length < 4) {
            const placeholderCard = userCard.createPlaceholder();
            container.appendChild(placeholderCard);
        }
    }

    // Открыть модалку транзакции
    async openTransactionModal(type, userId) {
        const title = type === 'income' ? 'Добавить доход' : 'Добавить расход';
        
        // Обновляем заголовок модалки
        const modalTitle = document.getElementById('transaction-modal-title');
        if (modalTitle) {
            modalTitle.textContent = title;
        }

        // Сохраняем тип операции и ID пользователя
        const form = document.getElementById('transaction-form');
        if (form) {
            form.dataset.type = type;
            form.dataset.userId = userId;
        }

        // Обновляем список категорий
        this.updateCategorySelects();

        // Открываем модалку
        modal.open('transaction-modal');
    }

    // Обновить селекты категорий
    updateCategorySelects() {
        const selects = [
            document.getElementById('transaction-category'),
            document.getElementById('limit-category')
        ];

        selects.forEach(select => {
            if (!select) return;

            // Очищаем существующие опции (кроме первой)
            const firstOption = select.querySelector('option:first-child');
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }

            // Добавляем категории
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    // Обработать отправку формы транзакции
    async handleTransactionSubmit(event) {
        const form = event.target;
        const formData = modal.getFormData('transaction-modal');
        
        if (!formData.amount || !formData.category) {
            notifications.error('Заполните все обязательные поля');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount <= 0) {
            notifications.error('Сумма должна быть больше нуля');
            return;
        }

        const type = form.dataset.type;
        const userId = form.dataset.userId;

        if (!type || !userId) {
            notifications.error('Ошибка: не указан тип операции или пользователь');
            return;
        }

        try {
            modal.showLoading('transaction-modal', 'Добавление операции...');

            const transaction = {
                type: type,
                amount: amount,
                category: formData.category,
                description: formData.description || '',
                date: new Date().toISOString()
            };

            const result = await dbManager.addTransaction(this.currentBudget.id, userId, transaction);

            if (result.success) {
                notifications.success(`${type === 'income' ? 'Доход' : 'Расход'} успешно добавлен`);
                modal.close('transaction-modal');
                
                // Анимируем изменение в карточке пользователя
                const userCardElement = document.querySelector(`[data-user-id="${userId}"]`);
                if (userCardElement) {
                    userCard.animateTransaction(userCardElement, type, amount);
                }
            } else {
                notifications.error('Ошибка добавления операции: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            notifications.error('Произошла ошибка при добавлении операции');
        } finally {
            modal.hideLoading('transaction-modal');
        }
    }

    // Показать модалку приглашения
    showInviteModal() {
        if (!this.currentBudget) return;

        const budgetId = this.currentBudget.id;
        const formattedId = formatters.formatId(budgetId);
        
        const content = `
            <div class="invite-modal-content">
                <div class="invite-info">
                    <h3>Пригласить участника</h3>
                    <p>Поделитесь этим ID с вашим партнёром для подключения к общему бюджету:</p>
                </div>
                
                <div class="budget-id-display">
                    <input type="text" value="${formattedId}" readonly id="invite-budget-id">
                    <button class="btn btn-secondary" onclick="copyBudgetId('invite-budget-id')">
                        <i class="fas fa-copy"></i> Копировать
                    </button>
                </div>
                
                <div class="invite-instructions">
                    <h4>Инструкция для партнёра:</h4>
                    <ol>
                        <li>Зарегистрируйтесь на сайте или войдите в аккаунт</li>
                        <li>При входе выберите "Присоединиться к бюджету"</li>
                        <li>Введите этот ID: <strong>${formattedId}</strong></li>
                        <li>Нажмите "Присоединиться"</li>
                    </ol>
                </div>
                
                <div class="qr-code-section" style="text-align: center; margin-top: 20px;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        Или отправьте ссылку для быстрого присоединения:
                    </p>
                    <div class="quick-link">
                        <input type="text" value="${window.location.origin}?join=${budgetId}" readonly style="width: 100%; margin: 10px 0;">
                        <button class="btn btn-primary" onclick="copyInviteLink('${budgetId}')">
                            <i class="fas fa-link"></i> Копировать ссылку
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.create({
            title: 'Пригласить участника',
            content: content,
            size: 'medium',
            actions: [
                {
                    text: 'Закрыть',
                    class: 'btn-secondary',
                    handler: 'modal.close(arguments[0].target.closest(".modal").id)'
                }
            ]
        });
    }

    // Подписаться на обновления в реальном времени
    subscribeToUpdates() {
        if (!this.currentBudget) return;

        // Подписываемся на изменения бюджета
        dbManager.subscribeToBudget(this.currentBudget.id, (updatedBudget) => {
            const previousBudget = this.currentBudget;
            this.currentBudget = updatedBudget;
            
            // Обновляем отображение
            this.renderBudgetData();
            this.updateUserCards(previousBudget);
            
            // Проверяем новых участников
            this.checkForNewMembers(previousBudget);
        });
    }

    // Обновить карточки пользователей
    updateUserCards(previousBudget) {
        if (!this.currentBudget) return;

        const container = document.getElementById('users-container');
        if (!container) return;

        // Обновляем существующие карточки
        this.currentBudget.members.forEach(member => {
            const cardElement = container.querySelector(`[data-user-id="${member.id}"]`);
            if (cardElement) {
                userCard.update(cardElement, member);
            } else {
                // Новый участник - добавляем карточку
                const newCardElement = userCard.create(member);
                const placeholderCard = container.querySelector('.placeholder');
                if (placeholderCard) {
                    container.insertBefore(newCardElement, placeholderCard);
                } else {
                    container.appendChild(newCardElement);
                }
            }
        });

        // Удаляем карточки участников, которые покинули бюджет
        if (previousBudget) {
            const currentMemberIds = this.currentBudget.members.map(m => m.id);
            previousBudget.members.forEach(member => {
                if (!currentMemberIds.includes(member.id)) {
                    const cardElement = container.querySelector(`[data-user-id="${member.id}"]`);
                    if (cardElement) {
                        cardElement.remove();
                    }
                }
            });
        }

        // Управляем отображением карточки приглашения
        const placeholderCard = container.querySelector('.placeholder');
        if (this.currentBudget.members.length >= 4) {
            if (placeholderCard) {
                placeholderCard.remove();
            }
        } else if (!placeholderCard) {
            const newPlaceholderCard = userCard.createPlaceholder();
            container.appendChild(newPlaceholderCard);
        }
    }

    // Проверить новых участников
    checkForNewMembers(previousBudget) {
        if (!previousBudget) return;

        const previousMemberIds = previousBudget.members.map(m => m.id);
        const newMembers = this.currentBudget.members.filter(m => !previousMemberIds.includes(m.id));

        newMembers.forEach(member => {
            notifications.showNewMember(member.name);
        });
    }

    // Обновить валюту
    updateCurrency(newCurrency) {
        if (this.currentBudget) {
            // Конвертируем данные бюджета
            this.currentBudget = currencyManager.convertBudgetAmounts(this.currentBudget, newCurrency);
            
            // Обновляем отображение
            this.renderBudgetData();
            this.renderUserCards();
        }
    }

    // Очистить данные при выходе
    cleanup() {
        this.currentBudget = null;
        this.categories = [];
        
        // Отписываемся от всех слушателей
        dbManager.unsubscribeAll();
    }

    // Проверить и создать базовые категории
    async createDefaultCategories() {
        if (!this.currentBudget || this.categories.length > 0) return;

        const defaultCategories = [
            { name: 'Еда', icon: 'fas fa-utensils', color: '#FF9800' },
            { name: 'Транспорт', icon: 'fas fa-car', color: '#2196F3' },
            { name: 'Развлечения', icon: 'fas fa-gamepad', color: '#9C27B0' },
            { name: 'Покупки', icon: 'fas fa-shopping-cart', color: '#4CAF50' },
            { name: 'Здоровье', icon: 'fas fa-heartbeat', color: '#F44336' },
            { name: 'Дом', icon: 'fas fa-home', color: '#795548' }
        ];

        try {
            for (const category of defaultCategories) {
                await dbManager.addCategory(this.currentBudget.id, category);
            }
            
            // Перезагружаем категории
            await this.loadCategories();
            
            notifications.info('Созданы базовые категории расходов');
        } catch (error) {
            console.error('Ошибка создания базовых категорий:', error);
        }
    }
}

// Глобальные функции для HTML
window.copyBudgetId = (inputId = 'budget-id-display') => {
    const input = document.getElementById(inputId);
    if (input) {
        input.select();
        document.execCommand('copy');
        notifications.success('ID бюджета скопирован в буфер обмена');
    }
};

window.copyInviteLink = (budgetId) => {
    const link = `${window.location.origin}?join=${budgetId}`;
    navigator.clipboard.writeText(link).then(() => {
        notifications.success('Ссылка приглашения скопирована');
    }).catch(() => {
        // Fallback для старых браузеров
        const tempInput = document.createElement('input');
        tempInput.value = link;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        notifications.success('Ссылка приглашения скопирована');
    });
};

export default new HomePage();