// Утилиты для валидации данных

// Валидация email
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация пароля
export function isValidPassword(password) {
    // Минимум 6 символов, должен содержать буквы и цифры
    if (password.length < 6) {
        return {
            isValid: false,
            message: 'Пароль должен содержать минимум 6 символов'
        };
    }
    
    if (!/[a-zA-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать буквы'
        };
    }
    
    if (!/\d/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать цифры'
        };
    }
    
    return {
        isValid: true,
        message: 'Пароль корректен'
    };
}

// Валидация суммы
export function isValidAmount(amount) {
    const num = parseFloat(amount);
    
    if (isNaN(num)) {
        return {
            isValid: false,
            message: 'Сумма должна быть числом'
        };
    }
    
    if (num <= 0) {
        return {
            isValid: false,
            message: 'Сумма должна быть больше нуля'
        };
    }
    
    if (num > 1000000000) {
        return {
            isValid: false,
            message: 'Сумма слишком большая'
        };
    }
    
    return {
        isValid: true,
        message: 'Сумма корректна'
    };
}

// Валидация имени пользователя
export function isValidUsername(username) {
    if (!username || username.trim().length === 0) {
        return {
            isValid: false,
            message: 'Имя пользователя не может быть пустым'
        };
    }
    
    if (username.length < 2) {
        return {
            isValid: false,
            message: 'Имя пользователя должно содержать минимум 2 символа'
        };
    }
    
    if (username.length > 50) {
        return {
            isValid: false,
            message: 'Имя пользователя не может быть длиннее 50 символов'
        };
    }
    
    // Разрешены буквы, цифры, пробелы, дефисы
    if (!/^[a-zA-Zа-яА-Я0-9\s\-]+$/.test(username)) {
        return {
            isValid: false,
            message: 'Имя пользователя может содержать только буквы, цифры, пробелы и дефисы'
        };
    }
    
    return {
        isValid: true,
        message: 'Имя пользователя корректно'
    };
}

// Валидация названия категории
export function isValidCategoryName(name) {
    if (!name || name.trim().length === 0) {
        return {
            isValid: false,
            message: 'Название категории не может быть пустым'
        };
    }
    
    if (name.length > 100) {
        return {
            isValid: false,
            message: 'Название категории не может быть длиннее 100 символов'
        };
    }
    
    return {
        isValid: true,
        message: 'Название категории корректно'
    };
}

// Валидация описания транзакции
export function isValidDescription(description) {
    if (description && description.length > 500) {
        return {
            isValid: false,
            message: 'Описание не может быть длиннее 500 символов'
        };
    }
    
    return {
        isValid: true,
        message: 'Описание корректно'
    };
}

// Валидация Budget ID для совместного доступа
export function isValidBudgetId(budgetId) {
    if (!budgetId || budgetId.trim().length === 0) {
        return {
            isValid: false,
            message: 'ID бюджета не может быть пустым'
        };
    }
    
    // Budget ID должен быть строкой из 6-12 символов (буквы и цифры)
    if (!/^[a-zA-Z0-9]{6,12}$/.test(budgetId)) {
        return {
            isValid: false,
            message: 'ID бюджета должен содержать 6-12 символов (только буквы и цифры)'
        };
    }
    
    return {
        isValid: true,
        message: 'ID бюджета корректен'
    };
}

// Валидация URL
export function isValidUrl(url) {
    try {
        new URL(url);
        return {
            isValid: true,
            message: 'URL корректен'
        };
    } catch {
        return {
            isValid: false,
            message: 'Некорректный URL'
        };
    }
}

// Валидация номера телефона
export function isValidPhone(phone) {
    // Простая валидация для международных номеров
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return {
            isValid: false,
            message: 'Некорректный номер телефона'
        };
    }
    
    return {
        isValid: true,
        message: 'Номер телефона корректен'
    };
}

// Валидация даты
export function isValidDate(date) {
    if (!date) {
        return {
            isValid: false,
            message: 'Дата не указана'
        };
    }
    
    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
        return {
            isValid: false,
            message: 'Некорректная дата'
        };
    }
    
    // Проверяем, что дата не в будущем (для транзакций)
    const now = new Date();
    if (parsedDate > now) {
        return {
            isValid: false,
            message: 'Дата не может быть в будущем'
        };
    }
    
    // Проверяем, что дата не слишком старая (не старше 10 лет)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (parsedDate < tenYearsAgo) {
        return {
            isValid: false,
            message: 'Дата не может быть старше 10 лет'
        };
    }
    
    return {
        isValid: true,
        message: 'Дата корректна'
    };
}

// Валидация цели (для системы целей/планов)
export function isValidGoal(goal) {
    const errors = [];
    
    // Проверяем название
    if (!goal.name || goal.name.trim().length === 0) {
        errors.push('Название цели не может быть пустым');
    } else if (goal.name.length > 200) {
        errors.push('Название цели не может быть длиннее 200 символов');
    }
    
    // Проверяем сумму
    const amountValidation = isValidAmount(goal.targetAmount);
    if (!amountValidation.isValid) {
        errors.push(`Целевая сумма: ${amountValidation.message}`);
    }
    
    // Проверяем дату
    if (goal.targetDate) {
        const targetDate = new Date(goal.targetDate);
        const now = new Date();
        
        if (isNaN(targetDate.getTime())) {
            errors.push('Некорректная целевая дата');
        } else if (targetDate <= now) {
            errors.push('Целевая дата должна быть в будущем');
        }
    }
    
    // Проверяем описание
    if (goal.description && goal.description.length > 1000) {
        errors.push('Описание цели не может быть длиннее 1000 символов');
    }
    
    return {
        isValid: errors.length === 0,
        message: errors.length === 0 ? 'Цель корректна' : errors.join('; ')
    };
}

// Валидация лимита категории
export function isValidCategoryLimit(limit) {
    const errors = [];
    
    // Проверяем сумму лимита
    const amountValidation = isValidAmount(limit.amount);
    if (!amountValidation.isValid) {
        errors.push(`Сумма лимита: ${amountValidation.message}`);
    }
    
    // Проверяем тип периода
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(limit.period)) {
        errors.push('Некорректный период лимита');
    }
    
    return {
        isValid: errors.length === 0,
        message: errors.length === 0 ? 'Лимит корректен' : errors.join('; ')
    };
}

// Общая функция валидации формы
export function validateForm(formData, rules) {
    const errors = {};
    let isValid = true;
    
    for (const [field, value] of Object.entries(formData)) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;
        
        for (const rule of fieldRules) {
            let validation;
            
            switch (rule.type) {
                case 'required':
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        validation = {
                            isValid: false,
                            message: rule.message || `${field} обязательно для заполнения`
                        };
                    }
                    break;
                    
                case 'email':
                    if (value) {
                        validation = isValidEmail(value) ? 
                            { isValid: true } : 
                            { isValid: false, message: rule.message || 'Некорректный email' };
                    }
                    break;
                    
                case 'password':
                    if (value) {
                        validation = isValidPassword(value);
                        if (!validation.isValid && rule.message) {
                            validation.message = rule.message;
                        }
                    }
                    break;
                    
                case 'amount':
                    if (value) {
                        validation = isValidAmount(value);
                        if (!validation.isValid && rule.message) {
                            validation.message = rule.message;
                        }
                    }
                    break;
                    
                case 'minLength':
                    if (value && value.length < rule.value) {
                        validation = {
                            isValid: false,
                            message: rule.message || `Минимум ${rule.value} символов`
                        };
                    }
                    break;
                    
                case 'maxLength':
                    if (value && value.length > rule.value) {
                        validation = {
                            isValid: false,
                            message: rule.message || `Максимум ${rule.value} символов`
                        };
                    }
                    break;
                    
                case 'custom':
                    if (rule.validator) {
                        validation = rule.validator(value);
                    }
                    break;
            }
            
            if (validation && !validation.isValid) {
                errors[field] = validation.message;
                isValid = false;
                break; // Прерываем проверку для этого поля при первой ошибке
            }
        }
    }
    
    return {
        isValid,
        errors
    };
}

// Предустановленные правила валидации
export const VALIDATION_RULES = {
    loginForm: {
        email: [
            { type: 'required' },
            { type: 'email' }
        ],
        password: [
            { type: 'required' },
            { type: 'minLength', value: 6 }
        ]
    },
    
    registerForm: {
        username: [
            { type: 'required' },
            { type: 'minLength', value: 2 },
            { type: 'maxLength', value: 50 }
        ],
        email: [
            { type: 'required' },
            { type: 'email' }
        ],
        password: [
            { type: 'required' },
            { type: 'password' }
        ]
    },
    
    transactionForm: {
        amount: [
            { type: 'required' },
            { type: 'amount' }
        ],
        description: [
            { type: 'maxLength', value: 500 }
        ]
    },
    
    categoryForm: {
        name: [
            { type: 'required' },
            { type: 'maxLength', value: 100 }
        ]
    },
    
    goalForm: {
        name: [
            { type: 'required' },
            { type: 'maxLength', value: 200 }
        ],
        targetAmount: [
            { type: 'required' },
            { type: 'amount' }
        ],
        description: [
            { type: 'maxLength', value: 1000 }
        ]
    }
};

// Утилита для очистки и санитизации данных
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Базовая защита от XSS
        .substring(0, 10000); // Ограничиваем длину
}

// Утилита для очистки объекта от лишних полей
export function sanitizeObject(obj, allowedFields) {
    const cleaned = {};
    
    for (const field of allowedFields) {
        if (obj.hasOwnProperty(field)) {
            cleaned[field] = sanitizeInput(obj[field]);
        }
    }
    
    return cleaned;
}