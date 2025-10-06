// Главный файл приложения
import authManager from './firebase/auth.js';
import { auth } from './firebase/firebaseConfig.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import dbManager from './firebase/db.js';
import notifications from './utils/notifications.js';
import currencyManager from './utils/currency.js';

// Импорт страниц
import homePage from './pages/home.js';
import categoriesPage from './pages/categories.js';
import limitsPage from './pages/limits.js';
import goalsPage from './pages/goals.js';
import transactionsPage from './pages/transactions.js';
import settingsPage from './pages/settings.js';

class BudgetApp {
    constructor() {
        this.currentUser = null;
        this.currentBudget = null;
        this.currentPage = 'home';
        this.pages = {
            home: homePage,
            categories: categoriesPage,
            limits: limitsPage,
            goals: goalsPage,
            transactions: transactionsPage,
            settings: settingsPage
        };
        this.init();
    }

    init() {
        // Инициализируем аутентификацию
        this.initAuth();
        
        // Инициализируем навигацию
        this.initNavigation();
        
        // Инициализируем UI
        this.initUI();
        
        // Применяем сохраненную тему
        this.applyStoredTheme();
        
        console.log('Семейный бюджет запущен');
    }

    // Инициализация аутентификации
    initAuth() {
        try {
            // Проверяем если Firebase настроен
            if (!auth) {
                console.warn('Firebase не настроен. Показываем демо-режим.');
                this.showDemoMode();
                return;
            }
            
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    console.log('Пользователь авторизован:', user.email);
                    this.currentUser = user;
                    await this.onUserLoggedIn();
                } else {
                    console.log('Пользователь не авторизован');
                    this.currentUser = null;
                    this.onUserLoggedOut();
                }
            });
        } catch (error) {
            console.error('Ошибка инициализации Firebase:', error);
            this.showDemoMode();
        }
    }

    // Пользователь вошел в систему
    async onUserLoggedIn() {
        try {
            // Скрываем экран авторизации
            this.hideAuthScreen();
            
            // Показываем главный интерфейс
            this.showMainInterface();
            
            // Загружаем или создаем бюджет
            await this.loadOrCreateBudget();
            
            // Инициализируем валютный менеджер
            await this.initCurrencyManager();
            
            // Загружаем текущую страницу
            await this.loadCurrentPage();
            
            // Обновляем пользовательскую информацию
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Ошибка при входе в систему:', error);
            notifications.error('Ошибка загрузки приложения');
        }
    }

    // Пользователь вышел из системы
    onUserLoggedOut() {
        // Очищаем данные
        this.currentBudget = null;
        this.currentPage = 'home';
        
        // Очищаем страницы
        Object.values(this.pages).forEach(page => {
            if (page.cleanup) {
                page.cleanup();
            }
        });
        
        // Показываем экран авторизации
        this.showAuthScreen();
        
        // Скрываем главный интерфейс
        this.hideMainInterface();
    }

    // Загрузить или создать бюджет
    async loadOrCreateBudget() {
        try {
            // Ищем существующие бюджеты пользователя
            const result = await dbManager.getUserBudgets(this.currentUser.uid);
            
            if (result.success && result.budgets.length > 0) {
                // Используем первый найденный бюджет
                this.currentBudget = result.budgets[0];
                console.log('Загружен бюджет:', this.currentBudget.name);
            } else {
                // Создаем новый бюджет
                const newBudgetResult = await dbManager.createBudget({
                    name: 'Семейный бюджет',
                    description: 'Основной семейный бюджет',
                    currency: 'RUB',
                    members: [{
                        id: this.currentUser.uid,
                        name: this.currentUser.displayName || 'Пользователь',
                        email: this.currentUser.email,
                        role: 'owner'
                    }],
                    createdBy: this.currentUser.uid
                });
                
                if (newBudgetResult.success) {
                    this.currentBudget = newBudgetResult.budget;
                    console.log('Создан новый бюджет:', this.currentBudget.name);
                    
                    // Создаем базовые категории
                    await this.createDefaultCategories();
                } else {
                    throw new Error('Не удалось создать бюджет');
                }
            }
            
        } catch (error) {
            console.error('Ошибка загрузки бюджета:', error);
            notifications.error('Ошибка загрузки бюджета');
        }
    }

    // Создать базовые категории
    async createDefaultCategories() {
        const defaultCategories = [
            { name: 'Продукты', type: 'expense', icon: 'fas fa-shopping-cart', color: '#4CAF50' },
            { name: 'Транспорт', type: 'expense', icon: 'fas fa-car', color: '#2196F3' },
            { name: 'Коммунальные услуги', type: 'expense', icon: 'fas fa-home', color: '#FF9800' },
            { name: 'Развлечения', type: 'expense', icon: 'fas fa-gamepad', color: '#9C27B0' },
            { name: 'Здоровье', type: 'expense', icon: 'fas fa-heartbeat', color: '#F44336' },
            { name: 'Зарплата', type: 'income', icon: 'fas fa-money-bill-wave', color: '#4CAF50' },
            { name: 'Дополнительный доход', type: 'income', icon: 'fas fa-plus-circle', color: '#8BC34A' }
        ];

        for (const category of defaultCategories) {
            try {
                await dbManager.createCategory(this.currentBudget.id, category);
            } catch (error) {
                console.error('Ошибка создания категории:', category.name, error);
            }
        }
    }

    // Инициализировать валютный менеджер
    async initCurrencyManager() {
        try {
            const currency = this.currentBudget?.currency || 'RUB';
            await currencyManager.setCurrency(currency);
        } catch (error) {
            console.error('Ошибка инициализации валют:', error);
        }
    }

    // Инициализация навигации
    initNavigation() {
        // Обработчики навигации
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // Обработчик кнопки назад в браузере
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });

        // Устанавливаем начальное состояние
        const initialPage = this.getPageFromUrl() || 'home';
        history.replaceState({ page: initialPage }, '', `#${initialPage}`);
    }

    // Навигация к странице
    async navigateTo(page, pushState = true) {
        if (!this.pages[page]) {
            console.error('Страница не найдена:', page);
            return;
        }

        try {
            // Обновляем текущую страницу
            this.currentPage = page;
            
            // Обновляем навигацию
            this.updateNavigation();
            
            // Показываем нужную страницу
            this.showPage(page);
            
            // Загружаем данные страницы
            await this.loadPageData(page);
            
            // Обновляем URL
            if (pushState) {
                history.pushState({ page }, '', `#${page}`);
            }
            
            // Обновляем заголовок
            this.updatePageTitle(page);
            
        } catch (error) {
            console.error('Ошибка навигации:', error);
            notifications.error('Ошибка загрузки страницы');
        }
    }

    // Загрузить данные для страницы
    async loadPageData(page) {
        if (!this.currentBudget || !this.currentUser) return;
        
        const pageInstance = this.pages[page];
        if (pageInstance && typeof pageInstance.loadData === 'function') {
            await pageInstance.loadData(this.currentBudget.id, this.currentBudget, this.currentUser);
        }
    }

    // Загрузить текущую страницу
    async loadCurrentPage() {
        const page = this.getPageFromUrl() || 'home';
        await this.navigateTo(page, false);
    }

    // Получить страницу из URL
    getPageFromUrl() {
        const hash = window.location.hash.substring(1);
        return hash || null;
    }

    // Показать страницу
    showPage(page) {
        // Скрываем все страницы
        const allPages = document.querySelectorAll('.page-content');
        allPages.forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        // Показываем нужную страницу
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }
    }

    // Обновить навигацию
    updateNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    // Обновить заголовок страницы
    updatePageTitle(page) {
        const titles = {
            home: 'Главная',
            categories: 'Категории',
            limits: 'Лимиты',
            goals: 'Цели',
            transactions: 'История операций',
            settings: 'Настройки'
        };

        const title = titles[page] || 'Семейный бюджет';
        document.title = `${title} - Семейный бюджет`;
        
        // Обновляем заголовок в UI
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }

    // Инициализация UI
    initUI() {
        // Обработчики модальных окон
        this.initModals();
        
        // Обработчики уведомлений
        this.initNotifications();
        
        // Обработчики форм
        this.initForms();
        
        // Инициализируем меню
        this.initMenu();
    }

    // Инициализация модальных окон
    initModals() {
        // Закрытие модальных окон по клику на фон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.remove();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal.active');
                if (modal) {
                    modal.remove();
                }
            }
        });
    }

    // Инициализация уведомлений
    initNotifications() {
        // Создаем контейнер для уведомлений если его нет
        if (!document.getElementById('notifications-container')) {
            const container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
    }

    // Инициализация форм
    initForms() {
        // Обработчик формы добавления транзакции
        const addTransactionForm = document.getElementById('add-transaction-form');
        if (addTransactionForm) {
            addTransactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTransaction(e);
            });
        }

        // Другие формы...
    }

    // Инициализация меню
    initMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });

            // Закрытие меню по клику вне его
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }

    // Обработка добавления транзакции
    async handleAddTransaction(e) {
        try {
            const formData = new FormData(e.target);
            const transactionData = {
                type: formData.get('type'),
                amount: parseFloat(formData.get('amount')),
                category: formData.get('category'),
                description: formData.get('description'),
                userId: this.currentUser.uid,
                budgetId: this.currentBudget.id,
                date: formData.get('date') || new Date().toISOString().split('T')[0]
            };

            const result = await dbManager.createTransaction(this.currentBudget.id, transactionData);
            
            if (result.success) {
                notifications.success('Операция добавлена');
                e.target.reset();
                
                // Обновляем данные на текущей странице
                await this.loadPageData(this.currentPage);
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Ошибка добавления операции:', error);
            notifications.error('Ошибка добавления операции');
        }
    }

    // Показать экран авторизации
    showAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        const mainInterface = document.getElementById('main-interface');
        
        if (authScreen) authScreen.style.display = 'flex';
        if (mainInterface) mainInterface.style.display = 'none';
    }

    // Скрыть экран авторизации
    hideAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.style.display = 'none';
    }

    // Показать главный интерфейс
    showMainInterface() {
        const mainInterface = document.getElementById('main-interface');
        if (mainInterface) mainInterface.style.display = 'flex';
    }

    // Скрыть главный интерфейс
    hideMainInterface() {
        const mainInterface = document.getElementById('main-interface');
        if (mainInterface) mainInterface.style.display = 'none';
    }

    // Обновить информацию о пользователе
    updateUserInfo() {
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email');
        
        if (this.currentUser) {
            const displayName = this.currentUser.displayName || 'Пользователь';
            const email = this.currentUser.email;
            
            userNameElements.forEach(el => el.textContent = displayName);
            userEmailElements.forEach(el => el.textContent = email);
        }
    }

    // Применить сохраненную тему
    applyStoredTheme() {
        const savedTheme = localStorage.getItem('theme') || 'system';
        const body = document.body;
        
        body.classList.remove('theme-light', 'theme-dark');
        
        if (savedTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        } else {
            body.classList.add(`theme-${savedTheme}`);
        }
    }

    // Получить текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }

    // Получить текущий бюджет
    getCurrentBudget() {
        return this.currentBudget;
    }

    // Обновить бюджет
    async refreshBudget() {
        if (!this.currentBudget) return;
        
        try {
            const result = await dbManager.getBudget(this.currentBudget.id);
            if (result.success) {
                this.currentBudget = result.budget;
                
                // Обновляем данные на текущей странице
                await this.loadPageData(this.currentPage);
            }
        } catch (error) {
            console.error('Ошибка обновления бюджета:', error);
        }
    }

    // Демо-режим когда Firebase не настроен
    showDemoMode() {
        console.log('Запуск в демо-режиме');
        
        // Скрываем экран загрузки
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Показываем уведомление о демо-режиме
        setTimeout(() => {
            if (typeof notifications !== 'undefined' && notifications.info) {
                notifications.info('Демо-режим: Firebase не настроен. Настройте Firebase для полной функциональности.');
            } else {
                console.log('Демо-режим: Firebase не настроен. Настройте Firebase для полной функциональности.');
            }
        }, 1000);
        
        // Показываем главный интерфейс без аутентификации
        this.showMainInterface();
        this.navigateTo('home', false);
    }
}

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Создаем и запускаем приложение
        const app = new BudgetApp();
        
        // Делаем приложение доступным глобально для отладки
        window.budgetApp = app;
        
        console.log('Семейный бюджет успешно запущен');
    } catch (error) {
        console.error('Ошибка запуска приложения:', error);
        
        // Показываем сообщение об ошибке
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: #ff6b6b;">
                    <h3>Ошибка загрузки</h3>
                    <p>Проверьте консоль браузера для деталей</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                        Перезагрузить
                    </button>
                </div>
            `;
        }
    }
});

export default BudgetApp;