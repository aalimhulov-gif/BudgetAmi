// Утилиты для работы с данными

// Группировка данных по ключу
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
}

// Сортировка данных
export function sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];
        
        // Обработка дат
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        
        // Обработка строк (регистронезависимо)
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

// Фильтрация данных по нескольким критериям
export function filterData(array, filters) {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                return true; // Пропускаем пустые фильтры
            }
            
            const itemValue = item[key];
            
            // Особая обработка для разных типов фильтров
            if (typeof value === 'object' && value.type) {
                switch (value.type) {
                    case 'range':
                        return itemValue >= value.min && itemValue <= value.max;
                    case 'dateRange':
                        const itemDate = new Date(itemValue);
                        const startDate = new Date(value.start);
                        const endDate = new Date(value.end);
                        return itemDate >= startDate && itemDate <= endDate;
                    case 'contains':
                        return itemValue.toString().toLowerCase().includes(value.value.toString().toLowerCase());
                    case 'in':
                        return value.values.includes(itemValue);
                    default:
                        return itemValue === value.value;
                }
            }
            
            // Обычное сравнение
            if (typeof value === 'string') {
                return itemValue.toString().toLowerCase().includes(value.toLowerCase());
            }
            
            return itemValue === value;
        });
    });
}

// Поиск по тексту в нескольких полях
export function searchInFields(array, searchText, fields) {
    if (!searchText || searchText.trim() === '') {
        return array;
    }
    
    const lowerSearchText = searchText.toLowerCase();
    
    return array.filter(item => {
        return fields.some(field => {
            const fieldValue = item[field];
            if (fieldValue === null || fieldValue === undefined) {
                return false;
            }
            return fieldValue.toString().toLowerCase().includes(lowerSearchText);
        });
    });
}

// Пагинация данных
export function paginate(array, page = 1, pageSize = 10) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
        data: array.slice(startIndex, endIndex),
        page,
        pageSize,
        totalItems: array.length,
        totalPages: Math.ceil(array.length / pageSize),
        hasNext: endIndex < array.length,
        hasPrev: page > 1
    };
}

// Суммирование значений
export function sumBy(array, key) {
    return array.reduce((sum, item) => {
        const value = parseFloat(item[key]) || 0;
        return sum + value;
    }, 0);
}

// Подсчет среднего значения
export function averageBy(array, key) {
    if (array.length === 0) return 0;
    return sumBy(array, key) / array.length;
}

// Нахождение минимального и максимального значения
export function minMaxBy(array, key) {
    if (array.length === 0) {
        return { min: 0, max: 0 };
    }
    
    const values = array.map(item => parseFloat(item[key]) || 0);
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

// Группировка и суммирование
export function groupAndSum(array, groupKey, sumKey) {
    const grouped = groupBy(array, groupKey);
    const result = {};
    
    for (const [key, items] of Object.entries(grouped)) {
        result[key] = {
            items,
            total: sumBy(items, sumKey),
            count: items.length
        };
    }
    
    return result;
}

// Создание уникального ID
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${randomStr}`;
}

// Глубокое клонирование объекта
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    
    return cloned;
}

// Глубокое сравнение объектов
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    
    if (obj1 == null || obj2 == null) {
        return false;
    }
    
    if (typeof obj1 !== typeof obj2) {
        return false;
    }
    
    if (typeof obj1 !== 'object') {
        return obj1 === obj2;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
        return false;
    }
    
    for (const key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }
        
        if (!deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    
    return true;
}

// Слияние объектов
export function mergeObjects(...objects) {
    const result = {};
    
    for (const obj of objects) {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        result[key] = mergeObjects(result[key] || {}, obj[key]);
                    } else {
                        result[key] = obj[key];
                    }
                }
            }
        }
    }
    
    return result;
}

// Получение значения по пути (например, 'user.profile.name')
export function getByPath(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
}

// Установка значения по пути
export function setByPath(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
}

// Удаление дубликатов из массива
export function removeDuplicates(array, key = null) {
    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    } else {
        return [...new Set(array)];
    }
}

// Преобразование массива в объект с ключами
export function arrayToObject(array, keyField, valueField = null) {
    const result = {};
    
    for (const item of array) {
        const key = item[keyField];
        result[key] = valueField ? item[valueField] : item;
    }
    
    return result;
}

// Подсчет элементов по условию
export function countBy(array, predicate) {
    if (typeof predicate === 'string') {
        // Группировка по полю
        const groups = groupBy(array, predicate);
        const result = {};
        for (const [key, items] of Object.entries(groups)) {
            result[key] = items.length;
        }
        return result;
    } else if (typeof predicate === 'function') {
        // Подсчет по функции
        return array.filter(predicate).length;
    }
    
    return 0;
}

// Создание статистики по массиву
export function createStats(array, numericField) {
    if (array.length === 0) {
        return {
            count: 0,
            sum: 0,
            average: 0,
            min: 0,
            max: 0
        };
    }
    
    const values = array.map(item => parseFloat(item[numericField]) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
        count: array.length,
        sum,
        average: sum / array.length,
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

// Преобразование данных для графиков
export function prepareChartData(array, labelField, valueField, options = {}) {
    const {
        sortBy: sortField = null,
        sortDirection = 'asc',
        limit = null,
        groupByPeriod = null // 'day', 'week', 'month', 'year'
    } = options;
    
    let processedData = [...array];
    
    // Группировка по периоду для временных данных
    if (groupByPeriod && labelField.includes('date')) {
        processedData = groupByTimePeriod(processedData, labelField, valueField, groupByPeriod);
    }
    
    // Группировка и суммирование
    const grouped = groupAndSum(processedData, labelField, valueField);
    
    // Преобразование в массив для графика
    let chartData = Object.entries(grouped).map(([label, data]) => ({
        label,
        value: data.total,
        count: data.count
    }));
    
    // Сортировка
    if (sortField) {
        chartData = sortBy(chartData, sortField, sortDirection);
    }
    
    // Ограничение количества элементов
    if (limit) {
        chartData = chartData.slice(0, limit);
    }
    
    return {
        labels: chartData.map(item => item.label),
        values: chartData.map(item => item.value),
        data: chartData
    };
}

// Группировка по временному периоду
function groupByTimePeriod(array, dateField, valueField, period) {
    return array.map(item => {
        const date = new Date(item[dateField]);
        let periodKey;
        
        switch (period) {
            case 'day':
                periodKey = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + 1);
                periodKey = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
            case 'year':
                periodKey = date.getFullYear().toString();
                break;
            default:
                periodKey = item[dateField];
        }
        
        return {
            ...item,
            [dateField]: periodKey
        };
    });
}

// Дебаунс функции
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Троттлинг функции
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}