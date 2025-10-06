// Компонент навигации
import { getCurrentUser, logout } from '../firebase/auth.js';
import { showToast } from './toast.js';

class NavigationManager {
    constructor() {
        this.currentPage = 'home';
        this.pages = {
            home: { title: 'Главная', icon: '🏠' },
            categories: { title: 'Категории', icon: '📁' },
            limits: { title: 'Лимиты', icon: '⚠️' },
            goals: { title: 'Цели', icon: '🎯' },
            operations: { title: 'Операции', icon: '📋' },
            settings: { title: 'Настройки', icon: '⚙️' }
        };
        this.init();
    }

    init() {
        this.createNavigationElements();
        this.addEventListeners();
        this.updateUserInfo();
    }

    createNavigationElements() {
        // Основная навигация уже есть в HTML, просто обновляем её
        this.updateNavigation();
    }

    updateNavigation() {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;

        // Очищаем и пересоздаем навигацию
        nav.innerHTML = Object.entries(this.pages).map(([pageId, page]) => `
            <a href="#" class="nav-link ${pageId === this.currentPage ? 'active' : ''}" 
               data-page="${pageId}">
                <span class="nav-icon">${page.icon}</span>
                <span class="nav-text">${page.title}</span>
            </a>
        `).join('');
    }

    addEventListeners() {
        // Обработчик навигации
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            }
        });

        // Обработчик кнопки выхода
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }
        });

        // Обработчик переключения темы
        document.addEventListener('click', (e) => {
            if (e.target.id === 'theme-toggle' || e.target.closest('#theme-toggle')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Обработчик смены валюты
        document.addEventListener('change', (e) => {
            if (e.target.id === 'currency-selector') {
                this.changeCurrency(e.target.value);
            }
        });
    }

    // Навигация между страницами
    navigateToPage(pageId) {
        if (!this.pages[pageId]) {
            console.error('Неизвестная страница:', pageId);
            return;
        }

        // Обновляем текущую страницу
        this.currentPage = pageId;

        // Обновляем активную ссылку в навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });

        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // Показываем текущую страницу
        const currentPageElement = document.getElementById(`${pageId}-page`);
        if (currentPageElement) {
            currentPageElement.style.display = 'block';
        }

        // Обновляем заголовок страницы
        this.updatePageTitle(pageId);

        // Загружаем данные для страницы
        this.loadPageData(pageId);

        // Обновляем URL без перезагрузки
        history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    updatePageTitle(pageId) {
        const page = this.pages[pageId];
        const titleElement = document.querySelector('.page-title');
        if (titleElement && page) {
            titleElement.textContent = page.title;
        }
        
        // Обновляем title документа
        document.title = `${page.title} - Семейный Бюджет`;
    }

    // Загрузка данных для страницы
    async loadPageData(pageId) {
        try {
            switch (pageId) {
                case 'home':
                    await this.loadHomePage();
                    break;
                case 'categories':
                    await this.loadCategoriesPage();
                    break;
                case 'limits':
                    await this.loadLimitsPage();
                    break;
                case 'goals':
                    await this.loadGoalsPage();
                    break;
                case 'operations':
                    await this.loadOperationsPage();
                    break;
                case 'settings':
                    await this.loadSettingsPage();
                    break;
            }
        } catch (error) {
            console.error('Ошибка загрузки данных страницы:', error);
            showToast('Ошибка загрузки данных', 'error');
        }
    }

    // Загрузка главной страницы
    async loadHomePage() {
        // Логика загрузки данных для главной страницы
        // Это будет реализовано в отдельном компоненте
        console.log('Загрузка главной страницы');
    }

    // Загрузка страницы категорий
    async loadCategoriesPage() {
        console.log('Загрузка страницы категорий');
    }

    // Загрузка страницы лимитов
    async loadLimitsPage() {
        console.log('Загрузка страницы лимитов');
    }

    // Загрузка страницы целей
    async loadGoalsPage() {
        console.log('Загрузка страницы целей');
    }

    // Загрузка страницы операций
    async loadOperationsPage() {
        console.log('Загрузка страницы операций');
    }

    // Загрузка страницы настроек
    async loadSettingsPage() {
        console.log('Загрузка страницы настроек');
    }

    // Обновление информации о пользователе
    updateUserInfo() {
        const user = getCurrentUser();
        const userInfo = document.querySelector('.user-info');
        
        if (userInfo && user) {
            const userNameElement = userInfo.querySelector('.user-name');
            const userEmailElement = userInfo.querySelector('.user-email');
            
            if (userNameElement) {
                userNameElement.textContent = user.displayName || 'Пользователь';
            }
            
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        }
    }

    // Обработка выхода из системы
    async handleLogout() {
        try {
            await logout();
            showToast('Вы успешно вышли из системы', 'success');
            
            // Перенаправляем на страницу входа
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Ошибка выхода:', error);
            showToast('Ошибка при выходе из системы', 'error');
        }
    }

    // Переключение темы
    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Обновляем иконку переключателя
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
        
        showToast(`Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`, 'info');
    }

    // Смена валюты
    changeCurrency(currency) {
        // Здесь будет логика смены валюты
        console.log('Смена валюты на:', currency);
        showToast(`Валюта изменена на ${currency}`, 'info');
        
        // Обновляем отображение валюты
        const currencyDisplay = document.getElementById('current-currency');
        if (currencyDisplay) {
            currencyDisplay.textContent = currency;
        }
        
        // Триггерим событие смены валюты
        document.dispatchEvent(new CustomEvent('currencyChanged', {
            detail: { currency }
        }));
    }

    // Получить текущую страницу
    getCurrentPage() {
        return this.currentPage;
    }

    // Инициализация на основе URL
    initFromURL() {
        const hash = window.location.hash.slice(1);
        if (hash && this.pages[hash]) {
            this.navigateToPage(hash);
        } else {
            this.navigateToPage('home');
        }
    }

    // Обработка изменения URL
    handlePopState() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateToPage(e.state.page);
            } else {
                this.navigateToPage('home');
            }
        });
    }

    // Добавление хлебных крошек
    updateBreadcrumbs(path) {
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (!breadcrumbs) return;

        const crumbs = path.map((item, index) => {
            const isLast = index === path.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'active' : ''}">
                    ${!isLast ? `<a href="#" data-page="${item.page}">${item.title}</a>` : item.title}
                </span>
            `;
        }).join('<span class="breadcrumb-separator">›</span>');

        breadcrumbs.innerHTML = crumbs;
    }

    // Показать индикатор загрузки
    showPageLoading(pageId) {
        const page = document.getElementById(`${pageId}-page`);
        if (page) {
            page.classList.add('loading');
        }
    }

    // Скрыть индикатор загрузки
    hidePageLoading(pageId) {
        const page = document.getElementById(`${pageId}-page`);
        if (page) {
            page.classList.remove('loading');
        }
    }

    // Проверка прав доступа к странице
    canAccessPage(pageId) {
        // Здесь можно добавить логику проверки прав доступа
        const user = getCurrentUser();
        return user !== null;
    }

    // Инициализация темы при загрузке
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }
}

// Создаем и экспортируем экземпляр навигации
const navigationManager = new NavigationManager();

// Инициализируем при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    navigationManager.initTheme();
    navigationManager.initFromURL();
    navigationManager.handlePopState();
});

export default navigationManager;
export const navigateToPage = (pageId) => navigationManager.navigateToPage(pageId);
export const getCurrentPage = () => navigationManager.getCurrentPage();
export const updateUserInfo = () => navigationManager.updateUserInfo();