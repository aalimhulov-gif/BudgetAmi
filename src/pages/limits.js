// Страница управления лимитами
import modal from '../components/modal.js';
import progressBar from '../components/progressBar.js';
import notifications from '../utils/notifications.js';
import currencyManager from '../utils/currency.js';
import formatters from '../utils/formatters.js';
import dbManager from '../firebase/db.js';

class LimitsPage {
    constructor() {
        this.currentBudget = null;
        this.categories = [];
        this.limits = [];
        this.transactions = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Глобальная функция для открытия модалки установки лимита
        window.openSetLimitModal = () => {
            this.openSetLimitModal();
        };

        // Обработчик формы установки лимита
        const limitForm = document.getElementById('limit-form');
        if (limitForm) {
            limitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLimitSubmit(e);
            });
        }
    }

    // Загрузить данные
    async loadData(budgetId) {
        try {
            this.currentBudget = { id: budgetId };
            
            // Загружаем категории
            await this.loadCategories();
            
            // Загружаем лимиты
            await this.loadLimits();
            
            // Загружаем транзакции для расчета трат
            await this.loadTransactions();
            
            // Рендерим лимиты
            this.renderLimits();
        } catch (error) {
            console.error('Ошибка загрузки данных лимитов:', error);
            notifications.error('Ошибка загрузки лимитов');
        }
    }

    // Загрузить категории
    async loadCategories() {
        try {
            const result = await dbManager.getCategories(this.currentBudget.id);
            if (result.success) {
                this.categories = result.categories;
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    // Загрузить лимиты
    async loadLimits() {
        try {
            // TODO: Реализовать получение лимитов в dbManager
            // const result = await dbManager.getLimits(this.currentBudget.id);
            // if (result.success) {
            //     this.limits = result.limits;
            // }
            
            // Временные тестовые данные
            this.limits = [
                {
                    id: 'limit1',
                    categoryId: 'cat1',
                    categoryName: 'Еда',
                    amount: 1000,
                    period: 'monthly',
                    spent: 650,
                    createdAt: new Date()
                },
                {
                    id: 'limit2',
                    categoryId: 'cat2',
                    categoryName: 'Развлечения',
                    amount: 500,
                    period: 'monthly',
                    spent: 520,
                    createdAt: new Date()
                }
            ];
        } catch (error) {
            console.error('Ошибка загрузки лимитов:', error);
        }
    }

    // Загрузить транзакции
    async loadTransactions() {
        try {
            const result = await dbManager.getTransactions(this.currentBudget.id);
            if (result.success) {
                this.transactions = result.transactions;
                this.calculateSpentAmounts();
            }
        } catch (error) {
            console.error('Ошибка загрузки транзакций:', error);
        }
    }

    // Рассчитать потраченные суммы по категориям
    calculateSpentAmounts() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        this.limits.forEach(limit => {
            let spent = 0;
            
            this.transactions.forEach(transaction => {
                if (transaction.type === 'expense' && 
                    transaction.category === limit.categoryName) {
                    
                    const transactionDate = new Date(transaction.date);
                    
                    // Проверяем период
                    if (limit.period === 'monthly' && 
                        transactionDate.getMonth() === currentMonth && 
                        transactionDate.getFullYear() === currentYear) {
                        spent += transaction.amount;
                    }
                    // Можно добавить другие периоды (weekly, yearly)
                }
            });
            
            limit.spent = spent;
        });
    }

    // Отобразить лимиты
    renderLimits() {
        const container = document.getElementById('limits-container');
        if (!container) return;

        if (this.limits.length === 0) {
            this.showEmptyState();
            return;
        }

        container.innerHTML = '';

        this.limits.forEach(limit => {
            const limitCard = this.createLimitCard(limit);
            container.appendChild(limitCard);
        });
    }

    // Создать карточку лимита
    createLimitCard(limit) {
        const card = document.createElement('div');
        card.className = 'limit-card fade-in';
        card.dataset.limitId = limit.id;

        const percent = limit.amount > 0 ? (limit.spent / limit.amount) * 100 : 0;
        const remaining = Math.max(limit.amount - limit.spent, 0);
        
        let statusClass = 'success';
        let statusText = 'В пределах лимита';
        let statusIcon = 'fas fa-check-circle';
        
        if (percent >= 100) {
            statusClass = 'error';
            statusText = 'Лимит превышен!';
            statusIcon = 'fas fa-exclamation-circle';
        } else if (percent >= 80) {
            statusClass = 'warning';
            statusText = 'Приближение к лимиту';
            statusIcon = 'fas fa-exclamation-triangle';
        }

        // Находим категорию для получения иконки и цвета
        const category = this.categories.find(c => c.name === limit.categoryName);
        const categoryIcon = category?.icon || 'fas fa-tag';
        const categoryColor = category?.color || formatters.generateCategoryColor(limit.categoryName);

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">
                    <div class="category-icon" style="background: ${categoryColor}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="${categoryIcon}"></i>
                    </div>
                    <div>
                        <div class="limit-category">${limit.categoryName}</div>
                        <div class="limit-period" style="font-size: 0.8rem; color: var(--text-secondary);">
                            ${this.formatPeriod(limit.period)}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-icon edit" onclick="limitsPage.editLimit('${limit.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-icon delete" onclick="limitsPage.deleteLimit('${limit.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="limit-progress-container">
                <div class="limit-amounts">
                    <span class="spent-amount">${currencyManager.format(limit.spent)}</span>
                    <span class="limit-amount">из ${currencyManager.format(limit.amount)}</span>
                </div>
                
                <div class="progress-bar-container" id="progress-${limit.id}">
                    <!-- Прогресс-бар будет вставлен сюда -->
                </div>
                
                <div class="limit-status ${statusClass}">
                    <i class="${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
                
                <div class="limit-remaining">
                    <span>Осталось: <strong>${currencyManager.format(remaining)}</strong></span>
                </div>
                
                ${percent >= 80 ? `
                    <div class="limit-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${percent >= 100 ? 
                            `Превышение на ${currencyManager.format(limit.spent - limit.amount)}` :
                            `До превышения ${currencyManager.format(limit.amount - limit.spent)}`
                        }
                    </div>
                ` : ''}
            </div>
        `;

        // Добавляем прогресс-бар после создания карточки
        setTimeout(() => {
            const progressContainer = card.querySelector(`#progress-${limit.id}`);
            if (progressContainer) {
                const progressBarElement = progressBar.createLimitBar(limit.spent, limit.amount, {
                    currency: currencyManager.getSymbol()
                });
                progressContainer.appendChild(progressBarElement);
            }
        }, 100);

        return card;
    }

    // Форматировать период
    formatPeriod(period) {
        const periods = {
            daily: 'Ежедневно',
            weekly: 'Еженедельно',
            monthly: 'Ежемесячно',
            yearly: 'Ежегодно'
        };
        return periods[period] || period;
    }

    // Показать пустое состояние
    showEmptyState() {
        const container = document.getElementById('limits-container');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>Нет лимитов</h3>
                <p>Установите лимиты на категории расходов для контроля бюджета</p>
                <button class="btn btn-primary" onclick="openSetLimitModal()">
                    <i class="fas fa-plus"></i> Установить лимит
                </button>
            </div>
        `;
    }

    // Открыть модалку установки лимита
    openSetLimitModal() {
        // Обновляем список категорий в селекте
        this.updateCategorySelect();

        // Очищаем форму
        const form = document.getElementById('limit-form');
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }

        // Обновляем заголовок
        const modalTitle = document.querySelector('#limit-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Установить лимит';
        }

        modal.open('limit-modal');
    }

    // Обновить селект категорий
    updateCategorySelect() {
        const select = document.getElementById('limit-category');
        if (!select) return;

        // Очищаем существующие опции (кроме первой)
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }

        // Добавляем категории
        this.categories.forEach(category => {
            // Проверяем, есть ли уже лимит для этой категории
            const hasLimit = this.limits.some(limit => limit.categoryName === category.name);
            
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name + (hasLimit ? ' (уже есть лимит)' : '');
            option.disabled = hasLimit;
            select.appendChild(option);
        });
    }

    // Редактировать лимит
    editLimit(limitId) {
        const limit = this.limits.find(l => l.id === limitId);
        if (!limit) return;

        // Заполняем форму
        const form = document.getElementById('limit-form');
        if (form) {
            form.dataset.editingId = limitId;
            
            const categorySelect = document.getElementById('limit-category');
            const amountInput = document.getElementById('limit-amount');
            
            if (categorySelect) categorySelect.value = limit.categoryName;
            if (amountInput) amountInput.value = limit.amount;
        }

        // Обновляем заголовок
        const modalTitle = document.querySelector('#limit-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Редактировать лимит';
        }

        modal.open('limit-modal');
    }

    // Удалить лимит
    deleteLimit(limitId) {
        const limit = this.limits.find(l => l.id === limitId);
        if (!limit) return;

        modal.createConfirm(
            'Удаление лимита',
            `Вы действительно хотите удалить лимит для категории "${limit.categoryName}"?`,
            async () => {
                try {
                    // TODO: Реализовать удаление лимита в dbManager
                    notifications.success(`Лимит для "${limit.categoryName}" удален`);
                    
                    // Удаляем из локального массива
                    this.limits = this.limits.filter(l => l.id !== limitId);
                    
                    // Удаляем карточку из DOM
                    const card = document.querySelector(`[data-limit-id="${limitId}"]`);
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.remove();
                            if (this.limits.length === 0) {
                                this.showEmptyState();
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('Ошибка удаления лимита:', error);
                    notifications.error('Ошибка удаления лимита');
                }
            }
        );
    }

    // Обработать отправку формы лимита
    async handleLimitSubmit(event) {
        const form = event.target;
        const formData = modal.getFormData('limit-modal');
        
        if (!formData.category || !formData.amount) {
            notifications.error('Заполните все поля');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount <= 0) {
            notifications.error('Сумма лимита должна быть больше нуля');
            return;
        }

        const editingId = form.dataset.editingId;
        const isEditing = !!editingId;

        // Проверяем, есть ли уже лимит для этой категории (при создании)
        if (!isEditing) {
            const existingLimit = this.limits.find(l => l.categoryName === formData.category);
            if (existingLimit) {
                notifications.error('Лимит для этой категории уже существует');
                return;
            }
        }

        try {
            modal.showLoading('limit-modal', isEditing ? 'Сохранение...' : 'Установка...');

            let result;
            if (isEditing) {
                // TODO: Реализовать обновление лимита в dbManager
                result = { success: true };
                
                // Обновляем локальный массив
                const index = this.limits.findIndex(l => l.id === editingId);
                if (index !== -1) {
                    this.limits[index].amount = amount;
                    this.limits[index].categoryName = formData.category;
                }
            } else {
                result = await dbManager.setLimit(this.currentBudget.id, formData.category, amount);
                
                if (result.success) {
                    // Добавляем в локальный массив
                    const newLimit = {
                        id: 'temp_' + Date.now(),
                        categoryId: 'temp_cat',
                        categoryName: formData.category,
                        amount: amount,
                        period: 'monthly',
                        spent: 0,
                        createdAt: new Date()
                    };
                    this.limits.push(newLimit);
                    
                    // Рассчитываем потраченную сумму для нового лимита
                    this.calculateSpentAmounts();
                }
            }

            if (result.success) {
                notifications.success(isEditing ? 'Лимит обновлен' : 'Лимит установлен');
                modal.close('limit-modal');
                this.renderLimits();
                
                // Проверяем превышения лимитов
                this.checkLimitExceeded();
            } else {
                notifications.error('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            notifications.error('Произошла ошибка при сохранении лимита');
        } finally {
            modal.hideLoading('limit-modal');
        }
    }

    // Проверить превышения лимитов
    checkLimitExceeded() {
        this.limits.forEach(limit => {
            const percent = limit.amount > 0 ? (limit.spent / limit.amount) * 100 : 0;
            
            if (percent >= 100) {
                notifications.showLimitExceeded(
                    limit.categoryName,
                    currencyManager.format(limit.spent),
                    currencyManager.format(limit.amount)
                );
            }
        });
    }

    // Получить статистику по лимитам
    getLimitStats() {
        const totalLimits = this.limits.length;
        const exceededLimits = this.limits.filter(l => l.spent >= l.amount).length;
        const warningLimits = this.limits.filter(l => {
            const percent = (l.spent / l.amount) * 100;
            return percent >= 80 && percent < 100;
        }).length;
        
        return {
            total: totalLimits,
            exceeded: exceededLimits,
            warning: warningLimits,
            ok: totalLimits - exceededLimits - warningLimits
        };
    }

    // Экспорт лимитов
    exportLimits() {
        const dataStr = JSON.stringify(this.limits, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `limits_${formatters.formatDate(new Date(), {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\./g, '-')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        notifications.success('Лимиты экспортированы');
    }

    // Очистить данные
    cleanup() {
        this.currentBudget = null;
        this.categories = [];
        this.limits = [];
        this.transactions = [];
    }
}

// Создаем глобальный экземпляр
const limitsPage = new LimitsPage();

// Делаем доступным глобально
window.limitsPage = limitsPage;

export default limitsPage;