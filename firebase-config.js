// Firebase configuration for your Weekly Meal Planner
// Using Firebase v9 compat mode for compatibility with your app

const firebaseConfig = {
  apiKey: "AIzaSyDicuf9DBTnEvoXK7WxCnOf8nb_u8hazcQ",
  authDomain: "meals-planner-weekly.firebaseapp.com",
  projectId: "meals-planner-weekly",
  storageBucket: "meals-planner-weekly.firebasestorage.app",
  messagingSenderId: "303592781889",
  appId: "1:303592781889:web:e52068c3bde39e90c5aec0",
  measurementId: "G-S0SVP7KLKZ"
};

// Initialize Firebase using compat mode (works with your current HTML)
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for better family experience
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.log('The current browser does not support offline persistence');
    }
  });

// Optional: Enable Analytics
if (typeof firebase.analytics !== 'undefined') {
  const analytics = firebase.analytics();
}

console.log('🔥 Firebase initialized successfully for family meal planning!');
console.log('📧 Project: meals-planner-weekly');
console.log('👨‍👩‍👧‍👦 Ready for family collaboration!');
