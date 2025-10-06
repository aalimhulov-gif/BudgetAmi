// Страница настроек
import notifications from '../utils/notifications.js';
import currencyManager from '../utils/currency.js';
import formatters from '../utils/formatters.js';
import dbManager from '../firebase/db.js';
import authManager, { auth } from '../firebase/auth.js';

class SettingsPage {
    constructor() {
        this.currentUser = null;
        this.currentBudget = null;
        this.settings = {};
        this.supportedCurrencies = [];
        this.init();
    }

    init() {
        this.loadSupportedCurrencies();
        this.bindEvents();
    }

    bindEvents() {
        // Сохранение настроек
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Смена темы
        const themeSelect = document.getElementById('theme-setting');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }

        // Смена валюты
        const currencySelect = document.getElementById('currency-setting');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.changeCurrency(e.target.value);
            });
        }

        // Очистка кэша
        const clearCacheBtn = document.getElementById('clear-cache');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }

        // Экспорт данных
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Импорт данных
        const importBtn = document.getElementById('import-data');
        const importFile = document.getElementById('import-file');
        
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
            
            importFile.addEventListener('change', (e) => {
                this.importData(e.target.files[0]);
            });
        }

        // Удаление аккаунта
        const deleteAccountBtn = document.getElementById('delete-account');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.deleteAccount();
            });
        }

        // Выход из аккаунта
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Обновление курса валют
        const updateRatesBtn = document.getElementById('update-rates');
        if (updateRatesBtn) {
            updateRatesBtn.addEventListener('click', () => {
                this.updateExchangeRates();
            });
        }

        // Управление категориями
        this.bindCategoryEvents();
        
        // Управление пользователями бюджета
        this.bindUserEvents();
        
        // Настройки уведомлений
        this.bindNotificationEvents();
    }

    // События категорий
    bindCategoryEvents() {
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showAddCategoryModal();
            });
        }
    }

    // События управления пользователями
    bindUserEvents() {
        const inviteUserBtn = document.getElementById('invite-user-btn');
        if (inviteUserBtn) {
            inviteUserBtn.addEventListener('click', () => {
                this.showInviteUserModal();
            });
        }
    }

    // События уведомлений
    bindNotificationEvents() {
        const notificationCheckboxes = document.querySelectorAll('.notification-setting');
        notificationCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateNotificationSettings();
            });
        });
    }

    // Загрузить данные
    async loadData(budgetId, budgetData, user) {
        try {
            this.currentBudget = budgetData || { id: budgetId };
            this.currentUser = user;
            
            // Загружаем настройки пользователя
            await this.loadUserSettings();
            
            // Загружаем настройки бюджета
            await this.loadBudgetSettings();
            
            // Обновляем UI
            this.updateUI();
            
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            notifications.error('Ошибка загрузки настроек');
        }
    }

    // Загрузить настройки пользователя
    async loadUserSettings() {
        if (!this.currentUser) return;

        try {
            const result = await dbManager.getUserSettings(this.currentUser.uid);
            if (result.success) {
                this.settings = { ...this.settings, ...result.settings };
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек пользователя:', error);
        }
    }

    // Загрузить настройки бюджета
    async loadBudgetSettings() {
        if (!this.currentBudget) return;

        try {
            const result = await dbManager.getBudgetSettings(this.currentBudget.id);
            if (result.success) {
                this.settings = { ...this.settings, ...result.settings };
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек бюджета:', error);
        }
    }

    // Загрузить поддерживаемые валюты
    async loadSupportedCurrencies() {
        try {
            this.supportedCurrencies = await currencyManager.getSupportedCurrencies();
        } catch (error) {
            console.error('Ошибка загрузки валют:', error);
            this.supportedCurrencies = [
                { code: 'RUB', name: 'Российский рубль', symbol: '₽' },
                { code: 'USD', name: 'Доллар США', symbol: '$' },
                { code: 'EUR', name: 'Евро', symbol: '€' }
            ];
        }
    }

    // Обновить UI
    updateUI() {
        this.updateThemeSelect();
        this.updateCurrencySelect();
        this.updateNotificationSettings();
        this.updateUserInfo();
        this.updateBudgetInfo();
        this.updateStatistics();
        this.renderCategoriesManagement();
        this.renderUsersManagement();
    }

    // Обновить выбор темы
    updateThemeSelect() {
        const themeSelect = document.getElementById('theme-setting');
        if (themeSelect) {
            themeSelect.value = this.settings.theme || 'system';
        }
    }

    // Обновить выбор валюты
    updateCurrencySelect() {
        const currencySelect = document.getElementById('currency-setting');
        if (currencySelect) {
            // Очищаем и заполняем валютами
            currencySelect.innerHTML = '';
            
            this.supportedCurrencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.name} (${currency.symbol})`;
                currencySelect.appendChild(option);
            });
            
            currencySelect.value = this.settings.currency || 'RUB';
        }
    }

    // Обновить настройки уведомлений
    updateNotificationSettings() {
        const notificationSettings = this.settings.notifications || {};
        
        Object.keys(notificationSettings).forEach(key => {
            const checkbox = document.getElementById(`notification-${key}`);
            if (checkbox) {
                checkbox.checked = notificationSettings[key];
            }
        });
    }

    // Обновить информацию о пользователе
    updateUserInfo() {
        const userNameEl = document.getElementById('user-name-display');
        const userEmailEl = document.getElementById('user-email-display');
        const userJoinedEl = document.getElementById('user-joined-display');
        
        if (userNameEl && this.currentUser) {
            userNameEl.textContent = this.currentUser.displayName || 'Пользователь';
        }
        
        if (userEmailEl && this.currentUser) {
            userEmailEl.textContent = this.currentUser.email;
        }
        
        if (userJoinedEl && this.currentUser) {
            const joinDate = new Date(this.currentUser.metadata.creationTime);
            userJoinedEl.textContent = formatters.formatDate(joinDate);
        }
    }

    // Обновить информацию о бюджете
    updateBudgetInfo() {
        const budgetNameEl = document.getElementById('budget-name-display');
        const budgetMembersEl = document.getElementById('budget-members-count');
        const budgetCreatedEl = document.getElementById('budget-created-display');
        
        if (budgetNameEl && this.currentBudget) {
            budgetNameEl.textContent = this.currentBudget.name || 'Семейный бюджет';
        }
        
        if (budgetMembersEl && this.currentBudget) {
            const membersCount = (this.currentBudget.members || []).length;
            budgetMembersEl.textContent = `${membersCount} ${formatters.pluralize(membersCount, 'участник', 'участника', 'участников')}`;
        }
        
        if (budgetCreatedEl && this.currentBudget) {
            const createdDate = this.currentBudget.createdAt?.toDate() || new Date();
            budgetCreatedEl.textContent = formatters.formatDate(createdDate);
        }
    }

    // Обновить статистику
    updateStatistics() {
        // Здесь можно показать различную статистику использования
        // Пока оставим заглушки
        const statsContainer = document.getElementById('usage-statistics');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Всего операций:</span>
                    <span class="stat-value">—</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Активных категорий:</span>
                    <span class="stat-value">—</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Дней активности:</span>
                    <span class="stat-value">—</span>
                </div>
            `;
        }
    }

    // Сменить тему
    changeTheme(theme) {
        this.settings.theme = theme;
        
        // Применяем тему
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'system') {
            // Используем системную тему
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        } else {
            body.classList.add(`theme-${theme}`);
        }
        
        // Сохраняем в localStorage для быстрого применения
        localStorage.setItem('theme', theme);
        
        notifications.success('Тема изменена');
    }

    // Сменить валюту
    async changeCurrency(currencyCode) {
        try {
            this.settings.currency = currencyCode;
            
            // Обновляем валюту в менеджере
            await currencyManager.setCurrency(currencyCode);
            
            // Обновляем отображение сумм на странице
            this.updateAmountDisplays();
            
            notifications.success(`Валюта изменена на ${currencyCode}`);
            
        } catch (error) {
            console.error('Ошибка смены валюты:', error);
            notifications.error('Ошибка смены валюты');
        }
    }

    // Обновить отображение сумм
    updateAmountDisplays() {
        // Находим все элементы с суммами и обновляем их
        const amountElements = document.querySelectorAll('[data-amount]');
        amountElements.forEach(element => {
            const amount = parseFloat(element.dataset.amount);
            if (!isNaN(amount)) {
                element.textContent = currencyManager.format(amount);
            }
        });
    }

    // Сохранить настройки
    async saveSettings() {
        try {
            // Собираем все настройки из формы
            const formData = new FormData(document.getElementById('settings-form'));
            const formSettings = Object.fromEntries(formData.entries());
            
            // Собираем настройки уведомлений
            const notificationSettings = {};
            document.querySelectorAll('.notification-setting').forEach(checkbox => {
                const key = checkbox.id.replace('notification-', '');
                notificationSettings[key] = checkbox.checked;
            });
            
            this.settings.notifications = notificationSettings;
            
            // Сохраняем настройки пользователя
            if (this.currentUser) {
                const userSettings = {
                    theme: this.settings.theme,
                    currency: this.settings.currency,
                    notifications: this.settings.notifications
                };
                
                await dbManager.updateUserSettings(this.currentUser.uid, userSettings);
            }
            
            // Сохраняем настройки бюджета
            if (this.currentBudget) {
                const budgetSettings = {
                    // Здесь настройки специфичные для бюджета
                };
                
                await dbManager.updateBudgetSettings(this.currentBudget.id, budgetSettings);
            }
            
            notifications.success('Настройки сохранены');
            
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            notifications.error('Ошибка сохранения настроек');
        }
    }

    // Очистить кэш
    clearCache() {
        // Очищаем localStorage
        const keysToKeep = ['theme', 'currency'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // Очищаем кэш валют
        currencyManager.clearCache();
        
        notifications.success('Кэш очищен');
    }

    // Экспортировать данные
    async exportData() {
        try {
            if (!this.currentBudget) {
                notifications.error('Бюджет не выбран');
                return;
            }
            
            // Собираем все данные
            const budgetData = await dbManager.getBudgetData(this.currentBudget.id);
            
            const exportData = {
                budget: this.currentBudget,
                transactions: budgetData.transactions || [],
                categories: budgetData.categories || [],
                limits: budgetData.limits || [],
                goals: budgetData.goals || [],
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            // Создаем и скачиваем файл
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `budget_backup_${formatters.formatDate(new Date(), {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\./g, '-')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            notifications.success('Данные экспортированы');
            
        } catch (error) {
            console.error('Ошибка экспорта данных:', error);
            notifications.error('Ошибка экспорта данных');
        }
    }

    // Импортировать данные
    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            // Валидируем структуру данных
            if (!importData.budget || !importData.version) {
                throw new Error('Неверный формат файла');
            }
            
            // Показываем подтверждение
            const confirmed = confirm(`Импортировать данные из "${importData.budget.name}"?\nЭто может перезаписать существующие данные.`);
            if (!confirmed) return;
            
            // Импортируем данные
            await this.performDataImport(importData);
            
            notifications.success('Данные импортированы');
            
        } catch (error) {
            console.error('Ошибка импорта данных:', error);
            notifications.error('Ошибка импорта данных: ' + error.message);
        }
    }

    // Выполнить импорт данных
    async performDataImport(importData) {
        if (!this.currentBudget) return;
        
        const operations = [];
        
        // Импортируем категории
        if (importData.categories) {
            for (const category of importData.categories) {
                operations.push(dbManager.createCategory(this.currentBudget.id, category));
            }
        }
        
        // Импортируем лимиты
        if (importData.limits) {
            for (const limit of importData.limits) {
                operations.push(dbManager.createLimit(this.currentBudget.id, limit));
            }
        }
        
        // Импортируем цели
        if (importData.goals) {
            for (const goal of importData.goals) {
                operations.push(dbManager.createGoal(this.currentBudget.id, goal));
            }
        }
        
        // Импортируем транзакции
        if (importData.transactions) {
            for (const transaction of importData.transactions) {
                operations.push(dbManager.createTransaction(this.currentBudget.id, transaction));
            }
        }
        
        // Выполняем все операции
        await Promise.allSettled(operations);
    }

    // Обновить курсы валют
    async updateExchangeRates() {
        try {
            const updateBtn = document.getElementById('update-rates');
            if (updateBtn) {
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
            }
            
            await currencyManager.updateRates();
            
            notifications.success('Курсы валют обновлены');
            
        } catch (error) {
            console.error('Ошибка обновления курсов:', error);
            notifications.error('Ошибка обновления курсов валют');
        } finally {
            const updateBtn = document.getElementById('update-rates');
            if (updateBtn) {
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="fas fa-refresh"></i> Обновить курсы';
            }
        }
    }

    // Показать модальное окно добавления категории
    showAddCategoryModal() {
        // TODO: Реализовать модальное окно добавления категории
        notifications.info('Функция в разработке');
    }

    // Показать модальное окно приглашения пользователя
    showInviteUserModal() {
        // TODO: Реализовать модальное окно приглашения пользователя
        notifications.info('Функция в разработке');
    }

    // Отобразить управление категориями
    renderCategoriesManagement() {
        const container = document.getElementById('categories-management');
        if (!container) return;
        
        container.innerHTML = `
            <div class="management-section">
                <h4>Управление категориями</h4>
                <p>Создавайте и редактируйте категории для ваших доходов и расходов</p>
                <button id="add-category-btn" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Добавить категорию
                </button>
            </div>
        `;
        
        this.bindCategoryEvents();
    }

    // Отобразить управление пользователями
    renderUsersManagement() {
        const container = document.getElementById('users-management');
        if (!container) return;
        
        const membersCount = (this.currentBudget?.members || []).length;
        
        container.innerHTML = `
            <div class="management-section">
                <h4>Участники бюджета</h4>
                <p>Приглашайте членов семьи для совместного ведения бюджета</p>
                <div class="current-members">
                    <span>${membersCount} ${formatters.pluralize(membersCount, 'участник', 'участника', 'участников')}</span>
                </div>
                <button id="invite-user-btn" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i> Пригласить участника
                </button>
            </div>
        `;
        
        this.bindUserEvents();
    }

    // Обновить настройки уведомлений
    updateNotificationSettings() {
        const notificationSettings = {};
        
        document.querySelectorAll('.notification-setting').forEach(checkbox => {
            const key = checkbox.id.replace('notification-', '');
            notificationSettings[key] = checkbox.checked;
        });
        
        this.settings.notifications = notificationSettings;
    }

    // Удалить аккаунт
    async deleteAccount() {
        const confirmed = confirm('Вы уверены, что хотите удалить аккаунт?\nЭто действие нельзя отменить.');
        if (!confirmed) return;
        
        const email = prompt('Для подтверждения введите ваш email:');
        if (email !== this.currentUser?.email) {
            notifications.error('Email не совпадает');
            return;
        }
        
        try {
            // Удаляем данные пользователя
            await dbManager.deleteUserData(this.currentUser.uid);
            
            // Удаляем аккаунт
            await auth.currentUser.delete();
            
            notifications.success('Аккаунт удален');
            
            // Перенаправляем на страницу входа
            window.location.href = '/';
            
        } catch (error) {
            console.error('Ошибка удаления аккаунта:', error);
            notifications.error('Ошибка удаления аккаунта');
        }
    }

    // Выйти из аккаунта
    async logout() {
        try {
            await auth.signOut();
            notifications.success('Вы вышли из аккаунта');
            window.location.href = '/';
        } catch (error) {
            console.error('Ошибка выхода:', error);
            notifications.error('Ошибка выхода из аккаунта');
        }
    }

    // Очистить данные
    cleanup() {
        this.currentUser = null;
        this.currentBudget = null;
        this.settings = {};
    }
}

// Создаем глобальный экземпляр
const settingsPage = new SettingsPage();

// Делаем доступным глобально
window.settingsPage = settingsPage;

export default settingsPage;