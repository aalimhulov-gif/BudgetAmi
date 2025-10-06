// Утилиты для работы с localStorage
const STORAGE_PREFIX = 'budget_app_';

// Безопасное сохранение в localStorage
export function saveToStorage(key, data) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const serializedData = JSON.stringify(data);
        localStorage.setItem(prefixedKey, serializedData);
        return true;
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
        return false;
    }
}

// Безопасное чтение из localStorage
export function loadFromStorage(key, defaultValue = null) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const data = localStorage.getItem(prefixedKey);
        
        if (data === null) {
            return defaultValue;
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return defaultValue;
    }
}

// Удаление из localStorage
export function removeFromStorage(key) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        localStorage.removeItem(prefixedKey);
        return true;
    } catch (error) {
        console.error('Ошибка удаления из localStorage:', error);
        return false;
    }
}

// Проверка существования ключа
export function hasInStorage(key) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        return localStorage.getItem(prefixedKey) !== null;
    } catch (error) {
        console.error('Ошибка проверки localStorage:', error);
        return false;
    }
}

// Очистка всех данных приложения
export function clearAppStorage() {
    try {
        const keys = Object.keys(localStorage);
        const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
        
        appKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return true;
    } catch (error) {
        console.error('Ошибка очистки localStorage:', error);
        return false;
    }
}

// Получение размера используемого хранилища
export function getStorageSize() {
    try {
        let totalSize = 0;
        const keys = Object.keys(localStorage);
        const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
        
        appKeys.forEach(key => {
            const value = localStorage.getItem(key);
            totalSize += key.length + (value ? value.length : 0);
        });
        
        return {
            bytes: totalSize,
            kb: (totalSize / 1024).toFixed(2),
            mb: (totalSize / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        console.error('Ошибка подсчета размера localStorage:', error);
        return { bytes: 0, kb: '0', mb: '0' };
    }
}

// Получение всех ключей приложения
export function getAppStorageKeys() {
    try {
        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(STORAGE_PREFIX))
            .map(key => key.replace(STORAGE_PREFIX, ''));
    } catch (error) {
        console.error('Ошибка получения ключей localStorage:', error);
        return [];
    }
}

// Экспорт данных приложения
export function exportAppData() {
    try {
        const data = {};
        const keys = getAppStorageKeys();
        
        keys.forEach(key => {
            data[key] = loadFromStorage(key);
        });
        
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data
        };
    } catch (error) {
        console.error('Ошибка экспорта данных:', error);
        return null;
    }
}

// Импорт данных приложения
export function importAppData(exportedData) {
    try {
        if (!exportedData || !exportedData.data) {
            throw new Error('Некорректный формат данных');
        }
        
        // Создаем резервную копию текущих данных
        const backup = exportAppData();
        
        // Очищаем текущие данные
        clearAppStorage();
        
        // Импортируем новые данные
        Object.entries(exportedData.data).forEach(([key, value]) => {
            saveToStorage(key, value);
        });
        
        return {
            success: true,
            backup
        };
    } catch (error) {
        console.error('Ошибка импорта данных:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Сохранение настроек пользователя
export function saveUserSettings(settings) {
    return saveToStorage('user_settings', settings);
}

// Загрузка настроек пользователя
export function loadUserSettings() {
    return loadFromStorage('user_settings', {
        theme: 'light',
        currency: 'PLN',
        language: 'ru',
        notifications: true,
        autoSync: true
    });
}

// Сохранение данных формы
export function saveFormData(formId, data) {
    return saveToStorage(`form_${formId}`, {
        data,
        timestamp: Date.now()
    });
}

// Загрузка данных формы
export function loadFormData(formId) {
    const saved = loadFromStorage(`form_${formId}`, null);
    
    if (!saved) {
        return null;
    }
    
    // Проверяем, не устарели ли данные (старше 24 часов)
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа
    if (Date.now() - saved.timestamp > maxAge) {
        removeFromStorage(`form_${formId}`);
        return null;
    }
    
    return saved.data;
}

// Очистка данных формы
export function clearFormData(formId) {
    return removeFromStorage(`form_${formId}`);
}

// Сохранение истории операций
export function saveOperationHistory(operation) {
    const history = loadFromStorage('operation_history', []);
    
    // Добавляем новую операцию в начало
    history.unshift({
        ...operation,
        timestamp: Date.now(),
        id: Date.now().toString()
    });
    
    // Ограничиваем историю 100 операциями
    if (history.length > 100) {
        history.splice(100);
    }
    
    return saveToStorage('operation_history', history);
}

// Загрузка истории операций
export function loadOperationHistory() {
    return loadFromStorage('operation_history', []);
}

// Очистка истории операций
export function clearOperationHistory() {
    return removeFromStorage('operation_history');
}

// Сохранение кэша данных
export function saveToCache(key, data, ttl = 3600000) { // TTL по умолчанию 1 час
    const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
    };
    
    return saveToStorage(`cache_${key}`, cacheData);
}

// Загрузка из кэша
export function loadFromCache(key) {
    const cached = loadFromStorage(`cache_${key}`, null);
    
    if (!cached) {
        return null;
    }
    
    // Проверяем TTL
    if (Date.now() - cached.timestamp > cached.ttl) {
        removeFromStorage(`cache_${key}`);
        return null;
    }
    
    return cached.data;
}

// Очистка кэша
export function clearCache() {
    try {
        const keys = getAppStorageKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        
        cacheKeys.forEach(key => {
            removeFromStorage(key);
        });
        
        return true;
    } catch (error) {
        console.error('Ошибка очистки кэша:', error);
        return false;
    }
}

// Проверка доступности localStorage
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

// Отслеживание изменений в localStorage
export function watchStorage(key, callback) {
    const prefixedKey = STORAGE_PREFIX + key;
    
    function handleStorageChange(event) {
        if (event.key === prefixedKey) {
            const newValue = event.newValue ? JSON.parse(event.newValue) : null;
            const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
            callback(newValue, oldValue);
        }
    }
    
    window.addEventListener('storage', handleStorageChange);
    
    // Возвращаем функцию для отписки
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
}

// Синхронизация между вкладками
export function syncBetweenTabs(key, data) {
    // Сохраняем данные
    saveToStorage(key, data);
    
    // Создаем событие для синхронизации между вкладками
    window.dispatchEvent(new CustomEvent('storage', {
        detail: {
            key: STORAGE_PREFIX + key,
            newValue: JSON.stringify(data),
            oldValue: null
        }
    }));
}

// Автосохранение данных
export function createAutoSave(key, getData, interval = 30000) { // По умолчанию каждые 30 секунд
    let lastData = null;
    
    const saveInterval = setInterval(() => {
        try {
            const currentData = getData();
            
            // Сравниваем с предыдущими данными
            if (JSON.stringify(currentData) !== JSON.stringify(lastData)) {
                saveToStorage(key, currentData);
                lastData = currentData;
                console.log(`Автосохранение: ${key}`);
            }
        } catch (error) {
            console.error('Ошибка автосохранения:', error);
        }
    }, interval);
    
    // Возвращаем функцию для остановки автосохранения
    return () => {
        clearInterval(saveInterval);
    };
}

// Резервное копирование данных
export function createBackup() {
    try {
        const backup = exportAppData();
        const backupKey = `backup_${Date.now()}`;
        
        saveToStorage(backupKey, backup);
        
        // Сохраняем список резервных копий
        const backups = loadFromStorage('backups_list', []);
        backups.push({
            key: backupKey,
            date: new Date().toISOString(),
            size: getStorageSize().bytes
        });
        
        // Ограничиваем количество резервных копий
        if (backups.length > 5) {
            const oldBackup = backups.shift();
            removeFromStorage(oldBackup.key);
        }
        
        saveToStorage('backups_list', backups);
        
        return backupKey;
    } catch (error) {
        console.error('Ошибка создания резервной копии:', error);
        return null;
    }
}

// Восстановление из резервной копии
export function restoreFromBackup(backupKey) {
    try {
        const backup = loadFromStorage(backupKey);
        
        if (!backup) {
            throw new Error('Резервная копия не найдена');
        }
        
        const result = importAppData(backup);
        
        if (result.success) {
            console.log('Данные восстановлены из резервной копии');
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка восстановления из резервной копии:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Получение списка резервных копий
export function getBackupsList() {
    return loadFromStorage('backups_list', []);
}