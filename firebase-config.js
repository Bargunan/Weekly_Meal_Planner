const firebaseConfig = {
  apiKey: "AIzaSyDicuf9DBTnEvoXK7WxCnOf8nb_u8hazcQ",
  authDomain: "meals-planner-weekly.firebaseapp.com",
  projectId: "meals-planner-weekly",
  storageBucket: "meals-planner-weekly.firebasestorage.app",
  messagingSenderId: "303592781889",
  appId: "1:303592781889:web:e52068c3bde39e90c5aec0"
};

try {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  console.log('🔥 Firebase initialized successfully!');
  console.log('📧 Project: meals-planner-weekly');
  console.log('👨‍👩‍👧‍👦 Ready for family collaboration!');

  // Fix the loading screen issue
  setTimeout(() => {
    console.log('🔍 Checking authentication state...');
    
    // If loading screen is still showing after 5 seconds, force show auth screen
    const loadingScreen = document.getElementById('loading-screen');
    const authContainer = document.getElementById('auth-container');
    
    if (loadingScreen && loadingScreen.style.display !== 'none') {
      console.log('⚡ Forcing auth screen to show');
      loadingScreen.style.display = 'none';
      if (authContainer) {
        authContainer.style.display = 'flex';
      }
    }
  }, 5000);

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  
  // Fallback: show auth screen even if Firebase fails
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    const authContainer = document.getElementById('auth-container');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
  }, 2000);
}
