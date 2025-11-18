import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseApp } from './firebase.js';

const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleLoginBtn = document.getElementById('google-login');
const logoutButton = document.getElementById('logout-button');
const authError = document.getElementById('auth-error');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');

export function setupAuth(onLogin, onLogout) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('text-indigo-400', 'border-indigo-400');
        loginTab.classList.remove('text-gray-400');
        registerTab.classList.remove('text-indigo-400', 'border-indigo-400');
        registerTab.classList.add('text-gray-400');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authError.textContent = '';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('text-indigo-400', 'border-indigo-400');
        registerTab.classList.remove('text-gray-400');
        loginTab.classList.remove('text-indigo-400', 'border-indigo-400');
        loginTab.classList.add('text-gray-400');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authError.textContent = '';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
            .catch(error => authError.textContent = "Email ou senha inválidos.");
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value)
            .catch(error => {
                if (error.code === 'auth/weak-password') {
                    authError.textContent = "A senha deve ter pelo menos 6 caracteres.";
                } else if (error.code === 'auth/email-already-in-use') {
                    authError.textContent = "Este email já está em uso.";
                } else {
                    authError.textContent = "Erro ao criar conta. Tente novamente.";
                }
            });
    });

    googleLoginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch(error => {
            authError.textContent = "Erro ao fazer login com Google.";
        });
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth);
    });
}

