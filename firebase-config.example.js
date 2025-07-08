// Firebase Configuration Template
// Copy this file to firebase-config.js and replace with your actual Firebase config

export const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// To get your Firebase config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing project
// 3. Go to Project Settings > General
// 4. Scroll down to "Your apps" section
// 5. Click "Add app" and select Web (</>) 
// 6. Register app and copy the config object
// 7. Replace the values above with your actual config
// 8. Enable Authentication > Sign-in method > Email/Password
// 9. Create Firestore database in production mode  
// 10. Deploy the firestore.rules file 