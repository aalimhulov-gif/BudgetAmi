// Утилиты для форматирования данных
class Formatters {
    constructor() {
        this.locale = 'ru-RU';
    }

    // Форматировать дату
    formatDate(date, options = {}) {
        const d = date instanceof Date ? date : new Date(date);
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        return d.toLocaleDateString(this.locale, formatOptions);
    }

    // Форматировать дату и время
    formatDateTime(date, options = {}) {
        const d = date instanceof Date ? date : new Date(date);
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        return d.toLocaleDateString(this.locale, formatOptions);
    }

    // Форматировать относительное время (например, "2 часа назад")
    formatRelativeTime(date) {
        const now = new Date();
        const then = date instanceof Date ? date : new Date(date);
        const diffInSeconds = Math.floor((now - then) / 1000);

        if (diffInSeconds < 60) {
            return 'только что';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} ${this.pluralize(diffInMinutes, 'минуту', 'минуты', 'минут')} назад`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} ${this.pluralize(diffInHours, 'час', 'часа', 'часов')} назад`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} ${this.pluralize(diffInDays, 'день', 'дня', 'дней')} назад`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks} ${this.pluralize(diffInWeeks, 'неделю', 'недели', 'недель')} назад`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} ${this.pluralize(diffInMonths, 'месяц', 'месяца', 'месяцев')} назад`;
        }

        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} ${this.pluralize(diffInYears, 'год', 'года', 'лет')} назад`;
    }

    // Склонение слов (для русского языка)
    pluralize(count, one, few, many) {
        const mod10 = count % 10;
        const mod100 = count % 100;

        if (mod10 === 1 && mod100 !== 11) {
            return one;
        }
        if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) {
            return few;
        }
        return many;
    }

    // Форматировать число с разделителями тысяч
    formatNumber(number, decimals = 0) {
        return number.toLocaleString(this.locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Форматировать процент
    formatPercent(decimal, decimals = 1) {
        return `${(decimal * 100).toFixed(decimals)}%`;
    }

    // Сократить длинный текст
    truncateText(text, maxLength = 50, suffix = '...') {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    // Форматировать имя пользователя
    formatUserName(name, maxLength = 20) {
        if (!name) return 'Без имени';
        return this.truncateText(name, maxLength);
    }

    // Получить инициалы из имени
    getInitials(name) {
        if (!name) return 'БИ';
        
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        
        return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
    }

    // Форматировать размер файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Байт';
        
        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Форматировать номер телефона
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 11 && cleaned.startsWith('7')) {
            return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
        }
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
        }
        
        return phone;
    }

    // Форматировать email (скрыть часть)
    formatEmail(email, showDomain = true) {
        const [localPart, domain] = email.split('@');
        
        if (localPart.length <= 3) {
            return showDomain ? email : localPart + '@***';
        }
        
        const hiddenPart = '*'.repeat(localPart.length - 3);
        const visiblePart = localPart.substring(0, 3);
        
        return showDomain 
            ? `${visiblePart}${hiddenPart}@${domain}`
            : `${visiblePart}${hiddenPart}@***`;
    }

    // Форматировать ID (сделать читабельным)
    formatId(id, separator = '-', groupSize = 4) {
        if (!id) return '';
        
        const cleaned = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const groups = [];
        
        for (let i = 0; i < cleaned.length; i += groupSize) {
            groups.push(cleaned.substring(i, i + groupSize));
        }
        
        return groups.join(separator);
    }

    // Форматировать прогресс
    formatProgress(current, target) {
        if (target === 0) return { percent: 0, text: '0%' };
        
        const percent = Math.min((current / target) * 100, 100);
        const rounded = Math.round(percent);
        
        return {
            percent: rounded,
            text: `${rounded}%`,
            decimal: percent / 100
        };
    }

    // Генерировать цвет для категории
    generateCategoryColor(categoryName) {
        const colors = [
            '#f44336', '#e91e63', '#9c27b0', '#673ab7',
            '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
            '#009688', '#4caf50', '#8bc34a', '#cddc39',
            '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
            '#795548', '#9e9e9e', '#607d8b'
        ];
        
        let hash = 0;
        for (let i = 0; i < categoryName.length; i++) {
            hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    // Форматировать статус
    formatStatus(status) {
        const statusMap = {
            'active': { text: 'Активен', class: 'success' },
            'inactive': { text: 'Неактивен', class: 'neutral' },
            'pending': { text: 'Ожидание', class: 'warning' },
            'completed': { text: 'Завершён', class: 'success' },
            'cancelled': { text: 'Отменён', class: 'error' },
            'draft': { text: 'Черновик', class: 'neutral' }
        };
        
        return statusMap[status] || { text: status, class: 'neutral' };
    }

    // Форматировать тип транзакции
    formatTransactionType(type) {
        const typeMap = {
            'income': { text: 'Доход', icon: 'fas fa-plus', class: 'success' },
            'expense': { text: 'Расход', icon: 'fas fa-minus', class: 'error' },
            'transfer': { text: 'Перевод', icon: 'fas fa-exchange-alt', class: 'info' }
        };
        
        return typeMap[type] || { text: type, icon: 'fas fa-question', class: 'neutral' };
    }

    // Генерировать читабельный URL slug
    generateSlug(text) {
        const cyrillicMap = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        
        return text
            .toLowerCase()
            .split('')
            .map(char => cyrillicMap[char] || char)
            .join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Форматировать версию
    formatVersion(version) {
        const parts = version.split('.');
        if (parts.length >= 3) {
            return `v${parts[0]}.${parts[1]}.${parts[2]}`;
        }
        return `v${version}`;
    }

    // Форматировать время (без даты)
    formatTime(date) {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString(this.locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Форматировать месяц и год
    formatMonthYear(date) {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString(this.locale, {
            year: 'numeric',
            month: 'long'
        });
    }

    // Проверить валидность email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Очистить HTML теги
    stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    // Капитализировать первую букву
    capitalize(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    // Форматировать camelCase в читабельный текст
    camelCaseToText(camelCase) {
        return camelCase
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}

export default new Formatters();