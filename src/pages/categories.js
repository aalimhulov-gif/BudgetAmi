// Страница управления категориями
import modal from '../components/modal.js';
import notifications from '../utils/notifications.js';
import formatters from '../utils/formatters.js';
import authManager from '../firebase/auth.js';
import dbManager from '../firebase/db.js';

class CategoriesPage {
    constructor() {
        this.currentBudget = null;
        this.categories = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Глобальная функция для открытия модалки добавления категории
        window.openAddCategoryModal = () => {
            this.openAddCategoryModal();
        };

        // Обработчик формы добавления категории
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategorySubmit(e);
            });
        }
    }

    // Загрузить данные категорий
    async loadData(budgetId) {
        try {
            this.currentBudget = { id: budgetId };
            
            const result = await dbManager.getCategories(budgetId);
            if (result.success) {
                this.categories = result.categories;
                this.renderCategories();
            } else {
                console.error('Ошибка загрузки категорий:', result.error);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            notifications.error('Ошибка загрузки категорий');
            this.showEmptyState();
        }
    }

    // Отобразить категории
    renderCategories() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        if (this.categories.length === 0) {
            this.showEmptyState();
            return;
        }

        container.innerHTML = '';

        this.categories.forEach(category => {
            const categoryCard = this.createCategoryCard(category);
            container.appendChild(categoryCard);
        });
    }

    // Создать карточку категории
    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card fade-in';
        card.dataset.categoryId = category.id;

        const iconClass = category.icon || 'fas fa-tag';
        const color = category.color || formatters.generateCategoryColor(category.name);

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">
                    <div class="category-icon" style="background: ${color}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <div class="category-name">${category.name}</div>
                        <div class="category-stats" style="font-size: 0.8rem; color: var(--text-secondary);">
                            ${this.getCategoryStats(category)}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-icon edit" onclick="categoriesPage.editCategory('${category.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-icon delete" onclick="categoriesPage.deleteCategory('${category.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="category-details">
                <div class="category-usage">
                    <div class="usage-item">
                        <span class="usage-label">Операций:</span>
                        <span class="usage-value">${category.transactionCount || 0}</span>
                    </div>
                    <div class="usage-item">
                        <span class="usage-label">Общая сумма:</span>
                        <span class="usage-value">${category.totalAmount || '0.00 zł'}</span>
                    </div>
                </div>
                
                ${category.description ? `
                    <div class="category-description">
                        <p>${category.description}</p>
                    </div>
                ` : ''}
                
                <div class="category-color-indicator" style="background: ${color}; height: 4px; border-radius: 2px; margin-top: 10px;"></div>
            </div>
        `;

        return card;
    }

    // Получить статистику категории
    getCategoryStats(category) {
        // TODO: Получить реальную статистику из транзакций
        return 'Создана ' + formatters.formatRelativeTime(category.createdAt?.toDate() || new Date());
    }

    // Показать пустое состояние
    showEmptyState() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>Нет категорий</h3>
                <p>Создайте первую категорию для организации ваших доходов и расходов</p>
                <button class="btn btn-primary" onclick="openAddCategoryModal()">
                    <i class="fas fa-plus"></i> Создать категорию
                </button>
            </div>
        `;
    }

    // Открыть модалку добавления категории
    openAddCategoryModal() {
        // Очищаем форму
        const form = document.getElementById('category-form');
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }

        // Обновляем заголовок
        const modalTitle = document.querySelector('#category-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Добавить категорию';
        }

        // Устанавливаем случайный цвет по умолчанию
        const colorInput = document.getElementById('category-color');
        if (colorInput) {
            colorInput.value = formatters.generateCategoryColor('category-' + Date.now());
        }

        modal.open('category-modal');
    }

    // Редактировать категорию
    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        // Заполняем форму данными категории
        const form = document.getElementById('category-form');
        if (form) {
            form.dataset.editingId = categoryId;
            
            const nameInput = document.getElementById('category-name');
            const iconSelect = document.getElementById('category-icon');
            const colorInput = document.getElementById('category-color');
            
            if (nameInput) nameInput.value = category.name;
            if (iconSelect) iconSelect.value = category.icon || 'fas fa-tag';
            if (colorInput) colorInput.value = category.color || '#4CAF50';
        }

        // Обновляем заголовок
        const modalTitle = document.querySelector('#category-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Редактировать категорию';
        }

        modal.open('category-modal');
    }

    // Удалить категорию
    deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        modal.createConfirm(
            'Удаление категории',
            `Вы действительно хотите удалить категорию "${category.name}"? Это действие нельзя отменить.`,
            async () => {
                try {
                    // TODO: Реализовать удаление категории в dbManager
                    notifications.success(`Категория "${category.name}" удалена`);
                    
                    // Удаляем из локального массива
                    this.categories = this.categories.filter(c => c.id !== categoryId);
                    
                    // Удаляем карточку из DOM
                    const card = document.querySelector(`[data-category-id="${categoryId}"]`);
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.remove();
                            if (this.categories.length === 0) {
                                this.showEmptyState();
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('Ошибка удаления категории:', error);
                    notifications.error('Ошибка удаления категории');
                }
            }
        );
    }

    // Обработать отправку формы категории
    async handleCategorySubmit(event) {
        const form = event.target;
        const formData = modal.getFormData('category-modal');
        
        if (!formData.name || !formData.icon || !formData.color) {
            notifications.error('Заполните все поля');
            return;
        }

        const editingId = form.dataset.editingId;
        const isEditing = !!editingId;

        try {
            modal.showLoading('category-modal', isEditing ? 'Сохранение...' : 'Создание...');

            const categoryData = {
                name: formData.name.trim(),
                icon: formData.icon,
                color: formData.color,
                description: formData.description?.trim() || ''
            };

            let result;
            if (isEditing) {
                // TODO: Реализовать обновление категории в dbManager
                result = { success: true };
                
                // Обновляем локальный массив
                const index = this.categories.findIndex(c => c.id === editingId);
                if (index !== -1) {
                    this.categories[index] = { ...this.categories[index], ...categoryData };
                }
            } else {
                result = await dbManager.addCategory(this.currentBudget.id, categoryData);
                
                if (result.success) {
                    // Добавляем в локальный массив
                    const newCategory = {
                        id: 'temp_' + Date.now(), // Временный ID
                        ...categoryData,
                        createdAt: new Date()
                    };
                    this.categories.push(newCategory);
                }
            }

            if (result.success) {
                notifications.success(isEditing ? 'Категория обновлена' : 'Категория создана');
                modal.close('category-modal');
                this.renderCategories();
            } else {
                notifications.error('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            notifications.error('Произошла ошибка при сохранении категории');
        } finally {
            modal.hideLoading('category-modal');
        }
    }

    // Поиск категорий
    searchCategories(searchTerm) {
        const cards = document.querySelectorAll('.category-card');
        
        cards.forEach(card => {
            const categoryName = card.querySelector('.category-name').textContent.toLowerCase();
            const isVisible = categoryName.includes(searchTerm.toLowerCase());
            
            if (isVisible) {
                card.style.display = '';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
                card.classList.remove('fade-in');
            }
        });
    }

    // Фильтрация по цвету
    filterByColor(color) {
        const cards = document.querySelectorAll('.category-card');
        
        cards.forEach(card => {
            const categoryId = card.dataset.categoryId;
            const category = this.categories.find(c => c.id === categoryId);
            
            if (!color || !category || category.color === color) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Сортировка категорий
    sortCategories(sortBy = 'name') {
        let sortedCategories = [...this.categories];
        
        switch (sortBy) {
            case 'name':
                sortedCategories.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'created':
                sortedCategories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case 'usage':
                sortedCategories.sort((a, b) => (b.transactionCount || 0) - (a.transactionCount || 0));
                break;
        }
        
        this.categories = sortedCategories;
        this.renderCategories();
    }

    // Экспорт категорий
    exportCategories() {
        const dataStr = JSON.stringify(this.categories, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `categories_${formatters.formatDate(new Date(), {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\./g, '-')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        notifications.success('Категории экспортированы');
    }

    // Импорт категорий
    importCategories() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importedCategories = JSON.parse(text);
                
                if (!Array.isArray(importedCategories)) {
                    notifications.error('Неверный формат файла');
                    return;
                }

                // Подтверждение импорта
                modal.createConfirm(
                    'Импорт категорий',
                    `Найдено ${importedCategories.length} категорий для импорта. Продолжить?`,
                    async () => {
                        const progressId = notifications.showProgress('Импорт категорий...', 'Импорт');
                        
                        try {
                            for (let i = 0; i < importedCategories.length; i++) {
                                const category = importedCategories[i];
                                const progress = ((i + 1) / importedCategories.length) * 100;
                                
                                notifications.updateProgress(progressId, progress, `Импорт ${i + 1} из ${importedCategories.length}`);
                                
                                // Проверяем, есть ли уже такая категория
                                const exists = this.categories.some(c => c.name === category.name);
                                if (!exists) {
                                    await dbManager.addCategory(this.currentBudget.id, {
                                        name: category.name,
                                        icon: category.icon || 'fas fa-tag',
                                        color: category.color || formatters.generateCategoryColor(category.name),
                                        description: category.description || ''
                                    });
                                }
                            }
                            
                            notifications.hide(progressId);
                            notifications.success('Категории успешно импортированы');
                            this.loadData(this.currentBudget.id);
                            
                        } catch (error) {
                            notifications.hide(progressId);
                            notifications.error('Ошибка импорта: ' + error.message);
                        }
                    }
                );
                
            } catch (error) {
                notifications.error('Ошибка чтения файла: ' + error.message);
            }
        };
        
        input.click();
    }

    // Очистить данные
    cleanup() {
        this.currentBudget = null;
        this.categories = [];
    }
}

// Создаем глобальный экземпляр
const categoriesPage = new CategoriesPage();

// Делаем доступным глобально
window.categoriesPage = categoriesPage;

export default categoriesPage;