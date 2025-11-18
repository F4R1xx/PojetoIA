// f4r1xx/pojetoia/PojetoIA-bab74157b6c64eec171b8ad1b88e362d30752290/firebase.js

// Importa a função de inicialização do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Suas configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAf44UpI3tii4Vr2V2G37T_UOJQ7oxQSlg",
  authDomain: "pojetoia.firebaseapp.com",
  databaseURL: "https://pojetoia-default-rtdb.firebaseio.com",
  projectId: "pojetoia",
  storageBucket: "pojetoia.firebasestorage.app",
  messagingSenderId: "33438563311",
  appId: "1:33438563311:web:30a076a93f56d24867d41a",
  measurementId: "G-T6N7SBLVYW"
};

// Inicializa o Firebase e exporta a instância do app
export const firebaseApp = initializeApp(firebaseConfig);