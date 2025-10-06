// Утилиты для работы с валютами
let currentCurrency = localStorage.getItem('currency') || 'PLN';
let exchangeRates = {};
let lastUpdateTime = 0;

// Поддерживаемые валюты
export const CURRENCIES = {
    PLN: { symbol: 'zł', name: 'Польский злотый' },
    USD: { symbol: '$', name: 'Доллар США' },
    UAH: { symbol: '₴', name: 'Украинская гривна' }
};

// Получить текущую валюту
export function getCurrentCurrency() {
    return currentCurrency;
}

// Установить валюту
export function setCurrency(currency) {
    if (CURRENCIES[currency]) {
        currentCurrency = currency;
        localStorage.setItem('currency', currency);
        
        // Обновляем отображение валюты в UI
        const currencyDisplay = document.getElementById('current-currency');
        if (currencyDisplay) {
            currencyDisplay.textContent = currency;
        }
        
        // Триггерим событие смены валюты
        document.dispatchEvent(new CustomEvent('currencyChanged', { 
            detail: { currency, rates: exchangeRates } 
        }));
    }
}

// Форматировать сумму в текущей валюте
export function formatCurrency(amount, currency = currentCurrency) {
    const converted = convertAmount(amount, 'PLN', currency);
    const currencyInfo = CURRENCIES[currency];
    
    if (!currencyInfo) {
        return `${amount.toFixed(2)} PLN`;
    }
    
    // Форматируем число с разделителями тысяч
    const formattedAmount = new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(converted);
    
    return `${formattedAmount} ${currencyInfo.symbol}`;
}

// Конвертировать сумму между валютами
export function convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    // Если нет курсов, возвращаем исходную сумму
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
        return amount;
    }
    
    // Конвертируем через PLN как базовую валюту
    let amountInPLN = amount;
    
    if (fromCurrency !== 'PLN') {
        const fromRate = exchangeRates[fromCurrency];
        if (fromRate) {
            amountInPLN = amount / fromRate;
        }
    }
    
    if (toCurrency === 'PLN') {
        return amountInPLN;
    }
    
    const toRate = exchangeRates[toCurrency];
    if (toRate) {
        return amountInPLN * toRate;
    }
    
    return amount;
}

// Получить курсы валют с API
export async function updateExchangeRates() {
    const now = Date.now();
    
    // Обновляем курсы не чаще чем раз в час
    if (now - lastUpdateTime < 3600000) {
        return exchangeRates;
    }
    
    try {
        // Используем exchangerate.host API
        const response = await fetch('https://api.exchangerate.host/latest?base=PLN&symbols=USD,UAH');
        
        if (!response.ok) {
            throw new Error('Не удалось получить курсы валют');
        }
        
        const data = await response.json();
        
        if (data.success) {
            exchangeRates = {
                PLN: 1, // Базовая валюта
                USD: data.rates.USD || 0.25,
                UAH: data.rates.UAH || 10.5
            };
            
            lastUpdateTime = now;
            localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
            localStorage.setItem('lastUpdateTime', lastUpdateTime.toString());
            
            console.log('Курсы валют обновлены:', exchangeRates);
        }
    } catch (error) {
        console.warn('Ошибка получения курсов валют:', error);
        
        // Используем сохраненные курсы или курсы по умолчанию
        loadSavedRates();
    }
    
    return exchangeRates;
}

// Загрузить сохраненные курсы
function loadSavedRates() {
    try {
        const savedRates = localStorage.getItem('exchangeRates');
        const savedTime = localStorage.getItem('lastUpdateTime');
        
        if (savedRates && savedTime) {
            exchangeRates = JSON.parse(savedRates);
            lastUpdateTime = parseInt(savedTime);
        } else {
            // Курсы по умолчанию
            exchangeRates = {
                PLN: 1,
                USD: 0.25,
                UAH: 10.5
            };
        }
    } catch (error) {
        console.error('Ошибка загрузки сохраненных курсов:', error);
        exchangeRates = {
            PLN: 1,
            USD: 0.25,
            UAH: 10.5
        };
    }
}

// Получить информацию о валюте
export function getCurrencyInfo(currency) {
    return CURRENCIES[currency] || CURRENCIES.PLN;
}

// Инициализация
export function initCurrency() {
    loadSavedRates();
    setCurrency(currentCurrency);
    
    // Обновляем курсы при инициализации
    updateExchangeRates();
    
    // Устанавливаем интервал обновления курсов (каждые 30 минут)
    setInterval(updateExchangeRates, 30 * 60 * 1000);
}

// Парсинг суммы из строки
export function parseAmount(amountString) {
    if (typeof amountString === 'number') {
        return amountString;
    }
    
    // Удаляем все кроме цифр, точки и запятой
    const cleaned = amountString.toString().replace(/[^\d.,]/g, '');
    
    // Заменяем запятую на точку
    const normalized = cleaned.replace(',', '.');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
}

// Валидация суммы
export function isValidAmount(amount) {
    const parsed = parseAmount(amount);
    return parsed > 0 && parsed < 1000000000; // Разумные лимиты
}

// Обработчик событий для автоматического обновления UI при смене валюты
document.addEventListener('currencyChanged', (event) => {
    // Обновляем все элементы с классом 'currency-amount'
    const elements = document.querySelectorAll('[data-amount]');
    elements.forEach(element => {
        const amount = parseFloat(element.dataset.amount);
        if (!isNaN(amount)) {
            element.textContent = formatCurrency(amount);
        }
    });
});

// Инициализируем при загрузке модуля
initCurrency();