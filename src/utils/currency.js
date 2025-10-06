// Утилиты для работы с валютами
class CurrencyManager {
    constructor() {
        this.exchangeRates = {
            PLN: 1,
            USD: 0.25,
            UAH: 10.5
        };
        
        this.symbols = {
            PLN: 'zł',
            USD: '$',
            UAH: '₴'
        };
        
        this.currentCurrency = 'PLN';
        this.lastUpdated = null;
        this.updateRates();
    }

    // Получить актуальные курсы валют
    async updateRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/PLN');
            if (response.ok) {
                const data = await response.json();
                this.exchangeRates = {
                    PLN: 1,
                    USD: data.rates.USD || 0.25,
                    UAH: data.rates.UAH || 10.5
                };
                this.lastUpdated = new Date();
            }
        } catch (error) {
            console.warn('Не удалось получить актуальные курсы валют, используются резервные значения:', error);
            // Используем резервные курсы
            this.exchangeRates = {
                PLN: 1,
                USD: 0.25,
                UAH: 10.5
            };
        }
    }

    // Конвертировать сумму из одной валюты в другую
    convert(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        // Конвертируем сначала в PLN (базовую валюту), затем в целевую
        const amountInPLN = amount / this.exchangeRates[fromCurrency];
        const convertedAmount = amountInPLN * this.exchangeRates[toCurrency];
        
        return Math.round(convertedAmount * 100) / 100;
    }

    // Форматировать сумму с символом валюты
    format(amount, currency = null) {
        const curr = currency || this.currentCurrency;
        const symbol = this.symbols[curr];
        
        // Округляем до 2 знаков после запятой
        const roundedAmount = Math.round(amount * 100) / 100;
        
        if (curr === 'USD') {
            return `${symbol}${roundedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (curr === 'UAH') {
            return `${roundedAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
        } else {
            return `${roundedAmount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
        }
    }

    // Получить символ валюты
    getSymbol(currency = null) {
        return this.symbols[currency || this.currentCurrency];
    }

    // Установить текущую валюту
    setCurrency(currency) {
        if (this.symbols[currency]) {
            this.currentCurrency = currency;
            this.save();
            return true;
        }
        return false;
    }

    // Получить текущую валюту
    getCurrency() {
        return this.currentCurrency;
    }

    // Получить список доступных валют
    getAvailableCurrencies() {
        return Object.keys(this.symbols).map(code => ({
            code,
            symbol: this.symbols[code],
            rate: this.exchangeRates[code]
        }));
    }

    // Конвертировать все суммы в бюджете при смене валюты
    convertBudgetAmounts(budget, newCurrency) {
        const oldCurrency = this.currentCurrency;
        
        if (oldCurrency === newCurrency) {
            return budget;
        }

        const convertedBudget = { ...budget };
        
        // Конвертируем балансы пользователей
        if (convertedBudget.members) {
            convertedBudget.members = convertedBudget.members.map(member => ({
                ...member,
                balance: this.convert(member.balance, oldCurrency, newCurrency),
                income: this.convert(member.income, oldCurrency, newCurrency),
                expenses: this.convert(member.expenses, oldCurrency, newCurrency)
            }));
        }

        return convertedBudget;
    }

    // Конвертировать транзакции
    convertTransactions(transactions, newCurrency) {
        const oldCurrency = this.currentCurrency;
        
        if (oldCurrency === newCurrency) {
            return transactions;
        }

        return transactions.map(transaction => ({
            ...transaction,
            amount: this.convert(transaction.amount, oldCurrency, newCurrency)
        }));
    }

    // Конвертировать цели
    convertGoals(goals, newCurrency) {
        const oldCurrency = this.currentCurrency;
        
        if (oldCurrency === newCurrency) {
            return goals;
        }

        return goals.map(goal => ({
            ...goal,
            targetAmount: this.convert(goal.targetAmount, oldCurrency, newCurrency),
            currentAmount: this.convert(goal.currentAmount, oldCurrency, newCurrency)
        }));
    }

    // Сохранить настройки валюты в localStorage
    save() {
        localStorage.setItem('budget_currency', this.currentCurrency);
    }

    // Загрузить настройки валюты из localStorage
    load() {
        const saved = localStorage.getItem('budget_currency');
        if (saved && this.symbols[saved]) {
            this.currentCurrency = saved;
        }
    }

    // Получить информацию о последнем обновлении курсов
    getLastUpdateInfo() {
        if (this.lastUpdated) {
            return {
                date: this.lastUpdated,
                formatted: this.lastUpdated.toLocaleString('ru-RU')
            };
        }
        return null;
    }

    // Проверить, нужно ли обновить курсы (раз в час)
    shouldUpdateRates() {
        if (!this.lastUpdated) {
            return true;
        }
        
        const hoursSinceUpdate = (Date.now() - this.lastUpdated.getTime()) / (1000 * 60 * 60);
        return hoursSinceUpdate >= 1;
    }

    // Автоматически обновлять курсы при необходимости
    autoUpdateRates() {
        if (this.shouldUpdateRates()) {
            this.updateRates();
        }
    }

    // Парсить сумму из строки
    parseAmount(amountString) {
        if (typeof amountString !== 'string') {
            return parseFloat(amountString) || 0;
        }
        
        // Убираем все символы валют и пробелы
        const cleaned = amountString.replace(/[^\d.,\-]/g, '');
        
        // Заменяем запятую на точку для корректного парсинга
        const normalized = cleaned.replace(',', '.');
        
        return parseFloat(normalized) || 0;
    }

    // Проверить валидность суммы
    isValidAmount(amount) {
        const num = typeof amount === 'string' ? this.parseAmount(amount) : amount;
        return !isNaN(num) && isFinite(num) && num >= 0;
    }

    // Получить максимально допустимую сумму (для предотвращения переполнения)
    getMaxAmount() {
        return 999999999.99;
    }

    // Проверить, не превышает ли сумма максимально допустимое значение
    isAmountWithinLimit(amount) {
        const num = typeof amount === 'string' ? this.parseAmount(amount) : amount;
        return num <= this.getMaxAmount();
    }
}

export default new CurrencyManager();