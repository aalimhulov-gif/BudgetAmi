// Компонент карточки пользователя
import currencyManager from '../utils/currency.js';
import formatters from '../utils/formatters.js';

class UserCardComponent {
    constructor() {
        this.template = `
            <div class="user-card" data-user-id="{{userId}}">
                <div class="user-avatar">{{initials}}</div>
                <div class="user-name">{{name}}</div>
                <div class="user-balance {{balanceClass}}">{{formattedBalance}}</div>
                <div class="user-stats">
                    <div class="stat-item">
                        <div class="stat-value income">{{formattedIncome}}</div>
                        <div class="stat-label">Доходы</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value expense">{{formattedExpenses}}</div>
                        <div class="stat-label">Расходы</div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-success" onclick="openTransactionModal('income', '{{userId}}')">
                        <i class="fas fa-plus"></i> Доход
                    </button>
                    <button class="btn btn-secondary" onclick="openTransactionModal('expense', '{{userId}}')">
                        <i class="fas fa-minus"></i> Расход
                    </button>
                </div>
            </div>
        `;
    }

    // Создать карточку пользователя
    create(user) {
        const initials = formatters.getInitials(user.name);
        const formattedBalance = currencyManager.format(user.balance);
        const formattedIncome = currencyManager.format(user.income);
        const formattedExpenses = currencyManager.format(user.expenses);
        
        let balanceClass = 'balance-zero';
        if (user.balance > 0) {
            balanceClass = 'balance-positive';
        } else if (user.balance < 0) {
            balanceClass = 'balance-negative';
        }
        
        const html = this.template
            .replace('{{userId}}', user.id)
            .replace('{{initials}}', initials)
            .replace('{{name}}', formatters.formatUserName(user.name))
            .replace('{{formattedBalance}}', formattedBalance)
            .replace('{{balanceClass}}', balanceClass)
            .replace('{{formattedIncome}}', formattedIncome)
            .replace('{{formattedExpenses}}', formattedExpenses)
            .replace(/{{userId}}/g, user.id);
        
        const container = document.createElement('div');
        container.innerHTML = html;
        const element = container.firstElementChild;
        
        // Добавляем анимацию появления
        element.classList.add('fade-in');
        
        return element;
    }

    // Обновить карточку пользователя
    update(element, user) {
        const initials = formatters.getInitials(user.name);
        const formattedBalance = currencyManager.format(user.balance);
        const formattedIncome = currencyManager.format(user.income);
        const formattedExpenses = currencyManager.format(user.expenses);
        
        let balanceClass = 'balance-zero';
        if (user.balance > 0) {
            balanceClass = 'balance-positive';
        } else if (user.balance < 0) {
            balanceClass = 'balance-negative';
        }
        
        // Обновляем содержимое
        element.querySelector('.user-avatar').textContent = initials;
        element.querySelector('.user-name').textContent = formatters.formatUserName(user.name);
        
        const balanceElement = element.querySelector('.user-balance');
        balanceElement.textContent = formattedBalance;
        balanceElement.className = `user-balance ${balanceClass}`;
        
        element.querySelector('.stat-item:first-child .stat-value').textContent = formattedIncome;
        element.querySelector('.stat-item:last-child .stat-value').textContent = formattedExpenses;
        
        // Анимация обновления
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 2000);
    }

    // Создать карточку для нового пользователя (заглушка)
    createPlaceholder() {
        const html = `
            <div class="user-card placeholder">
                <div class="user-avatar">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="user-name">Пригласить участника</div>
                <div class="user-balance balance-zero">0.00 zł</div>
                <div class="user-stats">
                    <div class="stat-item">
                        <div class="stat-value">0.00 zł</div>
                        <div class="stat-label">Доходы</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">0.00 zł</div>
                        <div class="stat-label">Расходы</div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-primary" onclick="showInviteModal()">
                        <i class="fas fa-user-plus"></i> Пригласить
                    </button>
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        return container.firstElementChild;
    }

    // Обновить все карточки при смене валюты
    updateCurrency(container) {
        const cards = container.querySelectorAll('.user-card[data-user-id]');
        cards.forEach(card => {
            const userId = card.dataset.userId;
            // Здесь должна быть логика получения актуальных данных пользователя
            // и вызов метода update
        });
    }

    // Добавить анимацию при добавлении дохода/расхода
    animateTransaction(element, type, amount) {
        const balanceElement = element.querySelector('.user-balance');
        const formattedAmount = currencyManager.format(amount);
        
        // Создаем элемент анимации
        const animationElement = document.createElement('div');
        animationElement.className = `transaction-animation ${type}`;
        animationElement.textContent = `${type === 'income' ? '+' : '-'}${formattedAmount}`;
        
        // Позиционируем относительно карточки
        element.style.position = 'relative';
        animationElement.style.position = 'absolute';
        animationElement.style.top = '10px';
        animationElement.style.right = '10px';
        animationElement.style.padding = '5px 10px';
        animationElement.style.borderRadius = '15px';
        animationElement.style.fontSize = '0.8rem';
        animationElement.style.fontWeight = 'bold';
        animationElement.style.zIndex = '10';
        animationElement.style.opacity = '0';
        animationElement.style.transform = 'translateY(-10px)';
        animationElement.style.transition = 'all 0.3s ease';
        
        if (type === 'income') {
            animationElement.style.background = 'var(--success-color)';
            animationElement.style.color = 'white';
        } else {
            animationElement.style.background = 'var(--error-color)';
            animationElement.style.color = 'white';
        }
        
        element.appendChild(animationElement);
        
        // Анимация появления
        setTimeout(() => {
            animationElement.style.opacity = '1';
            animationElement.style.transform = 'translateY(0)';
        }, 10);
        
        // Анимация исчезновения
        setTimeout(() => {
            animationElement.style.opacity = '0';
            animationElement.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (animationElement.parentNode) {
                    animationElement.parentNode.removeChild(animationElement);
                }
            }, 300);
        }, 2000);
        
        // Анимация пульсации баланса
        balanceElement.classList.add('pulse');
        setTimeout(() => {
            balanceElement.classList.remove('pulse');
        }, 1000);
    }

    // Показать состояние загрузки
    showLoading(element) {
        const avatar = element.querySelector('.user-avatar');
        const originalContent = avatar.innerHTML;
        
        avatar.innerHTML = '<div class="loader" style="width: 20px; height: 20px; border-width: 2px;"></div>';
        avatar.dataset.originalContent = originalContent;
        
        element.classList.add('loading');
    }

    // Скрыть состояние загрузки
    hideLoading(element) {
        const avatar = element.querySelector('.user-avatar');
        if (avatar.dataset.originalContent) {
            avatar.innerHTML = avatar.dataset.originalContent;
            delete avatar.dataset.originalContent;
        }
        
        element.classList.remove('loading');
    }

    // Подсветить карточку при активности
    highlight(element, duration = 3000) {
        element.classList.add('highlighted');
        setTimeout(() => {
            element.classList.remove('highlighted');
        }, duration);
    }
}

export default new UserCardComponent();