// Утилиты для работы с датами
export const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const MONTH_NAMES_SHORT = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

export const DAY_NAMES = [
    'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

export const DAY_NAMES_SHORT = [
    'Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'
];

// Форматировать дату в локальном формате
export function formatDate(date, format = 'dd.mm.yyyy') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return 'Некорректная дата';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    switch (format) {
        case 'dd.mm.yyyy':
            return `${day}.${month}.${year}`;
        case 'dd.mm':
            return `${day}.${month}`;
        case 'yyyy-mm-dd':
            return `${year}-${month}-${day}`;
        case 'dd.mm.yyyy hh:mm':
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        case 'hh:mm':
            return `${hours}:${minutes}`;
        case 'month yyyy':
            return `${MONTH_NAMES[date.getMonth()]} ${year}`;
        case 'month':
            return MONTH_NAMES[date.getMonth()];
        case 'day':
            return DAY_NAMES[date.getDay()];
        case 'relative':
            return getRelativeTime(date);
        default:
            return `${day}.${month}.${year}`;
    }
}

// Получить относительное время ("сегодня", "вчера", "2 дня назад")
export function getRelativeTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Сегодня';
    } else if (diffDays === 1) {
        return 'Вчера';
    } else if (diffDays === 2) {
        return 'Позавчера';
    } else if (diffDays > 0 && diffDays <= 7) {
        return `${diffDays} дня назад`;
    } else if (diffDays > 7 && diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 неделю назад' : `${weeks} недели назад`;
    } else if (diffDays > 30 && diffDays <= 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 месяц назад' : `${months} месяцев назад`;
    } else if (diffDays > 365) {
        const years = Math.floor(diffDays / 365);
        return years === 1 ? '1 год назад' : `${years} лет назад`;
    } else if (diffDays < 0) {
        const futureDays = Math.abs(diffDays);
        if (futureDays === 1) {
            return 'Завтра';
        } else if (futureDays === 2) {
            return 'Послезавтра';
        } else {
            return `Через ${futureDays} дней`;
        }
    }
    
    return formatDate(date);
}

// Начало дня
export function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

// Конец дня
export function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

// Начало недели (понедельник)
export function startOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Понедельник как начало недели
    result.setDate(diff);
    return startOfDay(result);
}

// Конец недели (воскресенье)
export function endOfWeek(date) {
    const result = startOfWeek(date);
    result.setDate(result.getDate() + 6);
    return endOfDay(result);
}

// Начало месяца
export function startOfMonth(date) {
    const result = new Date(date);
    result.setDate(1);
    return startOfDay(result);
}

// Конец месяца
export function endOfMonth(date) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    return endOfDay(result);
}

// Начало года
export function startOfYear(date) {
    const result = new Date(date);
    result.setMonth(0, 1);
    return startOfDay(result);
}

// Конец года
export function endOfYear(date) {
    const result = new Date(date);
    result.setMonth(11, 31);
    return endOfDay(result);
}

// Добавить дни к дате
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Добавить месяцы к дате
export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

// Добавить годы к дате
export function addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}

// Проверить, находится ли дата в диапазоне
export function isDateInRange(date, startDate, endDate) {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return checkDate >= start && checkDate <= end;
}

// Получить дни месяца
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Проверить високосный год
export function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Получить номер недели в году
export function getWeekNumber(date) {
    const startOfYearDate = startOfYear(date);
    const diffInTime = date.getTime() - startOfYearDate.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffInDays / 7);
}

// Получить возраст в годах
export function getAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Парсинг даты из строки
export function parseDate(dateString) {
    if (!dateString) return null;
    
    // Поддерживаемые форматы: dd.mm.yyyy, yyyy-mm-dd, dd/mm/yyyy
    const formats = [
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // dd.mm.yyyy
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ // dd/mm/yyyy
    ];
    
    for (let i = 0; i < formats.length; i++) {
        const match = dateString.match(formats[i]);
        if (match) {
            let day, month, year;
            
            if (i === 1) { // yyyy-mm-dd
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            } else { // dd.mm.yyyy или dd/mm/yyyy
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                year = parseInt(match[3]);
            }
            
            const date = new Date(year, month, day);
            
            // Проверяем валидность даты
            if (date.getFullYear() === year && 
                date.getMonth() === month && 
                date.getDate() === day) {
                return date;
            }
        }
    }
    
    // Пробуем стандартный парсинг
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
}

// Валидация даты
export function isValidDate(date) {
    if (!(date instanceof Date)) {
        date = parseDate(date);
    }
    
    return date instanceof Date && !isNaN(date.getTime());
}

// Получить диапазон дат для фильтрации
export function getDateRange(period) {
    const now = new Date();
    
    switch (period) {
        case 'today':
            return {
                start: startOfDay(now),
                end: endOfDay(now)
            };
        case 'yesterday':
            const yesterday = addDays(now, -1);
            return {
                start: startOfDay(yesterday),
                end: endOfDay(yesterday)
            };
        case 'week':
            return {
                start: startOfWeek(now),
                end: endOfWeek(now)
            };
        case 'month':
            return {
                start: startOfMonth(now),
                end: endOfMonth(now)
            };
        case 'quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            const quarterEnd = addMonths(quarterStart, 3);
            quarterEnd.setDate(0); // Последний день предыдущего месяца
            return {
                start: startOfDay(quarterStart),
                end: endOfDay(quarterEnd)
            };
        case 'year':
            return {
                start: startOfYear(now),
                end: endOfYear(now)
            };
        case 'last7days':
            return {
                start: startOfDay(addDays(now, -6)),
                end: endOfDay(now)
            };
        case 'last30days':
            return {
                start: startOfDay(addDays(now, -29)),
                end: endOfDay(now)
            };
        case 'last90days':
            return {
                start: startOfDay(addDays(now, -89)),
                end: endOfDay(now)
            };
        default:
            return {
                start: startOfMonth(now),
                end: endOfMonth(now)
            };
    }
}

// Получить список месяцев для селектора
export function getMonthOptions() {
    return MONTH_NAMES.map((name, index) => ({
        value: index,
        label: name
    }));
}

// Получить список лет для селектора
export function getYearOptions(startYear = 2020, endYear = null) {
    if (!endYear) {
        endYear = new Date().getFullYear() + 5;
    }
    
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
        years.push({
            value: year,
            label: year.toString()
        });
    }
    
    return years;
}