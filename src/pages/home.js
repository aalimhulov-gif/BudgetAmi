// Компонент главной страницы
import { getCurrentUser } from '../firebase/auth.js';
import { getBudget, getTransactions, subscribeToBudget, subscribeToTransactions } from '../firebase/db.js';
import { formatCurrency, getCurrentCurrency } from '../utils/currency.js';
import { formatDate } from '../utils/date.js';
import { showToast } from '../components/toast.js';
import { showTransactionForm } from '../components/modal.js';

class HomePage {
    constructor() {
        this.currentBudgetId = null;
        this.budgetData = null;
        this.transactions = [];
        this.subscribers = [];
        this.arthurBalance = 0;
        this.valeriaBalance = 0;
        this.init();
    }

    init() {
        this.loadBudgetData();
        this.addEventListeners();
    }

    addEventListeners() {
        // Кнопки добавления операций
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-income-btn') {
                this.showAddIncomeModal();
            } else if (e.target.id === 'add-expense-btn') {
                this.showAddExpenseModal();
            }
        });

        // Кнопки на карточках пользователей
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('user-add-income')) {
                const userId = e.target.dataset.userId;
                this.showAddIncomeModal(userId);
            } else if (e.target.classList.contains('user-add-expense')) {
                const userId = e.target.dataset.userId;
                this.showAddExpenseModal(userId);
            }
        });

        // Клик по транзакции
        document.addEventListener('click', (e) => {
            const transactionItem = e.target.closest('.transaction-item');
            if (transactionItem) {
                const transactionId = transactionItem.dataset.transactionId;
                this.showTransactionDetails(transactionId);
            }
        });
    }

    async loadBudgetData() {
        try {
            const user = getCurrentUser();
            if (!user) {
                throw new Error('Пользователь не авторизован');
            }

            // Пока что используем фиксированный ID бюджета
            // В реальном приложении это будет браться из настроек пользователя
            this.currentBudgetId = localStorage.getItem('currentBudgetId') || 'default-budget';

            // Загружаем данные бюджета
            await this.loadBudget();
            
            // Загружаем транзакции
            await this.loadTransactions();
            
            // Подписываемся на обновления
            this.subscribeToUpdates();
            
            // Обновляем интерфейс
            this.updateUI();

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            showToast('Ошибка загрузки данных бюджета', 'error');
        }
    }

    async loadBudget() {
        try {
            this.budgetData = await getBudget(this.currentBudgetId);
        } catch (error) {
            // Если бюджет не найден, создаем новый
            console.log('Бюджет не найден, используем локальные данные');
            this.budgetData = {
                id: this.currentBudgetId,
                totalBalance: 0,
                members: ['artur', 'valeria']
            };
        }
    }

    async loadTransactions() {
        try {
            this.transactions = await getTransactions(this.currentBudgetId, { limit: 10 });
        } catch (error) {
            console.log('Ошибка загрузки транзакций, используем пустой массив');
            this.transactions = [];
        }
    }

    subscribeToUpdates() {
        // Подписка на изменения бюджета
        const budgetUnsubscribe = subscribeToBudget(this.currentBudgetId, (budgetData) => {
            this.budgetData = budgetData;
            this.updateBalanceDisplay();
        });

        // Подписка на изменения транзакций
        const transactionsUnsubscribe = subscribeToTransactions(this.currentBudgetId, (transactions) => {
            this.transactions = transactions;
            this.updateTransactionsList();
            this.calculateUserBalances();
            this.updateUserCards();
        });

        this.subscribers.push(budgetUnsubscribe, transactionsUnsubscribe);
    }

    updateUI() {
        this.updateBalanceDisplay();
        this.updateUserCards();
        this.updateTransactionsList();
        this.calculateUserBalances();
    }

    updateBalanceDisplay() {
        const totalBalanceElement = document.getElementById('total-balance');
        if (totalBalanceElement && this.budgetData) {
            totalBalanceElement.textContent = formatCurrency(this.budgetData.totalBalance || 0);
        }
    }

    calculateUserBalances() {
        // Рассчитываем балансы для Артура и Валерии
        this.arthurBalance = 0;
        this.valeriaBalance = 0;

        this.transactions.forEach(transaction => {
            const amount = transaction.amount;
            const isIncome = transaction.type === 'income';
            const change = isIncome ? amount : -amount;

            // Определяем пользователя по ID или имени
            if (transaction.userId === 'artur' || transaction.userName === 'Артур') {
                this.arthurBalance += change;
            } else if (transaction.userId === 'valeria' || transaction.userName === 'Валерия') {
                this.valeriaBalance += change;
            }
        });
    }

    updateUserCards() {
        // Обновляем карточку Артура
        const arthurCard = document.querySelector('.user-card[data-user="artur"]');
        if (arthurCard) {
            const balanceElement = arthurCard.querySelector('.user-balance');
            if (balanceElement) {
                balanceElement.textContent = formatCurrency(this.arthurBalance);
                balanceElement.className = `user-balance ${this.arthurBalance >= 0 ? 'positive' : 'negative'}`;
            }
        }

        // Обновляем карточку Валерии
        const valeriaCard = document.querySelector('.user-card[data-user="valeria"]');
        if (valeriaCard) {
            const balanceElement = valeriaCard.querySelector('.user-balance');
            if (balanceElement) {
                balanceElement.textContent = formatCurrency(this.valeriaBalance);
                balanceElement.className = `user-balance ${this.valeriaBalance >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }

    updateTransactionsList() {
        const transactionsList = document.querySelector('.recent-transactions-list');
        if (!transactionsList) return;

        if (this.transactions.length === 0) {
            transactionsList.innerHTML = '<div class="no-transactions">Транзакций пока нет</div>';
            return;
        }

        const transactionsHTML = this.transactions.slice(0, 5).map(transaction => {
            const date = transaction.createdAt?.toDate ? 
                transaction.createdAt.toDate() : 
                new Date(transaction.createdAt);

            return `
                <div class="transaction-item ${transaction.type}" data-transaction-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-description">
                            ${transaction.description || 'Без описания'}
                        </div>
                        <div class="transaction-meta">
                            <span class="transaction-user">${transaction.userName || 'Неизвестно'}</span>
                            <span class="transaction-date">${formatDate(date, 'dd.mm.yyyy')}</span>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
    }

    showAddIncomeModal(userId = null) {
        const modal = showTransactionForm('income');
        
        // Если указан пользователь, можем предварительно заполнить форму
        if (userId) {
            const userNameField = modal.querySelector('#user-name');
            if (userNameField) {
                userNameField.value = userId === 'artur' ? 'Артур' : 'Валерия';
            }
        }

        // Обработка отправки формы
        const form = modal.querySelector('#transaction-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit(e.target, 'income', userId);
            });
        }
    }

    showAddExpenseModal(userId = null) {
        const modal = showTransactionForm('expense');
        
        // Если указан пользователь, можем предварительно заполнить форму
        if (userId) {
            const userNameField = modal.querySelector('#user-name');
            if (userNameField) {
                userNameField.value = userId === 'artur' ? 'Артур' : 'Валерия';
            }
        }

        // Обработка отправки формы
        const form = modal.querySelector('#transaction-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit(e.target, 'expense', userId);
            });
        }
    }

    async handleTransactionSubmit(form, type, userId = null) {
        try {
            const formData = new FormData(form);
            const transactionData = {
                type,
                amount: parseFloat(formData.get('amount')),
                description: formData.get('description'),
                date: formData.get('date'),
                categoryId: formData.get('category'),
                userId: userId || getCurrentUser()?.uid,
                userName: userId === 'artur' ? 'Артур' : 
                         userId === 'valeria' ? 'Валерия' : 
                         getCurrentUser()?.displayName || 'Пользователь'
            };

            // Здесь должна быть логика сохранения в Firebase
            // Пока что добавляем в локальный массив
            const newTransaction = {
                id: Date.now().toString(),
                ...transactionData,
                createdAt: new Date()
            };

            this.transactions.unshift(newTransaction);
            
            // Обновляем UI
            this.updateTransactionsList();
            this.calculateUserBalances();
            this.updateUserCards();
            
            // Обновляем общий баланс
            const balanceChange = type === 'income' ? transactionData.amount : -transactionData.amount;
            if (this.budgetData) {
                this.budgetData.totalBalance = (this.budgetData.totalBalance || 0) + balanceChange;
                this.updateBalanceDisplay();
            }

            showToast('Транзакция успешно добавлена', 'success');
            
            // Закрываем модальное окно
            const modal = form.closest('.modal-overlay');
            if (modal) {
                modal.querySelector('.modal-close')?.click();
            }

        } catch (error) {
            console.error('Ошибка добавления транзакции:', error);
            showToast('Ошибка добавления транзакции', 'error');
        }
    }

    showTransactionDetails(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const date = transaction.createdAt?.toDate ? 
            transaction.createdAt.toDate() : 
            new Date(transaction.createdAt);

        const details = `
            <div class="transaction-details">
                <div class="detail-row">
                    <span class="detail-label">Тип:</span>
                    <span class="detail-value">${transaction.type === 'income' ? 'Доход' : 'Расход'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Сумма:</span>
                    <span class="detail-value ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Описание:</span>
                    <span class="detail-value">${transaction.description || 'Не указано'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Пользователь:</span>
                    <span class="detail-value">${transaction.userName || 'Неизвестно'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Дата:</span>
                    <span class="detail-value">${formatDate(date, 'dd.mm.yyyy hh:mm')}</span>
                </div>
            </div>
        `;

        // Используем импортированную функцию openModal
        import('../components/modal.js').then(({ openModal }) => {
            openModal(details, {
                title: 'Детали транзакции',
                size: 'medium'
            });
        });
    }

    // Обновить валютное отображение
    updateCurrencyDisplay() {
        this.updateBalanceDisplay();
        this.updateUserCards();
        this.updateTransactionsList();
    }
}

// Создаем экземпляр главной страницы
const homePage = new HomePage();

// Слушаем события смены валюты
document.addEventListener('currencyChanged', () => {
    homePage.updateCurrencyDisplay();
});

export default homePage;