# 💰 Семейный бюджет

Полнофункциональное веб-приложение для ведения семейного бюджета с возможностью совместного использования, управления доходами и расходами, установки лимитов и достижения финансовых целей.

## 🌟 Основные возможности

### 📊 Управление финансами

- **Учет доходов и расходов** - добавление и категоризация всех финансовых операций
- **Многопользовательский режим** - совместное ведение бюджета всеми членами семьи
- **Реальное время** - мгновенное обновление данных для всех участников
- **Многовалютность** - поддержка различных валют с автоматическим пересчетом

### 🎯 Планирование бюджета

- **Лимиты расходов** - установка месячных ограничений по категориям
- **Финансовые цели** - планирование и отслеживание накоплений
- **Прогресс-трекинг** - визуализация достижения целей и соблюдения лимитов
- **Уведомления** - предупреждения о превышении лимитов

### 📈 Аналитика и отчеты

- **История операций** - полная история всех финансовых операций
- **Фильтрация и поиск** - быстрый поиск нужных транзакций
- **Экспорт данных** - выгрузка данных в CSV и JSON форматах
- **Статистика** - анализ расходов по категориям и периодам

### 🎨 Удобный интерфейс

- **Адаптивный дизайн** - работает на всех устройствах
- **Темная и светлая темы** - настройка внешнего вида
- **Интуитивная навигация** - простое и понятное управление
- **Быстрое добавление** - мгновенное внесение операций

## 🚀 Быстрый старт

### 1. Подготовка проекта

Скачайте и распакуйте проект:

```bash
# Клонирование репозитория
git clone <ваш-репозиторий>
cd семейный-бюджет

# Или просто скачайте архив и распакуйте
```

### 2. Настройка Firebase

1. **Создайте проект Firebase:**

   - Перейдите на https://console.firebase.google.com
   - Нажмите "Создать проект"
   - Введите название проекта (например, "Семейный бюджет")
   - Следуйте инструкциям мастера

2. **Настройте Authentication:**

   - В консоли Firebase перейдите в "Authentication"
   - Во вкладке "Sign-in method" включите:
     - Email/Password
     - Google (опционально)
   - Настройте домены авторизации

3. **Создайте базу данных Firestore:**

   - Перейдите в "Firestore Database"
   - Нажмите "Создать базу данных"
   - Выберите режим тестирования
   - Выберите регион (желательно ближайший)

4. **Получите конфигурацию проекта:**

   - Перейдите в настройки проекта (иконка шестеренки)
   - В разделе "Ваши приложения" нажмите "Веб"
   - Зарегистрируйте приложение
   - Скопируйте конфигурацию Firebase

5. **Обновите файл конфигурации:**
   Откройте `src/firebase/firebaseConfig.js` и замените значения:
   ```javascript
   const firebaseConfig = {
     apiKey: "ваш-api-key",
     authDomain: "ваш-проект.firebaseapp.com",
     projectId: "ваш-проект-id",
     storageBucket: "ваш-проект.appspot.com",
     messagingSenderId: "123456789",
     appId: "ваш-app-id",
   };
   ```

### 3. Настройка правил безопасности Firestore

В консоли Firebase перейдите в "Firestore Database" → "Правила" и установите:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Правила для пользователей
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Правила для бюджетов
    match /budgets/{budgetId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.members;
    }

    // Правила для транзакций
    match /budgets/{budgetId}/transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/budgets/$(budgetId)) &&
        request.auth.uid in get(/databases/$(database)/documents/budgets/$(budgetId)).data.members;
    }

    // Правила для категорий
    match /budgets/{budgetId}/categories/{categoryId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/budgets/$(budgetId)) &&
        request.auth.uid in get(/databases/$(database)/documents/budgets/$(budgetId)).data.members;
    }

    // Правила для лимитов
    match /budgets/{budgetId}/limits/{limitId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/budgets/$(budgetId)) &&
        request.auth.uid in get(/databases/$(database)/documents/budgets/$(budgetId)).data.members;
    }

    // Правила для целей
    match /budgets/{budgetId}/goals/{goalId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/budgets/$(budgetId)) &&
        request.auth.uid in get(/databases/$(database)/documents/budgets/$(budgetId)).data.members;
    }
  }
}
```

### 4. Локальный запуск

Для разработки можно использовать любой локальный сервер:

```bash
# Используя Python (если установлен)
python -m http.server 8000

# Используя Node.js (если установлен live-server)
npx live-server

# Используя PHP (если установлен)
php -S localhost:8000
```

Откройте браузер и перейдите по адресу `http://localhost:8000`

### 5. Деплой на GitHub Pages

1. **Создайте репозиторий на GitHub:**

   - Зайдите на GitHub и создайте новый репозиторий
   - Назовите его, например, "family-budget"

2. **Загрузите код:**

   ```bash
   git init
   git add .
   git commit -m "Первоначальная версия семейного бюджета"
   git branch -M main
   git remote add origin https://github.com/ваш-username/family-budget.git
   git push -u origin main
   ```

3. **Настройте GitHub Pages:**

   - Перейдите в настройки репозитория
   - В разделе "Pages" выберите источник "Deploy from a branch"
   - Выберите ветку "main" и папку "/ (root)"
   - Сохраните настройки

4. **Настройте домены для Firebase:**
   - В консоли Firebase перейдите в "Authentication"
   - Во вкладке "Settings" добавьте ваш GitHub Pages домен в "Authorized domains"
   - Формат: `ваш-username.github.io`

Ваше приложение будет доступно по адресу: `https://ваш-username.github.io/family-budget`

## 📁 Структура проекта

```
семейный-бюджет/
├── index.html              # Главная страница
├── README.md               # Документация
├── src/                    # Исходный код
│   ├── app.js             # Главный файл приложения
│   ├── firebase/          # Конфигурация Firebase
│   │   ├── firebaseConfig.js
│   │   ├── auth.js        # Аутентификация
│   │   └── db.js          # База данных
│   ├── pages/             # Страницы приложения
│   │   ├── home.js        # Главная страница
│   │   ├── categories.js  # Управление категориями
│   │   ├── limits.js      # Лимиты расходов
│   │   ├── goals.js       # Финансовые цели
│   │   ├── transactions.js # История операций
│   │   └── settings.js    # Настройки
│   ├── components/        # Компоненты UI
│   │   ├── modal.js       # Модальные окна
│   │   ├── userCard.js    # Карточки пользователей
│   │   └── progressBar.js # Индикаторы прогресса
│   ├── utils/             # Утилиты
│   │   ├── currency.js    # Работа с валютами
│   │   ├── formatters.js  # Форматирование данных
│   │   └── notifications.js # Уведомления
│   └── styles/            # Стили CSS
│       ├── main.css       # Основные стили
│       ├── themes.css     # Темы оформления
│       ├── components.css # Стили компонентов
│       ├── modals.css     # Стили модальных окон
│       └── responsive.css # Адаптивные стили
```

## 🔧 Конфигурация

### Валюты

По умолчанию поддерживаются следующие валюты:

- RUB (Российский рубль) - по умолчанию
- USD (Доллар США)
- EUR (Евро)

Для добавления других валют отредактируйте `src/utils/currency.js`

### Темы

Доступны темы:

- Светлая тема
- Темная тема
- Системная (автоматически по настройкам ОС)

### API курсов валют

Приложение использует API exchangerate-api.com для получения курсов валют.
Для production рекомендуется получить API ключ на https://exchangerate-api.com

## 🛠️ Разработка

### Добавление новых функций

1. **Новая страница:**

   - Создайте файл в папке `src/pages/`
   - Добавьте соответствующий HTML в `index.html`
   - Зарегистрируйте страницу в `src/app.js`

2. **Новый компонент:**

   - Создайте файл в папке `src/components/`
   - Импортируйте где необходимо

3. **Новая утилита:**
   - Создайте файл в папке `src/utils/`
   - Экспортируйте нужные функции

### Стили

Проект использует CSS переменные для тем:

```css
:root {
  --primary-color: #1976d2;
  --background-color: #ffffff;
  --text-color: #333333;
  /* и т.д. */
}
```

### База данных

Структура Firestore:

```
users/
  {userId}/
    name: string
    email: string
    settings: object

budgets/
  {budgetId}/
    name: string
    members: array
    currency: string

    transactions/
      {transactionId}/
        amount: number
        type: 'income' | 'expense'
        category: string
        date: timestamp

    categories/
      {categoryId}/
        name: string
        type: 'income' | 'expense'
        icon: string
        color: string

    limits/
      {limitId}/
        category: string
        amount: number
        period: 'month'

    goals/
      {goalId}/
        name: string
        targetAmount: number
        currentAmount: number
        deadline: timestamp
```

## 🚨 Устранение неполадок

### Ошибки Firebase

1. **"Firebase: Error (auth/configuration-not-found)"**

   - Проверьте правильность конфигурации в `firebaseConfig.js`
   - Убедитесь, что проект Firebase создан и настроен

2. **"Missing or insufficient permissions"**

   - Проверьте правила безопасности Firestore
   - Убедитесь, что пользователь авторизован

3. **CORS ошибки**
   - Убедитесь, что домен добавлен в Authorized domains в Firebase
   - Используйте HTTPS для production

### Проблемы с отображением

1. **Страница не загружается**

   - Проверьте консоль браузера на наличие ошибок JavaScript
   - Убедитесь, что все файлы загружены корректно

2. **Стили не применяются**
   - Очистите кэш браузера
   - Проверьте пути к CSS файлам

### Производительность

1. **Медленная загрузка**
   - Проверьте размер базы данных
   - Оптимизируйте запросы к Firestore

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. Вы можете свободно использовать, изменять и распространять код.

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте раздел "Устранение неполадок"
2. Посмотрите Issues на GitHub
3. Создайте новый Issue с описанием проблемы

## 🎯 Дальнейшее развитие

Планируемые функции:

- [ ] Мобильное приложение
- [ ] Уведомления в браузере
- [ ] Анализ трендов расходов
- [ ] Интеграция с банковскими API
- [ ] Планирование крупных покупок
- [ ] Семейные финансовые отчеты

## 💡 Советы по использованию

1. **Регулярно вносите операции** - чем чаще вы добавляете транзакции, тем точнее будет анализ
2. **Настройте категории** - создайте категории, соответствующие вашему образу жизни
3. **Установите реалистичные лимиты** - лимиты должны быть достижимыми
4. **Используйте цели** - финансовые цели помогают мотивировать к экономии
5. **Привлекайте всю семью** - добавьте всех членов семьи для полной картины бюджета

---

**Семейный бюджет** - это ваш надежный помощник в управлении финансами! 💰✨
