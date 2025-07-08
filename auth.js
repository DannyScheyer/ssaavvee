// Firebase functions will be available globally through the window object

// Firebase Authentication and Firestore management
class FirebaseAuthManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.authStateListener = null;
    }

    // Initialize Firebase services
    initialize() {
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        
        if (!this.auth || !this.db) {
            throw new Error('Firebase services not initialized');
        }

        // Set up auth state listener
        this.authStateListener = window.onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    // Handle authentication state changes
    handleAuthStateChange(user) {
        const pageRenderer = window.pageRenderer;
        if (!pageRenderer) return;

        if (user) {
            pageRenderer.renderDashboard();
        } else {
            pageRenderer.renderLoginPage();
        }
    }

    // Register a new user
    async registerUser(email, password) {
        try {
            const userCredential = await window.createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await this.createUserProfile(user.uid, {
                email: email,
                createdAt: window.serverTimestamp(),
                lastLogin: window.serverTimestamp()
            });

            return user;
        } catch (error) {
            throw this.handleFirebaseError(error);
        }
    }

    // Authenticate user
    async authenticateUser(email, password) {
        try {
            const userCredential = await window.signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Update last login time
            await this.updateUserProfile(user.uid, {
                lastLogin: window.serverTimestamp()
            });

            return user;
        } catch (error) {
            throw this.handleFirebaseError(error);
        }
    }

    // Create user profile in Firestore
    async createUserProfile(uid, profileData) {
        try {
            const userDocRef = window.doc(this.db, 'users', uid);
            await window.setDoc(userDocRef, profileData);
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw new Error('Failed to create user profile');
        }
    }

    // Update user profile in Firestore
    async updateUserProfile(uid, updates) {
        try {
            const userDocRef = window.doc(this.db, 'users', uid);
            await window.setDoc(userDocRef, updates, { merge: true });
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    }

    // Get user profile from Firestore
    async getUserProfile(uid) {
        try {
            const userDocRef = window.doc(this.db, 'users', uid);
            const userDoc = await window.getDoc(userDocRef);
            
            if (userDoc.exists()) {
                return userDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Check if user is currently authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Logout user
    async logout() {
        try {
            await window.signOut(this.auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw new Error('Failed to sign out');
        }
    }

    // Handle Firebase errors
    handleFirebaseError(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return new Error('An account with this email already exists');
            case 'auth/invalid-email':
                return new Error('Please enter a valid email address');
            case 'auth/operation-not-allowed':
                return new Error('Email/password accounts are not enabled');
            case 'auth/weak-password':
                return new Error('Password should be at least 6 characters');
            case 'auth/user-disabled':
                return new Error('This account has been disabled');
            case 'auth/user-not-found':
                return new Error('No account found with this email');
            case 'auth/wrong-password':
                return new Error('Incorrect password');
            case 'auth/invalid-credential':
                return new Error('Invalid email or password');
            case 'auth/too-many-requests':
                return new Error('Too many failed attempts. Please try again later');
            default:
                return new Error('Authentication failed. Please try again');
        }
    }

    // Create a new post
    async createPost(content, category = 'General') {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to create posts');
        }

        if (!content || content.trim().length === 0) {
            throw new Error('Post content cannot be empty');
        }

        try {
            const postsCollection = window.collection(this.db, 'posts');
            const postData = {
                content: content.trim(),
                category: category,
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                createdAt: window.serverTimestamp(),
                updatedAt: window.serverTimestamp()
            };

            const docRef = await window.addDoc(postsCollection, postData);
            return { id: docRef.id, ...postData };
        } catch (error) {
            console.error('Error creating post:', error);
            throw new Error('Failed to create post');
        }
    }

    // Get posts with real-time updates
    subscribeToPosts(callback, category = null, limitCount = 50) {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to view posts');
        }

        try {
            const postsCollection = window.collection(this.db, 'posts');
            let postsQuery;
            
            if (category && category !== 'All') {
                postsQuery = window.query(
                    postsCollection,
                    window.where('category', '==', category),
                    window.orderBy('createdAt', 'desc'),
                    window.limit(limitCount)
                );
            } else {
                postsQuery = window.query(
                    postsCollection,
                    window.orderBy('createdAt', 'desc'),
                    window.limit(limitCount)
                );
            }

            // Return the unsubscribe function
            return window.onSnapshot(postsQuery, (snapshot) => {
                const posts = [];
                snapshot.forEach((doc) => {
                    posts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(posts);
            }, (error) => {
                console.error('Error listening to posts:', error);
                callback([]);
            });
        } catch (error) {
            console.error('Error subscribing to posts:', error);
            throw new Error('Failed to subscribe to posts');
        }
    }

    // Get posts (one-time fetch)
    async getPosts(limitCount = 50) {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to view posts');
        }

        try {
            const postsCollection = window.collection(this.db, 'posts');
            const postsQuery = window.query(
                postsCollection,
                window.orderBy('createdAt', 'desc'),
                window.limit(limitCount)
            );

            const snapshot = await window.getDocs(postsQuery);
            const posts = [];
            snapshot.forEach((doc) => {
                posts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return posts;
        } catch (error) {
            console.error('Error getting posts:', error);
            throw new Error('Failed to get posts');
        }
    }

    // Create a new category
    async createCategory(categoryName) {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to create categories');
        }

        if (!categoryName || categoryName.trim().length === 0) {
            throw new Error('Category name cannot be empty');
        }

        try {
            const categoriesCollection = window.collection(this.db, 'categories');
            const categoryData = {
                name: categoryName.trim(),
                createdBy: this.currentUser.uid,
                createdAt: window.serverTimestamp()
            };

            const docRef = await window.addDoc(categoriesCollection, categoryData);
            return { id: docRef.id, ...categoryData };
        } catch (error) {
            console.error('Error creating category:', error);
            throw new Error('Failed to create category');
        }
    }

    // Get all categories
    async getCategories() {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to view categories');
        }

        try {
            const categoriesCollection = window.collection(this.db, 'categories');
            const categoriesQuery = window.query(
                categoriesCollection,
                window.orderBy('createdAt', 'asc')
            );

            const snapshot = await window.getDocs(categoriesQuery);
            const categories = [];
            snapshot.forEach((doc) => {
                categories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return categories;
        } catch (error) {
            console.error('Error getting categories:', error);
            throw new Error('Failed to get categories');
        }
    }

    // Subscribe to categories with real-time updates
    subscribeToCategories(callback) {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to view categories');
        }

        try {
            const categoriesCollection = window.collection(this.db, 'categories');
            const categoriesQuery = window.query(
                categoriesCollection,
                window.orderBy('createdAt', 'asc')
            );

            // Return the unsubscribe function
            return window.onSnapshot(categoriesQuery, (snapshot) => {
                const categories = [];
                snapshot.forEach((doc) => {
                    categories.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(categories);
            }, (error) => {
                console.error('Error listening to categories:', error);
                callback([]);
            });
        } catch (error) {
            console.error('Error subscribing to categories:', error);
            throw new Error('Failed to subscribe to categories');
        }
    }

    // Cleanup
    destroy() {
        if (this.authStateListener) {
            this.authStateListener();
        }
    }
}

// Page renderer (updated for Firebase)
class PageRenderer {
    constructor(authManager) {
        this.authManager = authManager;
        this.container = document.getElementById('app-container');
        this.selectedCategory = 'All';
        this.categories = [];
        this.postsUnsubscribe = null;
        this.categoriesUnsubscribe = null;
    }

    renderLoginPage() {
        // Reset container style for auth pages
        this.container.className = "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8";
        
        this.container.innerHTML = `
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        ActivityPub Authentication with Firebase
                    </p>
                </div>
                
                <form id="login-form" class="mt-8 space-y-6">
                    <div class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input 
                                id="email" 
                                name="email" 
                                type="email" 
                                required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                                placeholder="Enter your email"
                            >
                        </div>
                        
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input 
                                id="password" 
                                name="password" 
                                type="password" 
                                required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                                placeholder="Enter your password"
                            >
                        </div>
                    </div>

                    <div id="login-error" class="text-red-600 text-sm hidden"></div>
                    <div id="login-loading" class="text-blue-600 text-sm hidden">Signing in...</div>

                    <div class="space-y-4">
                        <button 
                            type="submit" 
                            id="login-submit-btn"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sign in
                        </button>
                        
                        <button 
                            type="button" 
                            id="go-to-signup"
                            class="w-full flex justify-center py-2 px-4 border border-black text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                            Create new account
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.attachLoginEventListeners();
    }

    renderSignupPage() {
        // Reset container style for auth pages
        this.container.className = "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8";
        
        this.container.innerHTML = `
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
                        Create your account
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        ActivityPub Authentication with Firebase
                    </p>
                </div>
                
                <form id="signup-form" class="mt-8 space-y-6">
                    <div class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input 
                                id="email" 
                                name="email" 
                                type="email" 
                                required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                                placeholder="Enter your email"
                            >
                        </div>
                        
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input 
                                id="password" 
                                name="password" 
                                type="password" 
                                required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                                placeholder="Create a password (6+ characters)"
                            >
                        </div>
                        
                        <div>
                            <label for="confirm-password" class="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input 
                                id="confirm-password" 
                                name="confirm-password" 
                                type="password" 
                                required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                                placeholder="Confirm your password"
                            >
                        </div>
                    </div>

                    <div id="signup-error" class="text-red-600 text-sm hidden"></div>
                    <div id="signup-loading" class="text-blue-600 text-sm hidden">Creating account...</div>

                    <div class="space-y-4">
                        <button 
                            type="submit" 
                            id="signup-submit-btn"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create account
                        </button>
                        
                        <button 
                            type="button" 
                            id="go-to-login"
                            class="w-full flex justify-center py-2 px-4 border border-black text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                            Already have an account? Sign in
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.attachSignupEventListeners();
    }

    renderDashboard() {
        const user = this.authManager.getCurrentUser();
        
        if (!user) {
            this.renderLoginPage();
            return;
        }

        // Update container to use full screen layout
        this.container.className = "min-h-screen";
        
        this.container.innerHTML = `
            <div class="min-h-screen grid grid-cols-7 gap-6 p-6">
                <!-- Sidebar (1 column) -->
                <div class="col-span-1 bg-custom-white border border-custom-grey p-6 h-fit">
                    <div class="space-y-6">
                        <div>
                            <h1 class="text-2xl font-bold text-custom-blue">ssaavvee</h1>
                        </div>
                        
                        <div class="space-y-3">
                            <h3 class="text-sm font-semibold text-custom-black uppercase tracking-wide">Account</h3>
                            <div class="bg-custom-white p-3 border border-custom-grey">
                                <p class="text-sm text-custom-black break-words font-medium">${user.email}</p>
                                <p class="text-xs text-custom-black mt-1">ID: ${user.uid.substring(0, 8)}...</p>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <h3 class="text-sm font-semibold text-custom-black uppercase tracking-wide">Categories</h3>
                            <div class="space-y-2">
                                <button 
                                    id="category-all"
                                    class="w-full text-left px-3 py-2 text-sm text-custom-black border border-custom-grey bg-custom-blue hover:opacity-80 transition-opacity"
                                >
                                    All messages
                                </button>
                                <div id="categories-list" class="space-y-2">
                                    <!-- Categories will be loaded here -->
                                </div>
                                <button 
                                    id="add-category-btn"
                                    class="w-full flex justify-center py-2 px-3 border border-custom-grey text-sm font-medium text-custom-black bg-custom-green hover:opacity-80 focus:outline-none transition-opacity"
                                >
                                    + Add Category
                                </button>
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-custom-black">Email Verified</span>
                                <span class="text-xs px-2 py-1 ${user.emailVerified ? 'bg-custom-green text-custom-black' : 'bg-custom-pink text-custom-black'}">${user.emailVerified ? 'Yes' : 'No'}</span>
                            </div>
                            <div class="text-xs text-custom-black">
                                <strong>Last Sign In:</strong><br>
                                ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        
                        <button 
                            id="logout-btn"
                            class="w-full flex justify-center py-3 px-4 border border-custom-grey text-sm font-medium text-custom-black bg-custom-pink hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-custom-pink disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Feed Panel (3 columns) -->
                <div class="col-span-3 bg-custom-white border border-custom-grey">
                    <div class="h-full flex flex-col">
                        <!-- Post Input Section -->
                        <div class="p-6 border-b border-custom-grey">
                            <form id="post-form" class="space-y-4">
                                <div>
                                    <label for="post-content" id="post-label" class="block text-sm font-semibold text-custom-black mb-3">
                                        What's on your mind?
                                    </label>
                                    <textarea 
                                        id="post-content" 
                                        name="content" 
                                        rows="3" 
                                        class="w-full px-4 py-3 border border-custom-grey bg-custom-white focus:outline-none focus:ring-2 focus:ring-custom-grey focus:border-custom-grey resize-none placeholder-custom-grey text-custom-black transition-colors"
                                        placeholder="Share something wonderful..."
                                        maxlength="500"
                                    ></textarea>
                                    <div class="flex justify-between items-center mt-3">
                                        <span id="char-count" class="text-xs text-custom-black">0/500</span>
                                        <button 
                                            type="submit" 
                                            id="post-submit-btn"
                                            class="px-6 py-2 bg-custom-green text-custom-black text-sm font-medium hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-custom-green disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                                <div id="post-error" class="text-red-600 text-sm hidden p-3 bg-red-50 border border-red-200"></div>
                                <div id="post-success" class="text-green-700 text-sm hidden p-3 bg-green-50 border border-green-200"></div>
                            </form>
                        </div>
                        
                        <!-- Feed Section -->
                        <div class="flex-1 overflow-y-auto">
                            <div class="p-6">
                                <h2 class="text-lg font-semibold text-custom-black mb-6 flex items-center">
                                    <span class="w-2 h-2 bg-custom-blue mr-3"></span>
                                    Recent Posts
                                </h2>
                                <div id="posts-container" class="space-y-4">
                                    <div class="text-center text-custom-black py-8">
                                        <div class="animate-spin h-8 w-8 border-b-2 border-custom-blue mx-auto mb-4"></div>
                                        <p>Loading posts...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Details Panel (3 columns) -->
                <div class="col-span-3 bg-custom-white border border-custom-grey p-6">
                    <div class="h-full flex items-center justify-center">
                        <div class="text-center text-custom-black">
                            <div class="w-16 h-16 bg-custom-blue mx-auto mb-4 flex items-center justify-center">
                                <div class="w-8 h-8 bg-custom-white"></div>
                            </div>
                            <h2 class="text-lg font-semibold mb-2 text-custom-black">Details</h2>
                            <p class="text-sm text-custom-black">Additional information will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachDashboardEventListeners();
        this.initializeFeed();
        this.updatePostLabel();
    }

    renderLoadingPage() {
        this.container.className = "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8";
        
        this.container.innerHTML = `
            <div class="max-w-md w-full space-y-8">
                <div class="bg-custom-white p-8 border border-custom-grey">
                    <div class="text-center">
                        <div class="animate-spin h-12 w-12 border-b-2 border-custom-blue mx-auto"></div>
                        <p class="mt-4 text-custom-black">Loading...</p>
                    </div>
                </div>
            </div>
        `;
    }

    attachLoginEventListeners() {
        const form = document.getElementById('login-form');
        const goToSignup = document.getElementById('go-to-signup');
        const errorDiv = document.getElementById('login-error');
        const loadingDiv = document.getElementById('login-loading');
        const submitBtn = document.getElementById('login-submit-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Reset states
            errorDiv.classList.add('hidden');
            loadingDiv.classList.remove('hidden');
            submitBtn.disabled = true;

            try {
                await this.authManager.authenticateUser(email, password);
                // Auth state change will handle navigation
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
                loadingDiv.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });

        goToSignup.addEventListener('click', () => {
            this.renderSignupPage();
        });
    }

    attachSignupEventListeners() {
        const form = document.getElementById('signup-form');
        const goToLogin = document.getElementById('go-to-login');
        const errorDiv = document.getElementById('signup-error');
        const loadingDiv = document.getElementById('signup-loading');
        const submitBtn = document.getElementById('signup-submit-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Reset states
            errorDiv.classList.add('hidden');

            // Client-side validation
            if (!this.isValidEmail(email)) {
                errorDiv.textContent = 'Please enter a valid email address';
                errorDiv.classList.remove('hidden');
                return;
            }

            if (password.length < 6) {
                errorDiv.textContent = 'Password must be at least 6 characters long';
                errorDiv.classList.remove('hidden');
                return;
            }

            if (password !== confirmPassword) {
                errorDiv.textContent = 'Passwords do not match';
                errorDiv.classList.remove('hidden');
                return;
            }

            // Show loading state
            loadingDiv.classList.remove('hidden');
            submitBtn.disabled = true;

            try {
                await this.authManager.registerUser(email, password);
                // Auth state change will handle navigation
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
                loadingDiv.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });

        goToLogin.addEventListener('click', () => {
            this.renderLoginPage();
        });
    }

    attachDashboardEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        const postForm = document.getElementById('post-form');
        const postContent = document.getElementById('post-content');
        const charCount = document.getElementById('char-count');
        const postSubmitBtn = document.getElementById('post-submit-btn');
        const postError = document.getElementById('post-error');
        const postSuccess = document.getElementById('post-success');
        const addCategoryBtn = document.getElementById('add-category-btn');
        const categoryAllBtn = document.getElementById('category-all');
        const postLabel = document.getElementById('post-label');
        
        // Logout functionality
        logoutBtn.addEventListener('click', async () => {
            try {
                await this.authManager.logout();
                // Auth state change will handle navigation
            } catch (error) {
                console.error('Logout error:', error);
                // Force navigation even if logout fails
                this.renderLoginPage();
            }
        });

        // Category selection - All messages
        categoryAllBtn.addEventListener('click', () => {
            this.selectCategory('All');
        });

        // Add category functionality
        addCategoryBtn.addEventListener('click', () => {
            const categoryName = prompt('Enter category name:');
            if (categoryName && categoryName.trim()) {
                this.createCategory(categoryName.trim());
            }
        });

        // Character counter for post content
        postContent.addEventListener('input', () => {
            const currentLength = postContent.value.length;
            charCount.textContent = `${currentLength}/500`;
            
            if (currentLength > 450) {
                charCount.className = 'text-xs text-red-600 font-medium';
            } else if (currentLength > 350) {
                charCount.className = 'text-xs text-custom-pink';
            } else {
                charCount.className = 'text-xs text-custom-black';
            }
        });

        // Post form submission
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = postContent.value.trim();
            
            // Reset states
            postError.classList.add('hidden');
            postSuccess.classList.add('hidden');
            
            if (!content) {
                postError.textContent = 'Please enter some content to post';
                postError.classList.remove('hidden');
                return;
            }

            // Show loading state
            postSubmitBtn.disabled = true;
            postSubmitBtn.textContent = 'Posting...';

            try {
                const category = this.selectedCategory === 'All' ? 'General' : this.selectedCategory;
                await this.authManager.createPost(content, category);
                
                // Success
                postContent.value = '';
                charCount.textContent = '0/500';
                charCount.className = 'text-xs text-custom-black';
                postSuccess.textContent = 'Post created successfully!';
                postSuccess.classList.remove('hidden');
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    postSuccess.classList.add('hidden');
                }, 3000);
                
            } catch (error) {
                postError.textContent = error.message;
                postError.classList.remove('hidden');
            } finally {
                postSubmitBtn.disabled = false;
                postSubmitBtn.textContent = 'Post';
            }
        });
    }

    initializeFeed() {
        const postsContainer = document.getElementById('posts-container');
        
        try {
            // Subscribe to real-time posts updates
            this.postsUnsubscribe = this.authManager.subscribeToPosts((posts) => {
                this.renderPosts(posts);
            }, this.selectedCategory);

            // Subscribe to categories updates
            this.categoriesUnsubscribe = this.authManager.subscribeToCategories((categories) => {
                this.categories = categories;
                this.renderCategories();
            });
        } catch (error) {
            console.error('Error initializing feed:', error);
            postsContainer.innerHTML = `
                <div class="text-center text-red-600 py-8">
                    <div class="w-12 h-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                        <div class="w-6 h-6 bg-red-400"></div>
                    </div>
                    <p>Error loading posts. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    // Category management methods
    selectCategory(categoryName) {
        this.selectedCategory = categoryName;
        this.updatePostLabel();
        this.updateCategorySelection();
        this.refreshFeed();
    }

    updatePostLabel() {
        const postLabel = document.getElementById('post-label');
        if (postLabel) {
            if (this.selectedCategory === 'All') {
                postLabel.textContent = "What's on your mind?";
            } else {
                postLabel.textContent = `Share in ${this.selectedCategory}`;
            }
        }
    }

    updateCategorySelection() {
        // Update visual selection of categories
        const categoryAllBtn = document.getElementById('category-all');
        const categoryButtons = document.querySelectorAll('.category-btn');
        
        // Reset all buttons
        if (categoryAllBtn) {
            categoryAllBtn.className = "w-full text-left px-3 py-2 text-sm text-custom-black border border-custom-grey bg-custom-white hover:opacity-80 transition-opacity";
        }
        categoryButtons.forEach(btn => {
            btn.className = "category-btn w-full text-left px-3 py-2 text-sm text-custom-black border border-custom-grey bg-custom-white hover:opacity-80 transition-opacity";
        });

        // Highlight selected category
        if (this.selectedCategory === 'All') {
            if (categoryAllBtn) {
                categoryAllBtn.className = "w-full text-left px-3 py-2 text-sm text-custom-black border border-custom-grey bg-custom-blue hover:opacity-80 transition-opacity";
            }
        } else {
            const selectedBtn = document.querySelector(`[data-category="${this.selectedCategory}"]`);
            if (selectedBtn) {
                selectedBtn.className = "category-btn w-full text-left px-3 py-2 text-sm text-custom-black border border-custom-grey bg-custom-blue hover:opacity-80 transition-opacity";
            }
        }
    }

    refreshFeed() {
        // Unsubscribe from current posts subscription
        if (this.postsUnsubscribe) {
            this.postsUnsubscribe();
        }

        // Subscribe to posts with new category filter
        try {
            this.postsUnsubscribe = this.authManager.subscribeToPosts((posts) => {
                this.renderPosts(posts);
            }, this.selectedCategory);
        } catch (error) {
            console.error('Error refreshing feed:', error);
        }
    }

    renderCategories() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        categoriesList.innerHTML = this.categories.map(category => `
            <button 
                class="category-btn w-full text-left px-3 py-2 text-sm text-custom-black border border-custom-grey bg-custom-white hover:opacity-80 transition-opacity"
                data-category="${category.name}"
            >
                ${category.name}
            </button>
        `).join('');

        // Add event listeners to category buttons
        const categoryButtons = categoriesList.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryName = btn.getAttribute('data-category');
                this.selectCategory(categoryName);
            });
        });

        // Update selection visuals
        this.updateCategorySelection();
    }

    async createCategory(categoryName) {
        try {
            await this.authManager.createCategory(categoryName);
            // Categories will be updated automatically via subscription
        } catch (error) {
            console.error('Error creating category:', error);
            alert('Failed to create category: ' + error.message);
        }
    }

    renderPosts(posts) {
        const postsContainer = document.getElementById('posts-container');
        
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="text-center text-custom-black py-8">
                    <div class="w-12 h-12 bg-custom-blue mx-auto mb-4 flex items-center justify-center">
                        <div class="w-6 h-6 bg-custom-white"></div>
                    </div>
                    <p>No posts yet. Be the first to share something!</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = posts.map(post => {
            const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
            const timeAgo = this.getTimeAgo(createdAt);
            const categoryName = post.category || 'General';
            
            // Process content for links
            const escapedContent = this.escapeHtml(post.content);
            const linkedContent = this.linkifyText(escapedContent);
            const urls = this.extractUrls(post.content);
            
            // Generate link previews
            const linkPreviews = urls.map(url => this.generateLinkPreview(url)).join('');
            
            return `
                <div class="border border-custom-grey p-5 bg-custom-white hover:opacity-80 transition-opacity">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center space-x-3">
                            <span class="text-xs px-2 py-1 bg-custom-blue text-custom-white">${categoryName}</span>
                        </div>
                        <div class="text-xs text-custom-black">${timeAgo}</div>
                    </div>
                    <div class="text-sm text-custom-black whitespace-pre-wrap leading-relaxed">${linkedContent}</div>
                    ${linkPreviews}
                </div>
            `;
        }).join('');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Detect and convert URLs to clickable links
    linkifyText(text) {
        const urlRegex = /(https?:\/\/[^\s<>"']+[^\s<>"'.,!?;:])/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-custom-blue underline hover:opacity-80 font-medium">$1</a>');
    }

    // Extract URLs from text
    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s<>"']+[^\s<>"'.,!?;:])/g;
        return text.match(urlRegex) || [];
    }

    // Generate link preview HTML
    generateLinkPreview(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            
            // Try to extract page title from URL path for better preview
            let title = domain;
            const path = urlObj.pathname;
            if (path && path !== '/') {
                const pathParts = path.split('/').filter(part => part);
                if (pathParts.length > 0) {
                    title = pathParts[pathParts.length - 1]
                        .replace(/[-_]/g, ' ')
                        .replace(/\.[^/.]+$/, '') // Remove file extension
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }
            }
            
            return `
                <div class="mt-3 border border-custom-grey bg-custom-white p-3 hover:opacity-80 transition-opacity cursor-pointer" onclick="window.open('${url}', '_blank', 'noopener,noreferrer')">
                    <div class="flex items-start space-x-3">
                        <div class="w-12 h-12 bg-custom-blue flex items-center justify-center text-custom-white text-xs font-bold flex-shrink-0">
                            ${domain.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-custom-black mb-1">${title}</div>
                            <div class="text-xs text-custom-black opacity-75 mb-2">${domain}</div>
                            <div class="text-xs text-custom-blue truncate">${url}</div>
                        </div>
                        <div class="flex-shrink-0">
                            <svg class="w-4 h-4 text-custom-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return `
                <div class="mt-3 border border-custom-grey bg-custom-white p-3">
                    <div class="text-sm text-custom-black">
                        <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-custom-blue underline hover:opacity-80">
                            ${url}
                        </a>
                    </div>
                </div>
            `;
        }
    }

    // Cleanup method for unsubscribing from real-time updates
    cleanup() {
        if (this.postsUnsubscribe) {
            this.postsUnsubscribe();
        }
        if (this.categoriesUnsubscribe) {
            this.categoriesUnsubscribe();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Application initialization
function initializeAuthApp() {
    try {
        const authManager = new FirebaseAuthManager();
        const pageRenderer = new PageRenderer(authManager);
        
        // Make pageRenderer globally available for auth state changes
        window.pageRenderer = pageRenderer;
        
        // Show loading while initializing
        pageRenderer.renderLoadingPage();
        
        // Initialize Firebase services
        authManager.initialize();
        
        console.log('Firebase Auth application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error page if Firebase fails to initialize
        const container = document.getElementById('app-container');
        container.className = "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8";
        container.innerHTML = `
            <div class="max-w-md w-full space-y-8">
                <div class="bg-custom-white p-8 border border-custom-grey">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                            <div class="w-8 h-8 bg-red-400"></div>
                        </div>
                        <h2 class="text-2xl font-bold text-red-600 mb-4">
                            Initialization Error
                        </h2>
                        <p class="text-custom-black mb-4">
                            Failed to initialize Firebase services. Please check your configuration.
                        </p>
                        <p class="text-sm text-custom-black p-3 bg-custom-white border border-custom-grey">
                            Error: ${error.message}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Export for potential future use with modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseAuthManager, PageRenderer, initializeAuthApp };
}

// Make initializeAuthApp globally available
window.initializeAuthApp = initializeAuthApp; 