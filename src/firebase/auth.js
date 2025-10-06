// Модуль для работы с аутентификацией Firebase
import { auth } from './firebaseConfig.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.init();
  }

  init() {
    // Слушаем изменения состояния аутентификации
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(callback => callback(user));
    });
  }

  // Регистрация нового пользователя
  async register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return { success: false, error: error.message };
    }
  }

  // Вход пользователя
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Ошибка входа:', error);
      return { success: false, error: error.message };
    }
  }

  // Выход пользователя
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Ошибка выхода:', error);
      return { success: false, error: error.message };
    }
  }

  // Получить текущего пользователя
  getCurrentUser() {
    return this.currentUser;
  }

  // Проверить, авторизован ли пользователь
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Добавить слушатель изменений состояния аутентификации
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
  }

  // Получить ID пользователя
  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  // Получить имя пользователя
  getUserDisplayName() {
    return this.currentUser ? this.currentUser.displayName || this.currentUser.email : null;
  }
}

export default new AuthManager();