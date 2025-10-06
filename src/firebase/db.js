// Модуль для работы с базой данных Firestore
import { db } from './firebaseConfig.js';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class DatabaseManager {
  constructor() {
    this.listeners = new Map();
  }

  // Создать новый бюджет
  async createBudget(userId, userName) {
    try {
      const budgetData = {
        id: this.generateBudgetId(),
        createdBy: userId,
        members: [
          {
            id: userId,
            name: userName,
            role: 'owner',
            balance: 0,
            income: 0,
            expenses: 0
          }
        ],
        currency: 'PLN',
        theme: 'dark',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'budgets', budgetData.id), budgetData);
      return { success: true, budgetId: budgetData.id };
    } catch (error) {
      console.error('Ошибка создания бюджета:', error);
      return { success: false, error: error.message };
    }
  }

  // Присоединиться к существующему бюджету
  async joinBudget(budgetId, userId, userName) {
    try {
      const budgetRef = doc(db, 'budgets', budgetId);
      const budgetDoc = await getDoc(budgetRef);

      if (!budgetDoc.exists()) {
        return { success: false, error: 'Бюджет не найден' };
      }

      const budgetData = budgetDoc.data();
      const existingMember = budgetData.members.find(member => member.id === userId);

      if (existingMember) {
        return { success: false, error: 'Вы уже участник этого бюджета' };
      }

      const newMember = {
        id: userId,
        name: userName,
        role: 'member',
        balance: 0,
        income: 0,
        expenses: 0
      };

      await updateDoc(budgetRef, {
        members: [...budgetData.members, newMember],
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Ошибка присоединения к бюджету:', error);
      return { success: false, error: error.message };
    }
  }

  // Получить бюджет пользователя
  async getUserBudget(userId) {
    try {
      const budgetsQuery = query(
        collection(db, 'budgets'),
        where('members', 'array-contains-any', [{ id: userId }])
      );

      const snapshot = await getDocs(budgetsQuery);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const isMember = data.members.some(member => member.id === userId);
        if (isMember) {
          return { success: true, budget: { id: doc.id, ...data } };
        }
      }

      return { success: false, error: 'Бюджет не найден' };
    } catch (error) {
      console.error('Ошибка получения бюджета:', error);
      return { success: false, error: error.message };
    }
  }

  // Добавить операцию (доход/расход)
  async addTransaction(budgetId, userId, transaction) {
    try {
      const transactionData = {
        ...transaction,
        budgetId,
        userId,
        createdAt: serverTimestamp(),
        id: this.generateId()
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      // Обновить баланс пользователя
      await this.updateUserBalance(budgetId, userId, transaction.amount, transaction.type);

      return { success: true };
    } catch (error) {
      console.error('Ошибка добавления операции:', error);
      return { success: false, error: error.message };
    }
  }

  // Обновить баланс пользователя
  async updateUserBalance(budgetId, userId, amount, type) {
    try {
      const budgetRef = doc(db, 'budgets', budgetId);
      const budgetDoc = await getDoc(budgetRef);
      const budgetData = budgetDoc.data();

      const updatedMembers = budgetData.members.map(member => {
        if (member.id === userId) {
          if (type === 'income') {
            member.balance += amount;
            member.income += amount;
          } else if (type === 'expense') {
            member.balance -= amount;
            member.expenses += amount;
          }
        }
        return member;
      });

      await updateDoc(budgetRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Ошибка обновления баланса:', error);
    }
  }

  // Получить операции
  async getTransactions(budgetId, filters = {}) {
    try {
      let transactionsQuery = query(
        collection(db, 'transactions'),
        where('budgetId', '==', budgetId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, transactions };
    } catch (error) {
      console.error('Ошибка получения операций:', error);
      return { success: false, error: error.message };
    }
  }

  // Управление категориями
  async addCategory(budgetId, category) {
    try {
      const categoryData = {
        ...category,
        budgetId,
        id: this.generateId(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'categories'), categoryData);
      return { success: true };
    } catch (error) {
      console.error('Ошибка добавления категории:', error);
      return { success: false, error: error.message };
    }
  }

  async getCategories(budgetId) {
    try {
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('budgetId', '==', budgetId)
      );

      const snapshot = await getDocs(categoriesQuery);
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, categories };
    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      return { success: false, error: error.message };
    }
  }

  // Управление лимитами
  async setLimit(budgetId, categoryId, limit) {
    try {
      const limitData = {
        budgetId,
        categoryId,
        amount: limit,
        period: 'monthly',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'limits', `${budgetId}_${categoryId}`), limitData);
      return { success: true };
    } catch (error) {
      console.error('Ошибка установки лимита:', error);
      return { success: false, error: error.message };
    }
  }

  // Управление целями
  async addGoal(budgetId, goal) {
    try {
      const goalData = {
        ...goal,
        budgetId,
        id: this.generateId(),
        currentAmount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'goals'), goalData);
      return { success: true };
    } catch (error) {
      console.error('Ошибка добавления цели:', error);
      return { success: false, error: error.message };
    }
  }

  // Перевод на цель
  async transferToGoal(budgetId, userId, goalId, amount) {
    try {
      // Добавить операцию перевода
      await this.addTransaction(budgetId, userId, {
        type: 'expense',
        amount,
        category: 'Цели',
        description: `Перевод на цель`,
        date: new Date().toISOString()
      });

      // Обновить сумму цели
      const goalRef = doc(db, 'goals', goalId);
      const goalDoc = await getDoc(goalRef);
      const goalData = goalDoc.data();

      await updateDoc(goalRef, {
        currentAmount: goalData.currentAmount + amount,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Ошибка перевода на цель:', error);
      return { success: false, error: error.message };
    }
  }

  // Обновить настройки бюджета
  async updateBudgetSettings(budgetId, settings) {
    try {
      const budgetRef = doc(db, 'budgets', budgetId);
      await updateDoc(budgetRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      return { success: false, error: error.message };
    }
  }

  // Подписка на изменения в реальном времени
  subscribeToBudget(budgetId, callback) {
    const budgetRef = doc(db, 'budgets', budgetId);
    const unsubscribe = onSnapshot(budgetRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });

    this.listeners.set(`budget_${budgetId}`, unsubscribe);
    return unsubscribe;
  }

  subscribeToTransactions(budgetId, callback) {
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('budgetId', '==', budgetId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(transactions);
    });

    this.listeners.set(`transactions_${budgetId}`, unsubscribe);
    return unsubscribe;
  }

  // Отписаться от всех слушателей
  unsubscribeAll() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // Вспомогательные методы
  generateBudgetId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default new DatabaseManager();