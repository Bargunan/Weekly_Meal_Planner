// Simplified Firebase configuration - Family collaboration only
const firebaseConfig = {
  apiKey: "AIzaSyDicuf9DBTnEvoXK7WxCnOf8nb_u8hazcQ",
  authDomain: "meals-planner-weekly.firebaseapp.com",
  projectId: "meals-planner-weekly",
  storageBucket: "meals-planner-weekly.firebasestorage.app",
  messagingSenderId: "303592781889",
  appId: "1:303592781889:web:e52068c3bde39e90c5aec0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

console.log('🔥 Firebase initialized successfully!');
console.log('👨‍👩‍👧‍👦 Ready for family collaboration!');

// Simple authentication state handling
auth.onAuthStateChanged((user) => {
  const loadingScreen = document.getElementById('loading-screen');
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  
  if (user) {
    // User signed in - show meal planner
    console.log('✅ Welcome,', user.displayName);
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    
    // Update user info in header
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');
    
    if (userName) userName.textContent = user.displayName || 'Family Member';
    if (userPhoto) userPhoto.src = user.photoURL || '';
    
    // Initialize your original app
    if (typeof init === 'function') {
      init();
    }
    
  } else {
    // User not signed in - show auth screen
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
});

// Simple Firebase data sync (optional - keeps your local storage as primary)
function syncToFirebase() {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    // Save current week's meals to Firebase
    const weekId = new Date().toISOString().split('T')[0];
    const currentMeals = JSON.parse(localStorage.getItem('foodPlannerMeals') || '{}');
    const currentShopping = JSON.parse(localStorage.getItem('foodPlannerShopping') || '[]');
    
    db.collection('families').doc(user.uid).set({
      meals: currentMeals,
      shopping: currentShopping,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.displayName
    }, { merge: true });
    
    console.log('☁️ Data synced to cloud');
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Sync data every time something changes (attach to your existing save function)
const originalSaveData = window.saveData;
if (originalSaveData) {
  window.saveData = function() {
    originalSaveData.call(this);
    syncToFirebase();
  };
}
