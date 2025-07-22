// Enhanced Family Meal Planner with Firebase and AI
class FamilyMealPlanner {
    constructor() {
        this.currentUser = null;
        this.familyId = null;
        this.currentWeek = new Date();
        this.meals = {};
        this.shoppingList = [];
        this.mealHistory = [];
        this.familyRecipes = [];
        
        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.setupEventListeners();
    }

    // Authentication
    setupAuthListeners() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.familyId = user.uid;
                await this.initializeApp();
            } else {
                this.showAuthScreen();
            }
        });
    }

    setupEventListeners() {
        // Sign in button
        document.getElementById('google-signin')?.addEventListener('click', () => {
            this.signInWithGoogle();
        });

        // Sign out button
        document.getElementById('sign-out-btn')?.addEventListener('click', () => {
            auth.signOut();
        });

        // AI recommendations button
        document.getElementById('ai-recommendations')?.addEventListener('click', () => {
            this.generateAIRecommendations();
        });
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Sign-in error:', error);
            alert('Sign-in failed. Please try again.');
        }
    }

    showAuthScreen() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 450px; width: 90%;">
                    <h1 style="margin-bottom: 1rem; color: #333; font-size: 2.5rem;">🍽️ Family Meal Planner</h1>
                    <p style="margin-bottom: 2rem; color: #666; font-size: 1.1rem;">Plan meals together with your family in real-time</p>
                    <button id="google-signin" style="background: #4285f4; color: white; border: none; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: 500; cursor: pointer; box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);">
                        📧 Sign in with Google
                    </button>
                </div>
            </div>
        `;
        
        // Re-setup event listeners for auth screen
        document.getElementById('google-signin').addEventListener('click', () => {
            this.signInWithGoogle();
        });
    }

    async initializeApp() {
        try {
            this.showMainApp();
            await this.loadDataFromFirebase();
            this.setupRealtimeUpdates();
            this.analyzeEatingPatterns();
        } catch (error) {
            console.error('App initialization error:', error);
        }
    }

    showMainApp() {
        // Your original HTML content goes here
        document.body.innerHTML = `
            <!-- Your existing meal planner HTML -->
            <!-- We'll merge your current design with Firebase features -->
        `;
        
        // Add Firebase-specific UI elements
        this.addFirebaseUI();
    }

    addFirebaseUI() {
        // Add user info and AI features to your existing header
        const header = document.querySelector('.header');
        if (header) {
            const userInfo = document.createElement('div');
            userInfo.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem;">
                    <img src="${this.currentUser.photoURL}" style="width: 30px; height: 30px; border-radius: 50%;" alt="User">
                    <span>${this.currentUser.displayName}</span>
                    <button id="ai-recommendations" class="nav-btn" style="background: #667eea;">🤖 AI Suggestions</button>
                    <button id="sign-out-btn" class="nav-btn" style="background: #dc3545;">Sign Out</button>
                </div>
            `;
            header.appendChild(userInfo);
        }

        // Re-setup event listeners
        this.setupEventListeners();
    }

    // Firebase Data Management
    async loadDataFromFirebase() {
        try {
            // Load meal plans
            const weekId = this.getWeekId(this.currentWeek);
            const mealPlanDoc = await db.collection('families')
                .doc(this.familyId)
                .collection('mealPlans')
                .doc(weekId)
                .get();

            if (mealPlanDoc.exists) {
                this.meals = mealPlanDoc.data();
                this.displayMeals();
            }

            // Load shopping list
            const shoppingDoc = await db.collection('families')
                .doc(this.familyId)
                .collection('shoppingList')
                .doc('current')
                .get();

            if (shoppingDoc.exists) {
                this.shoppingList = shoppingDoc.data().items || [];
                this.updateShoppingDisplay();
            }

            // Load meal history for AI
            const historySnapshot = await db.collection('families')
                .doc(this.familyId)
                .collection('mealHistory')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();

            this.mealHistory = historySnapshot.docs.map(doc => doc.data());

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async saveMealToFirebase(day, mealType, mealContent) {
        try {
            const weekId = this.getWeekId(this.currentWeek);
            const mealKey = `${day}-${mealType}`;

            await db.collection('families')
                .doc(this.familyId)
                .collection('mealPlans')
                .doc(weekId)
                .set({
                    [mealKey]: {
                        content: mealContent,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedBy: this.currentUser.displayName
                    }
                }, { merge: true });

            // Add to meal history for AI analysis
            await this.addToMealHistory({
                day: day,
                mealType: mealType,
                content: mealContent,
                weekId: weekId
            });

        } catch (error) {
            console.error('Error saving meal:', error);
        }
    }

    async addToMealHistory(mealData) {
        try {
            await db.collection('families')
                .doc(this.familyId)
                .collection('mealHistory')
                .add({
                    ...mealData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: this.currentUser.uid,
                    userName: this.currentUser.displayName
                });
        } catch (error) {
            console.error('Error adding to meal history:', error);
        }
    }

    setupRealtimeUpdates() {
        const weekId = this.getWeekId(this.currentWeek);
        
        // Listen for meal plan changes
        db.collection('families')
            .doc(this.familyId)
            .collection('mealPlans')
            .doc(weekId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.meals = doc.data();
                    this.displayMeals();
                }
            });

        // Listen for shopping list changes
        db.collection('families')
            .doc(this.familyId)
            .collection('shoppingList')
            .doc('current')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.shoppingList = doc.data().items || [];
                    this.updateShoppingDisplay();
                }
            });
    }

    // AI Recommendations System
    analyzeEatingPatterns() {
        if (this.mealHistory.length < 10) {
            return {
                message: 'Plan more meals to get AI recommendations! Need at least 10 meals.',
                recommendations: []
            };
        }

        const patterns = this.calculateMealPatterns();
        return this.generateSmartRecommendations(patterns);
    }

    calculateMealPatterns() {
        const patterns = {
            mealFrequency: {},
            cuisineTypes: {},
            mealTypeDistribution: { Breakfast: 0, Lunch: 0, Dinner: 0 },
            varietyScore: 0
        };

        this.mealHistory.forEach(meal => {
            patterns.mealFrequency[meal.content] = (patterns.mealFrequency[meal.content] || 0) + 1;
            patterns.mealTypeDistribution[meal.mealType]++;
            
            const cuisine = this.detectCuisine(meal.content);
            patterns.cuisineTypes[cuisine] = (patterns.cuisineTypes[cuisine] || 0) + 1;
        });

        const uniqueMeals = Object.keys(patterns.mealFrequency).length;
        patterns.varietyScore = Math.round((uniqueMeals / this.mealHistory.length) * 100);

        return patterns;
    }

    detectCuisine(mealText) {
        const cuisineKeywords = {
            'Indian': ['curry', 'dal', 'biryani', 'roti', 'sambar', 'rasam', 'idli', 'dosa'],
            'South Indian': ['sambar', 'rasam', 'idli', 'dosa', 'kootu', 'poriyal'],
            'Italian': ['pasta', 'pizza', 'risotto'],
            'Chinese': ['noodles', 'fried rice'],
            'Continental': ['sandwich', 'bread', 'omelette'],
            'Healthy': ['salad', 'fruits', 'juice']
        };

        const lowercaseText = mealText.toLowerCase();
        for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
            if (keywords.some(keyword => lowercaseText.includes(keyword))) {
                return cuisine;
            }
        }
        return 'Other';
    }

    generateSmartRecommendations(patterns) {
        const recommendations = [];

        // Variety recommendations
        const leastUsedCuisines = Object.entries(patterns.cuisineTypes)
            .sort(([,a], [,b]) => a - b)
            .slice(0, 2);

        if (leastUsedCuisines.length > 0) {
            recommendations.push({
                category: '🌍 Try Something New',
                suggestions: this.getSuggestionsByCuisine(leastUsedCuisines.map(([cuisine]) => cuisine))
            });
        }

        // Balance recommendations
        const avgMealsPerType = this.mealHistory.length / 3;
        Object.entries(patterns.mealTypeDistribution).forEach(([type, count]) => {
            if (count < avgMealsPerType * 0.7) {
                recommendations.push({
                    category: `⚖️ More ${type} Ideas`,
                    suggestions: this.getSuggestionsByMealType(type)
                });
            }
        });

        // Seasonal recommendations
        recommendations.push({
            category: '🍂 Seasonal Favorites',
            suggestions: this.getSeasonalSuggestions()
        });

        return recommendations;
    }

    getSuggestionsByCuisine(cuisines) {
        const suggestions = {
            'Indian': ['Chole Bhature', 'Rajma Chawal', 'Palak Paneer'],
            'South Indian': ['Uttapam', 'Medu Vada', 'Lemon Rice'],
            'Italian': ['Spaghetti Carbonara', 'Margherita Pizza', 'Risotto'],
            'Chinese': ['Hakka Noodles', 'Manchurian', 'Fried Rice'],
            'Continental': ['Club Sandwich', 'French Toast', 'Pancakes'],
            'Healthy': ['Quinoa Bowl', 'Green Smoothie', 'Grilled Vegetables']
        };

        const result = [];
        cuisines.forEach(cuisine => {
            if (suggestions[cuisine]) {
                result.push(...suggestions[cuisine].slice(0, 2));
            }
        });

        return result.slice(0, 4);
    }

    getSuggestionsByMealType(mealType) {
        const suggestions = {
            'Breakfast': ['Masala Dosa', 'Poha', 'Upma', 'Aloo Paratha'],
            'Lunch': ['Vegetable Pulao', 'Dal Tadka + Rice', 'Chicken Curry + Roti'],
            'Dinner': ['Paneer Butter Masala', 'Fish Curry', 'Mixed Vegetable Curry']
        };

        return suggestions[mealType] || [];
    }

    getSeasonalSuggestions() {
        const month = new Date().getMonth();
        const seasonalMeals = {
            winter: ['Hot Soup', 'Gajar Halwa', 'Sarson ka Saag'],
            summer: ['Buttermilk', 'Cucumber Salad', 'Mango Lassi'],
            monsoon: ['Pakoras', 'Hot Tea', 'Corn Bhel'],
            other: ['Seasonal Fruits', 'Fresh Vegetables', 'Local Specialties']
        };

        let season = 'other';
        if (month >= 11 || month <= 1) season = 'winter';
        else if (month >= 3 && month <= 5) season = 'summer';
        else if (month >= 6 && month <= 9) season = 'monsoon';

        return seasonalMeals[season];
    }

    async generateAIRecommendations() {
        try {
            const analysis = this.analyzeEatingPatterns();
            
            if (analysis.recommendations.length === 0) {
                alert('Plan more meals to get personalized AI recommendations! Need at least 10 meals in your history.');
                return;
            }

            let recommendationsHTML = '<div style="max-width: 500px;"><h3>🤖 AI Meal Recommendations</h3>';
            
            analysis.recommendations.forEach(rec => {
                recommendationsHTML += `
                    <div style="margin: 15px 0; padding: 15px; background: #f0f8ff; border-radius: 10px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${rec.category}</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${rec.suggestions.map(suggestion => `
                                <button onclick="mealPlanner.addRecommendedMeal('${suggestion}')" 
                                        style="background: #4caf50; color: white; border: none; padding: 8px 12px; border-radius: 15px; cursor: pointer; font-size: 12px;">
                                    ${suggestion} +
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            });

            recommendationsHTML += '</div>';
            
            // Show in a modal or alert
            this.showRecommendationsModal(recommendationsHTML);

        } catch (error) {
            console.error('Error generating recommendations:', error);
        }
    }

    showRecommendationsModal(content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 2000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                ${content}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async addRecommendedMeal(mealName) {
        // Find an empty slot to add the meal
        const weekDates = this.getWeekDates(this.currentWeek);
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        
        for (let day = 0; day < 7; day++) {
            for (const mealType of mealTypes) {
                const mealKey = `${day}-${mealType}`;
                if (!this.meals[mealKey] || !this.meals[mealKey].content) {
                    await this.saveMealToFirebase(day, mealType, mealName);
                    alert(`Added "${mealName}" to ${this.getDayName(day)} ${mealType}!`);
                    return;
                }
            }
        }
        
        alert('All meal slots are filled! Clear some slots first.');
    }

    // Utility functions
    getWeekId(date) {
        const weekDates = this.getWeekDates(date);
        return weekDates[0].toISOString().split('T')[0];
    }

    getWeekDates(date) {
        const week = [];
        const startDate = new Date(date);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            week.push(currentDate);
        }
        return week;
    }

    getDayName(dayIndex) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayIndex];
    }

    displayMeals() {
        // Update your existing meal display with Firebase data
        // This will integrate with your current meal table
    }

    updateShoppingDisplay() {
        // Update your existing shopping list display with Firebase data
        // This will integrate with your current shopping list
    }
}

// Initialize the app
let mealPlanner;
document.addEventListener('DOMContentLoaded', () => {
    mealPlanner = new FamilyMealPlanner();
});
