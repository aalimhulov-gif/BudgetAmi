// Страница истории операций (транзакций)
import notifications from '../utils/notifications.js';
import currencyManager from '../utils/currency.js';
import formatters from '../utils/formatters.js';
import dbManager from '../firebase/db.js';

class TransactionsPage {
    constructor() {
        this.currentBudget = null;
        this.transactions = [];
        this.categories = [];
        this.users = [];
        this.filters = {
            user: '',
            category: '',
            type: '',
            date: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Обработчики фильтров
        const userFilter = document.getElementById('user-filter');
        const categoryFilter = document.getElementById('category-filter');
        const typeFilter = document.getElementById('type-filter');
        const dateFilter = document.getElementById('date-filter');

        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.filters.user = e.target.value;
                this.applyFilters();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
                this.applyFilters();
            });
        }
    }

    // Загрузить данные
    async loadData(budgetId, budgetData) {
        try {
            this.currentBudget = budgetData || { id: budgetId };
            this.users = this.currentBudget.members || [];
            
            // Загружаем транзакции
            const transactionsResult = await dbManager.getTransactions(budgetId);
            if (transactionsResult.success) {
                this.transactions = transactionsResult.transactions;
            }
            
            // Загружаем категории
            const categoriesResult = await dbManager.getCategories(budgetId);
            if (categoriesResult.success) {
                this.categories = categoriesResult.categories;
            }
            
            // Обновляем фильтры
            this.updateFilters();
            
            // Отображаем транзакции
            this.renderTransactions();
            
            // Подписываемся на обновления
            this.subscribeToUpdates();
            
        } catch (error) {
            console.error('Ошибка загрузки транзакций:', error);
            notifications.error('Ошибка загрузки истории операций');
        }
    }

    // Обновить фильтры
    updateFilters() {
        // Обновляем фильтр пользователей
        const userFilter = document.getElementById('user-filter');
        if (userFilter) {
            // Очищаем существующие опции (кроме первой)
            const firstOption = userFilter.querySelector('option:first-child');
            userFilter.innerHTML = '';
            if (firstOption) {
                userFilter.appendChild(firstOption);
            }

            // Добавляем пользователей
            this.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                userFilter.appendChild(option);
            });
        }

        // Обновляем фильтр категорий
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            // Очищаем существующие опции (кроме первой)
            const firstOption = categoryFilter.querySelector('option:first-child');
            categoryFilter.innerHTML = '';
            if (firstOption) {
                categoryFilter.appendChild(firstOption);
            }

            // Получаем уникальные категории из транзакций
            const uniqueCategories = [...new Set(this.transactions.map(t => t.category))];
            uniqueCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    }

    // Отобразить транзакции
    renderTransactions() {
        const container = document.getElementById('transactions-container');
        if (!container) return;

        if (this.transactions.length === 0) {
            this.showEmptyState();
            return;
        }

        // Сортируем транзакции по дате (новые сначала)
        const sortedTransactions = [...this.transactions].sort((a, b) => {
            return new Date(b.createdAt?.toDate() || b.date) - new Date(a.createdAt?.toDate() || a.date);
        });

        container.innerHTML = '';

        sortedTransactions.forEach(transaction => {
            const transactionElement = this.createTransactionItem(transaction);
            container.appendChild(transactionElement);
        });
    }

    // Создать элемент транзакции
    createTransactionItem(transaction) {
        const item = document.createElement('div');
        item.className = 'transaction-item fade-in';
        item.dataset.transactionId = transaction.id;
        item.dataset.userId = transaction.userId;
        item.dataset.category = transaction.category;
        item.dataset.type = transaction.type;

        const user = this.users.find(u => u.id === transaction.userId);
        const userName = user ? user.name : 'Неизвестный пользователь';
        
        const category = this.categories.find(c => c.name === transaction.category);
        const categoryIcon = category?.icon || 'fas fa-tag';
        const categoryColor = category?.color || formatters.generateCategoryColor(transaction.category);
        
        const transactionType = formatters.formatTransactionType(transaction.type);
        const date = transaction.createdAt?.toDate() || new Date(transaction.date);
        
        item.innerHTML = `
            <div class="transaction-icon ${transaction.type}" style="background: ${categoryColor};">
                <i class="${categoryIcon}"></i>
            </div>
            
            <div class="transaction-details">
                <div class="transaction-title">${transaction.description || transaction.category}</div>
                <div class="transaction-meta">
                    <span class="transaction-user">${userName}</span>
                    <span class="transaction-category">${transaction.category}</span>
                    <span class="transaction-type badge badge-${transactionType.class}">
                        <i class="${transactionType.icon}"></i> ${transactionType.text}
                    </span>
                </div>
            </div>
            
            <div class="transaction-date">
                <div class="date-main">${formatters.formatDate(date, { month: 'short', day: 'numeric' })}</div>
                <div class="date-time">${formatters.formatTime(date)}</div>
            </div>
            
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${currencyManager.format(transaction.amount)}
            </div>
        `;

        // Добавляем обработчик клика для показа деталей
        item.addEventListener('click', () => {
            this.showTransactionDetails(transaction);
        });

        return item;
    }

    // Показать детали транзакции
    showTransactionDetails(transaction) {
        const user = this.users.find(u => u.id === transaction.userId);
        const userName = user ? user.name : 'Неизвестный пользователь';
        const date = transaction.createdAt?.toDate() || new Date(transaction.date);
        const transactionType = formatters.formatTransactionType(transaction.type);

        const content = `
            <div class="transaction-details-modal">
                <div class="detail-section">
                    <h4>Основная информация</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Тип:</span>
                            <span class="detail-value badge badge-${transactionType.class}">
                                <i class="${transactionType.icon}"></i> ${transactionType.text}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Сумма:</span>
                            <span class="detail-value transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}${currencyManager.format(transaction.amount)}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Категория:</span>
                            <span class="detail-value">${transaction.category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Пользователь:</span>
                            <span class="detail-value">${userName}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Дата и время</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Дата:</span>
                            <span class="detail-value">${formatters.formatDate(date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Время:</span>
                            <span class="detail-value">${formatters.formatTime(date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Относительно:</span>
                            <span class="detail-value">${formatters.formatRelativeTime(date)}</span>
                        </div>
                    </div>
                </div>

                ${transaction.description ? `
                    <div class="detail-section">
                        <h4>Описание</h4>
                        <p class="transaction-description">${transaction.description}</p>
                    </div>
                ` : ''}

                <div class="detail-section">
                    <h4>Метаданные</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">ID операции:</span>
                            <span class="detail-value monospace">${transaction.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">ID бюджета:</span>
                            <span class="detail-value monospace">${transaction.budgetId}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Детали операции</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Закрыть
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Показать пустое состояние
    showEmptyState() {
        const container = document.getElementById('transactions-container');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>Нет операций</h3>
                <p>История ваших доходов и расходов будет отображаться здесь</p>
            </div>
        `;
    }

    // Применить фильтры
    applyFilters() {
        const items = document.querySelectorAll('.transaction-item');
        
        items.forEach(item => {
            const userId = item.dataset.userId;
            const category = item.dataset.category;
            const type = item.dataset.type;
            const transactionId = item.dataset.transactionId;
            
            const transaction = this.transactions.find(t => t.id === transactionId);
            if (!transaction) return;

            const date = transaction.createdAt?.toDate() || new Date(transaction.date);
            const dateString = date.toISOString().split('T')[0];

            let show = true;

            // Фильтр по пользователю
            if (this.filters.user && userId !== this.filters.user) {
                show = false;
            }

            // Фильтр по категории
            if (this.filters.category && category !== this.filters.category) {
                show = false;
            }

            // Фильтр по типу
            if (this.filters.type && type !== this.filters.type) {
                show = false;
            }

            // Фильтр по дате
            if (this.filters.date && dateString !== this.filters.date) {
                show = false;
            }

            // Текстовый поиск
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const description = (transaction.description || '').toLowerCase();
                const categoryName = category.toLowerCase();
                
                if (!description.includes(searchTerm) && !categoryName.includes(searchTerm)) {
                    show = false;
                }
            }

            item.style.display = show ? '' : 'none';
        });

        // Показываем количество отфильтрованных операций
        this.updateFilterStats();
    }

    // Обновить статистику фильтров
    updateFilterStats() {
        const visibleItems = document.querySelectorAll('.transaction-item:not([style*="display: none"])');
        const totalItems = document.querySelectorAll('.transaction-item');
        
        // TODO: Показать статистику где-то в UI
        console.log(`Показано ${visibleItems.length} из ${totalItems.length} операций`);
    }

    // Поиск по тексту
    search(searchTerm) {
        this.filters.search = searchTerm;
        this.applyFilters();
    }

    // Очистить все фильтры
    clearFilters() {
        this.filters = {
            user: '',
            category: '',
            type: '',
            date: '',
            search: ''
        };

        // Очищаем значения в UI
        const userFilter = document.getElementById('user-filter');
        const categoryFilter = document.getElementById('category-filter');
        const typeFilter = document.getElementById('type-filter');
        const dateFilter = document.getElementById('date-filter');

        if (userFilter) userFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        if (dateFilter) dateFilter.value = '';

        this.applyFilters();
    }

    // Экспорт транзакций
    exportTransactions(format = 'json') {
        const visibleTransactions = this.getVisibleTransactions();
        
        if (format === 'csv') {
            this.exportToCSV(visibleTransactions);
        } else {
            this.exportToJSON(visibleTransactions);
        }
    }

    // Получить видимые транзакции
    getVisibleTransactions() {
        const visibleItems = document.querySelectorAll('.transaction-item:not([style*="display: none"])');
        return Array.from(visibleItems).map(item => {
            const transactionId = item.dataset.transactionId;
            return this.transactions.find(t => t.id === transactionId);
        }).filter(Boolean);
    }

    // Экспорт в JSON
    exportToJSON(transactions) {
        const dataStr = JSON.stringify(transactions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `transactions_${formatters.formatDate(new Date(), {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\./g, '-')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        notifications.success('Операции экспортированы в JSON');
    }

    // Экспорт в CSV
    exportToCSV(transactions) {
        const headers = ['Дата', 'Тип', 'Сумма', 'Категория', 'Описание', 'Пользователь'];
        
        const csvData = transactions.map(transaction => {
            const user = this.users.find(u => u.id === transaction.userId);
            const date = transaction.createdAt?.toDate() || new Date(transaction.date);
            
            return [
                formatters.formatDateTime(date),
                transaction.type === 'income' ? 'Доход' : 'Расход',
                transaction.amount,
                transaction.category,
                transaction.description || '',
                user ? user.name : 'Неизвестный'
            ];
        });

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent);
        const exportFileDefaultName = `transactions_${formatters.formatDate(new Date(), {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\./g, '-')}.csv`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        notifications.success('Операции экспортированы в CSV');
    }

    // Подписаться на обновления в реальном времени
    subscribeToUpdates() {
        if (!this.currentBudget) return;

        dbManager.subscribeToTransactions(this.currentBudget.id, (updatedTransactions) => {
            const previousCount = this.transactions.length;
            this.transactions = updatedTransactions;
            
            // Обновляем отображение
            this.updateFilters();
            this.renderTransactions();
            
            // Показываем уведомление о новых операциях
            if (updatedTransactions.length > previousCount) {
                const newTransactionsCount = updatedTransactions.length - previousCount;
                notifications.info(`Добавлено ${newTransactionsCount} ${formatters.pluralize(newTransactionsCount, 'новая операция', 'новые операции', 'новых операций')}`);
            }
        });
    }

    // Получить статистику по периодам
    getStatsByPeriod(period = 'month') {
        const now = new Date();
        const periodTransactions = this.transactions.filter(transaction => {
            const date = transaction.createdAt?.toDate() || new Date(transaction.date);
            
            switch (period) {
                case 'day':
                    return date.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return date >= weekAgo && date <= now;
                case 'month':
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                case 'year':
                    return date.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });

        const income = periodTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = periodTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense,
            count: periodTransactions.length
        };
    }

    // Очистить данные
    cleanup() {
        this.currentBudget = null;
        this.transactions = [];
        this.categories = [];
        this.users = [];
        this.filters = {
            user: '',
            category: '',
            type: '',
            date: '',
            search: ''
        };

        // Отписываемся от обновлений
        dbManager.unsubscribeAll();
    }
}

// Создаем глобальный экземпляр
const transactionsPage = new TransactionsPage();

// Делаем доступным глобально
window.transactionsPage = transactionsPage;

export default transactionsPage;