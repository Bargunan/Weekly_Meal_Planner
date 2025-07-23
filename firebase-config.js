const firebaseConfig = {
  apiKey: "AIzaSyDicuf9DBTnEvoXK7WxCnOf8nb_u8hazcQ",
  authDomain: "meals-planner-weekly.firebaseapp.com",
  projectId: "meals-planner-weekly",
  storageBucket: "meals-planner-weekly.firebasestorage.app",
  messagingSenderId: "303592781889",
  appId: "1:303592781889:web:e52068c3bde39e90c5aec0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
console.log('🔥 Firebase ready!');
