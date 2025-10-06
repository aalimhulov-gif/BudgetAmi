// База данных Firebase - Firestore operations
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot,
    serverTimestamp,
    increment,
    writeBatch 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db } from './firebaseConfig.js';
import { getCurrentUser } from './auth.js';

// Коллекции
const COLLECTIONS = {
    BUDGETS: 'budgets',
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',
    GOALS: 'goals',
    LIMITS: 'limits',
    USERS: 'users'
};

// Получить текущего пользователя
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('Пользователь не авторизован');
    }
    return user;
}

// ОПЕРАЦИИ С БЮДЖЕТАМИ
export async function createBudget(budgetData) {
    const user = requireAuth();
    
    const budget = {
        ...budgetData,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalBalance: 0
    };
    
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.BUDGETS), budget);
        console.log('Бюджет создан с ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Ошибка создания бюджета:', error);
        throw error;
    }
}

export async function getBudget(budgetId) {
    try {
        const docRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Бюджет не найден');
        }
    } catch (error) {
        console.error('Ошибка получения бюджета:', error);
        throw error;
    }
}

export async function updateBudget(budgetId, updates) {
    const user = requireAuth();
    
    try {
        const docRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('Бюджет обновлен');
    } catch (error) {
        console.error('Ошибка обновления бюджета:', error);
        throw error;
    }
}

export async function joinBudget(budgetId) {
    const user = requireAuth();
    
    try {
        const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
        const budgetSnap = await getDoc(budgetRef);
        
        if (!budgetSnap.exists()) {
            throw new Error('Бюджет не найден');
        }
        
        const budget = budgetSnap.data();
        
        if (budget.members.includes(user.uid)) {
            throw new Error('Вы уже являетесь участником этого бюджета');
        }
        
        await updateDoc(budgetRef, {
            members: [...budget.members, user.uid],
            updatedAt: serverTimestamp()
        });
        
        console.log('Успешно присоединились к бюджету');
        return true;
    } catch (error) {
        console.error('Ошибка присоединения к бюджету:', error);
        throw error;
    }
}

export async function getUserBudgets() {
    const user = requireAuth();
    
    try {
        const q = query(
            collection(db, COLLECTIONS.BUDGETS),
            where('members', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const budgets = [];
        
        querySnapshot.forEach((doc) => {
            budgets.push({ id: doc.id, ...doc.data() });
        });
        
        return budgets;
    } catch (error) {
        console.error('Ошибка получения бюджетов пользователя:', error);
        throw error;
    }
}

// ОПЕРАЦИИ С ТРАНЗАКЦИЯМИ
export async function addTransaction(budgetId, transactionData) {
    const user = requireAuth();
    
    const transaction = {
        ...transactionData,
        budgetId,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    try {
        // Используем batch для атомарной операции
        const batch = writeBatch(db);
        
        // Добавляем транзакцию
        const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
        batch.set(transactionRef, transaction);
        
        // Обновляем баланс бюджета
        const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
        const balanceChange = transactionData.type === 'income' ? 
            transactionData.amount : -transactionData.amount;
        
        batch.update(budgetRef, {
            totalBalance: increment(balanceChange),
            updatedAt: serverTimestamp()
        });
        
        await batch.commit();
        console.log('Транзакция добавлена');
        return transactionRef.id;
    } catch (error) {
        console.error('Ошибка добавления транзакции:', error);
        throw error;
    }
}

export async function getTransactions(budgetId, options = {}) {
    try {
        let q = query(
            collection(db, COLLECTIONS.TRANSACTIONS),
            where('budgetId', '==', budgetId)
        );
        
        // Добавляем фильтры
        if (options.category) {
            q = query(q, where('categoryId', '==', options.category));
        }
        
        if (options.userId) {
            q = query(q, where('userId', '==', options.userId));
        }
        
        if (options.type) {
            q = query(q, where('type', '==', options.type));
        }
        
        // Сортировка
        q = query(q, orderBy('createdAt', 'desc'));
        
        // Лимит
        if (options.limit) {
            q = query(q, limit(options.limit));
        }
        
        const querySnapshot = await getDocs(q);
        const transactions = [];
        
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        
        return transactions;
    } catch (error) {
        console.error('Ошибка получения транзакций:', error);
        throw error;
    }
}

export async function updateTransaction(transactionId, updates) {
    const user = requireAuth();
    
    try {
        const docRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('Транзакция обновлена');
    } catch (error) {
        console.error('Ошибка обновления транзакции:', error);
        throw error;
    }
}

export async function deleteTransaction(transactionId, budgetId) {
    const user = requireAuth();
    
    try {
        // Получаем данные транзакции для обновления баланса
        const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
        const transactionSnap = await getDoc(transactionRef);
        
        if (!transactionSnap.exists()) {
            throw new Error('Транзакция не найдена');
        }
        
        const transaction = transactionSnap.data();
        
        // Используем batch для атомарной операции
        const batch = writeBatch(db);
        
        // Удаляем транзакцию
        batch.delete(transactionRef);
        
        // Корректируем баланс бюджета
        const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
        const balanceChange = transaction.type === 'income' ? 
            -transaction.amount : transaction.amount;
        
        batch.update(budgetRef, {
            totalBalance: increment(balanceChange),
            updatedAt: serverTimestamp()
        });
        
        await batch.commit();
        console.log('Транзакция удалена');
    } catch (error) {
        console.error('Ошибка удаления транзакции:', error);
        throw error;
    }
}

// ОПЕРАЦИИ С КАТЕГОРИЯМИ
export async function addCategory(budgetId, categoryData) {
    const user = requireAuth();
    
    const category = {
        ...categoryData,
        budgetId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), category);
        console.log('Категория создана с ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Ошибка создания категории:', error);
        throw error;
    }
}

export async function getCategories(budgetId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.CATEGORIES),
            where('budgetId', '==', budgetId),
            orderBy('name')
        );
        
        const querySnapshot = await getDocs(q);
        const categories = [];
        
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        return categories;
    } catch (error) {
        console.error('Ошибка получения категорий:', error);
        throw error;
    }
}

export async function updateCategory(categoryId, updates) {
    try {
        const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('Категория обновлена');
    } catch (error) {
        console.error('Ошибка обновления категории:', error);
        throw error;
    }
}

export async function deleteCategory(categoryId) {
    try {
        const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
        await deleteDoc(docRef);
        console.log('Категория удалена');
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        throw error;
    }
}

// ОПЕРАЦИИ С ЦЕЛЯМИ
export async function addGoal(budgetId, goalData) {
    const user = requireAuth();
    
    const goal = {
        ...goalData,
        budgetId,
        createdBy: user.uid,
        currentAmount: 0,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.GOALS), goal);
        console.log('Цель создана с ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Ошибка создания цели:', error);
        throw error;
    }
}

export async function getGoals(budgetId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.GOALS),
            where('budgetId', '==', budgetId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const goals = [];
        
        querySnapshot.forEach((doc) => {
            goals.push({ id: doc.id, ...doc.data() });
        });
        
        return goals;
    } catch (error) {
        console.error('Ошибка получения целей:', error);
        throw error;
    }
}

export async function updateGoal(goalId, updates) {
    try {
        const docRef = doc(db, COLLECTIONS.GOALS, goalId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('Цель обновлена');
    } catch (error) {
        console.error('Ошибка обновления цели:', error);
        throw error;
    }
}

// REAL-TIME ПОДПИСКИ
export function subscribeToBudget(budgetId, callback) {
    const docRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
    
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    }, (error) => {
        console.error('Ошибка подписки на бюджет:', error);
    });
}

export function subscribeToTransactions(budgetId, callback) {
    const q = query(
        collection(db, COLLECTIONS.TRANSACTIONS),
        where('budgetId', '==', budgetId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    
    return onSnapshot(q, (querySnapshot) => {
        const transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        callback(transactions);
    }, (error) => {
        console.error('Ошибка подписки на транзакции:', error);
    });
}

export function subscribeToCategories(budgetId, callback) {
    const q = query(
        collection(db, COLLECTIONS.CATEGORIES),
        where('budgetId', '==', budgetId),
        orderBy('name')
    );
    
    return onSnapshot(q, (querySnapshot) => {
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        callback(categories);
    }, (error) => {
        console.error('Ошибка подписки на категории:', error);
    });
}

// СТАТИСТИКА И АНАЛИТИКА
export async function getBudgetStats(budgetId, period = 'month') {
    try {
        const transactions = await getTransactions(budgetId);
        
        // Фильтруем по периоду
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        const periodTransactions = transactions.filter(t => {
            const transactionDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            return transactionDate >= startDate;
        });
        
        const income = periodTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = periodTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            income,
            expense,
            balance: income - expense,
            transactionCount: periodTransactions.length
        };
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        throw error;
    }
}

// ПАКЕТНЫЕ ОПЕРАЦИИ
export async function addMultipleTransactions(budgetId, transactions) {
    const user = requireAuth();
    
    try {
        const batch = writeBatch(db);
        let totalBalanceChange = 0;
        
        transactions.forEach((transactionData) => {
            const transaction = {
                ...transactionData,
                budgetId,
                userId: user.uid,
                userName: user.displayName || user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
            batch.set(transactionRef, transaction);
            
            const balanceChange = transactionData.type === 'income' ? 
                transactionData.amount : -transactionData.amount;
            totalBalanceChange += balanceChange;
        });
        
        // Обновляем общий баланс
        const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
        batch.update(budgetRef, {
            totalBalance: increment(totalBalanceChange),
            updatedAt: serverTimestamp()
        });
        
        await batch.commit();
        console.log('Пакет транзакций добавлен');
    } catch (error) {
        console.error('Ошибка добавления пакета транзакций:', error);
        throw error;
    }
}