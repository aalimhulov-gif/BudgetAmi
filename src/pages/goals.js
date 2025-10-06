// Страница управления целями накопления
import modal from '../components/modal.js';
import progressBar from '../components/progressBar.js';
import notifications from '../utils/notifications.js';
import currencyManager from '../utils/currency.js';
import formatters from '../utils/formatters.js';
import dbManager from '../firebase/db.js';

class GoalsPage {
    constructor() {
        this.currentBudget = null;
        this.goals = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Глобальные функции для HTML
        window.openAddGoalModal = () => {
            this.openAddGoalModal();
        };

        window.openTransferGoalModal = (goalId) => {
            this.openTransferGoalModal(goalId);
        };

        // Обработчики форм
        const goalForm = document.getElementById('goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleGoalSubmit(e);
            });
        }

        const transferForm = document.getElementById('transfer-goal-form');
        if (transferForm) {
            transferForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransferSubmit(e);
            });
        }
    }

    // Загрузить данные целей
    async loadData(budgetId) {
        try {
            this.currentBudget = { id: budgetId };
            
            // TODO: Реализовать получение целей в dbManager
            // const result = await dbManager.getGoals(budgetId);
            // if (result.success) {
            //     this.goals = result.goals;
            // }
            
            // Временные тестовые данные
            this.goals = [
                {
                    id: 'goal1',
                    name: 'Отпуск в Италию',
                    targetAmount: 5000,
                    currentAmount: 2150,
                    deadline: new Date(2024, 7, 15),
                    description: 'Планируем поездку в Рим и Венецию на 10 дней',
                    createdAt: new Date(2024, 0, 1),
                    color: '#2196F3'
                },
                {
                    id: 'goal2',
                    name: 'Новый ноутбук',
                    targetAmount: 2000,
                    currentAmount: 2000,
                    deadline: new Date(2024, 5, 1),
                    description: 'MacBook Pro для работы',
                    createdAt: new Date(2024, 1, 1),
                    color: '#4CAF50',
                    completed: true,
                    completedAt: new Date(2024, 4, 28)
                },
                {
                    id: 'goal3',
                    name: 'Экстренный фонд',
                    targetAmount: 10000,
                    currentAmount: 3500,
                    deadline: new Date(2024, 11, 31),
                    description: 'Резерв на непредвиденные расходы',
                    createdAt: new Date(2024, 2, 1),
                    color: '#FF9800'
                }
            ];
            
            this.renderGoals();
        } catch (error) {
            console.error('Ошибка загрузки целей:', error);
            notifications.error('Ошибка загрузки целей');
        }
    }

    // Отобразить цели
    renderGoals() {
        const container = document.getElementById('goals-container');
        if (!container) return;

        if (this.goals.length === 0) {
            this.showEmptyState();
            return;
        }

        container.innerHTML = '';

        // Сортируем цели: активные сначала, затем завершенные
        const sortedGoals = [...this.goals].sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        sortedGoals.forEach(goal => {
            const goalCard = this.createGoalCard(goal);
            container.appendChild(goalCard);
        });
    }

    // Создать карточку цели
    createGoalCard(goal) {
        const card = document.createElement('div');
        card.className = `goal-card fade-in ${goal.completed ? 'completed' : ''}`;
        card.dataset.goalId = goal.id;

        const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
        const daysLeft = this.calculateDaysLeft(goal.deadline);
        
        let statusClass = 'info';
        let statusText = 'В процессе';
        let statusIcon = 'fas fa-clock';
        
        if (goal.completed) {
            statusClass = 'success';
            statusText = 'Достигнута!';
            statusIcon = 'fas fa-check-circle';
        } else if (percent >= 100) {
            statusClass = 'success';
            statusText = 'Цель достигнута!';
            statusIcon = 'fas fa-trophy';
        } else if (daysLeft < 0) {
            statusClass = 'warning';
            statusText = 'Просрочена';
            statusIcon = 'fas fa-exclamation-triangle';
        } else if (daysLeft <= 30 && percent < 80) {
            statusClass = 'warning';
            statusText = 'Требует внимания';
            statusIcon = 'fas fa-exclamation-triangle';
        }

        card.innerHTML = `
            <div class="goal-header" style="background: ${goal.color || '#2196F3'}; background: linear-gradient(135deg, ${goal.color || '#2196F3'} 0%, ${goal.color || '#2196F3'}cc 100%);">
                <div class="goal-icon">
                    <i class="fas fa-target"></i>
                </div>
                <div class="goal-status ${statusClass}">
                    <i class="${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
            </div>
            
            <div class="goal-content">
                <div class="goal-title-section">
                    <h3 class="goal-name">${goal.name}</h3>
                    ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                </div>
                
                <div class="goal-progress-section">
                    <div class="goal-amounts">
                        <span class="current-amount">${currencyManager.format(goal.currentAmount)}</span>
                        <span class="target-amount">из ${currencyManager.format(goal.targetAmount)}</span>
                    </div>
                    
                    <div class="progress-container" id="goal-progress-${goal.id}">
                        <!-- Прогресс-бар будет вставлен сюда -->
                    </div>
                    
                    <div class="goal-stats">
                        <div class="stat-item">
                            <span class="stat-label">Осталось:</span>
                            <span class="stat-value">${currencyManager.format(remaining)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Прогресс:</span>
                            <span class="stat-value">${Math.round(percent)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Дедлайн:</span>
                            <span class="stat-value ${daysLeft < 0 ? 'text-error' : daysLeft <= 30 ? 'text-warning' : ''}">${this.formatDeadline(goal.deadline, daysLeft)}</span>
                        </div>
                    </div>
                </div>
                
                ${goal.completed ? `
                    <div class="goal-completed-info">
                        <i class="fas fa-trophy text-success"></i>
                        <span>Завершена ${formatters.formatDate(goal.completedAt)}</span>
                    </div>
                ` : `
                    <div class="goal-actions">
                        <button class="btn btn-primary" onclick="openTransferGoalModal('${goal.id}')" ${percent >= 100 ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i> Пополнить
                        </button>
                        <button class="btn btn-secondary" onclick="goalsPage.editGoal('${goal.id}')">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn btn-danger" onclick="goalsPage.deleteGoal('${goal.id}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                `}
            </div>
        `;

        // Добавляем прогресс-бар
        setTimeout(() => {
            const progressContainer = card.querySelector(`#goal-progress-${goal.id}`);
            if (progressContainer) {
                const progressBarElement = progressBar.create({
                    current: goal.currentAmount,
                    target: goal.targetAmount,
                    showValues: false,
                    showPercent: true,
                    color: percent >= 100 ? 'success' : percent >= 80 ? 'warning' : 'primary'
                });
                progressContainer.appendChild(progressBarElement);
            }
        }, 100);

        return card;
    }

    // Рассчитать дни до дедлайна
    calculateDaysLeft(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Форматировать дедлайн
    formatDeadline(deadline, daysLeft) {
        const deadlineDate = new Date(deadline);
        const formatted = formatters.formatDate(deadlineDate);
        
        if (daysLeft < 0) {
            return `${formatted} (${Math.abs(daysLeft)} дн. назад)`;
        } else if (daysLeft === 0) {
            return `${formatted} (сегодня)`;
        } else if (daysLeft === 1) {
            return `${formatted} (завтра)`;
        } else if (daysLeft <= 30) {
            return `${formatted} (через ${daysLeft} дн.)`;
        } else {
            return formatted;
        }
    }

    // Показать пустое состояние
    showEmptyState() {
        const container = document.getElementById('goals-container');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-target"></i>
                <h3>Нет целей</h3>
                <p>Создайте первую цель накопления для достижения ваших финансовых планов</p>
                <button class="btn btn-primary" onclick="openAddGoalModal()">
                    <i class="fas fa-plus"></i> Создать цель
                </button>
            </div>
        `;
    }

    // Открыть модалку добавления цели
    openAddGoalModal() {
        // Очищаем форму
        const form = document.getElementById('goal-form');
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }

        // Устанавливаем дату дедлайна на месяц вперед по умолчанию
        const deadlineInput = document.getElementById('goal-deadline');
        if (deadlineInput) {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            deadlineInput.value = nextMonth.toISOString().split('T')[0];
        }

        // Обновляем заголовок
        const modalTitle = document.querySelector('#goal-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Добавить цель';
        }

        modal.open('goal-modal');
    }

    // Открыть модалку перевода на цель
    openTransferGoalModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Сохраняем ID цели в форме
        const form = document.getElementById('transfer-goal-form');
        if (form) {
            form.dataset.goalId = goalId;
        }

        // Обновляем заголовок с названием цели
        const modalTitle = document.querySelector('#transfer-goal-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = `Пополнить цель: ${goal.name}`;
        }

        modal.open('transfer-goal-modal');
    }

    // Редактировать цель
    editGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Заполняем форму данными цели
        const form = document.getElementById('goal-form');
        if (form) {
            form.dataset.editingId = goalId;
            
            const nameInput = document.getElementById('goal-name');
            const amountInput = document.getElementById('goal-amount');
            const deadlineInput = document.getElementById('goal-deadline');
            
            if (nameInput) nameInput.value = goal.name;
            if (amountInput) amountInput.value = goal.targetAmount;
            if (deadlineInput) {
                deadlineInput.value = new Date(goal.deadline).toISOString().split('T')[0];
            }
        }

        // Обновляем заголовок
        const modalTitle = document.querySelector('#goal-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Редактировать цель';
        }

        modal.open('goal-modal');
    }

    // Удалить цель
    deleteGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        modal.createConfirm(
            'Удаление цели',
            `Вы действительно хотите удалить цель "${goal.name}"?${goal.currentAmount > 0 ? ' Накопленная сумма будет возвращена в общий баланс.' : ''}`,
            async () => {
                try {
                    // TODO: Реализовать удаление цели в dbManager
                    notifications.success(`Цель "${goal.name}" удалена`);
                    
                    // Удаляем из локального массива
                    this.goals = this.goals.filter(g => g.id !== goalId);
                    
                    // Удаляем карточку из DOM
                    const card = document.querySelector(`[data-goal-id="${goalId}"]`);
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.remove();
                            if (this.goals.length === 0) {
                                this.showEmptyState();
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('Ошибка удаления цели:', error);
                    notifications.error('Ошибка удаления цели');
                }
            }
        );
    }

    // Обработать отправку формы цели
    async handleGoalSubmit(event) {
        const form = event.target;
        const formData = modal.getFormData('goal-modal');
        
        if (!formData.name || !formData.amount || !formData.deadline) {
            notifications.error('Заполните все обязательные поля');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount <= 0) {
            notifications.error('Целевая сумма должна быть больше нуля');
            return;
        }

        const deadline = new Date(formData.deadline);
        if (deadline <= new Date()) {
            notifications.error('Дедлайн должен быть в будущем');
            return;
        }

        const editingId = form.dataset.editingId;
        const isEditing = !!editingId;

        try {
            modal.showLoading('goal-modal', isEditing ? 'Сохранение...' : 'Создание...');

            const goalData = {
                name: formData.name.trim(),
                targetAmount: amount,
                deadline: deadline
            };

            let result;
            if (isEditing) {
                // TODO: Реализовать обновление цели в dbManager
                result = { success: true };
                
                // Обновляем локальный массив
                const index = this.goals.findIndex(g => g.id === editingId);
                if (index !== -1) {
                    this.goals[index] = { ...this.goals[index], ...goalData };
                }
            } else {
                result = await dbManager.addGoal(this.currentBudget.id, goalData);
                
                if (result.success) {
                    // Добавляем в локальный массив
                    const newGoal = {
                        id: 'temp_' + Date.now(),
                        ...goalData,
                        currentAmount: 0,
                        createdAt: new Date(),
                        color: this.generateGoalColor()
                    };
                    this.goals.push(newGoal);
                }
            }

            if (result.success) {
                notifications.success(isEditing ? 'Цель обновлена' : 'Цель создана');
                modal.close('goal-modal');
                this.renderGoals();
            } else {
                notifications.error('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            notifications.error('Произошла ошибка при сохранении цели');
        } finally {
            modal.hideLoading('goal-modal');
        }
    }

    // Обработать перевод на цель
    async handleTransferSubmit(event) {
        const form = event.target;
        const formData = modal.getFormData('transfer-goal-modal');
        const goalId = form.dataset.goalId;
        
        if (!formData.amount || !goalId) {
            notifications.error('Заполните сумму');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount <= 0) {
            notifications.error('Сумма должна быть больше нуля');
            return;
        }

        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) {
            notifications.error('Цель не найдена');
            return;
        }

        try {
            modal.showLoading('transfer-goal-modal', 'Перевод...');

            // TODO: Получить ID текущего пользователя
            const userId = 'current-user-id';
            
            const result = await dbManager.transferToGoal(this.currentBudget.id, userId, goalId, amount);

            if (result.success) {
                notifications.success(`Переведено ${currencyManager.format(amount)} на цель "${goal.name}"`);
                modal.close('transfer-goal-modal');
                
                // Обновляем цель локально
                goal.currentAmount += amount;
                
                // Проверяем достижение цели
                if (goal.currentAmount >= goal.targetAmount && !goal.completed) {
                    goal.completed = true;
                    goal.completedAt = new Date();
                    notifications.showGoalAchieved(goal.name);
                }
                
                // Обновляем отображение
                this.renderGoals();
            } else {
                notifications.error('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            notifications.error('Произошла ошибка при переводе');
        } finally {
            modal.hideLoading('transfer-goal-modal');
        }
    }

    // Сгенерировать цвет для цели
    generateGoalColor() {
        const colors = [
            '#2196F3', '#4CAF50', '#FF9800', '#9C27B0',
            '#F44336', '#00BCD4', '#8BC34A', '#FFC107',
            '#3F51B5', '#E91E63', '#009688', '#795548'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Получить статистику по целям
    getGoalsStats() {
        const total = this.goals.length;
        const completed = this.goals.filter(g => g.completed).length;
        const active = total - completed;
        const totalTarget = this.goals.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalSaved = this.goals.reduce((sum, g) => sum + g.currentAmount, 0);
        
        return {
            total,
            completed,
            active,
            totalTarget,
            totalSaved,
            progress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
        };
    }

    // Фильтрация целей
    filterGoals(filter = 'all') {
        const cards = document.querySelectorAll('.goal-card');
        
        cards.forEach(card => {
            const goalId = card.dataset.goalId;
            const goal = this.goals.find(g => g.id === goalId);
            
            let show = true;
            
            switch (filter) {
                case 'active':
                    show = !goal.completed;
                    break;
                case 'completed':
                    show = goal.completed;
                    break;
                case 'overdue':
                    show = !goal.completed && new Date(goal.deadline) < new Date();
                    break;
                case 'close':
                    show = !goal.completed && goal.currentAmount >= goal.targetAmount * 0.8;
                    break;
                default:
                    show = true;
            }
            
            card.style.display = show ? '' : 'none';
        });
    }

    // Экспорт целей
    exportGoals() {
        const dataStr = JSON.stringify(this.goals, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `goals_${formatters.formatDate(new Date(), {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\./g, '-')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        notifications.success('Цели экспортированы');
    }

    // Очистить данные
    cleanup() {
        this.currentBudget = null;
        this.goals = [];
    }
}

// Создаем глобальный экземпляр
const goalsPage = new GoalsPage();

// Делаем доступным глобально
window.goalsPage = goalsPage;

export default goalsPage;