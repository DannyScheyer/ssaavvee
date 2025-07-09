# ssaavvee - Social Media Platform

A modern, minimalist social media platform built with vanilla JavaScript and Firebase, featuring real-time messaging, categories, and link previews.

## ✨ Features

### 🔐 Authentication & Security
- **Secure Authentication**: Firebase Auth with email/password
- **7-Day Sessions**: Automatic session management
- **User Profiles**: Account management and verification status

### 💬 Messaging & Content
- **Real-time Posts**: Create and view posts with live updates
- **Category System**: Organize posts into custom categories
- **Link Previews**: Automatic detection and preview of shared URLs
- **Smart Linking**: URLs automatically become clickable with blue underlines

### 🎨 Design & UX
- **Minimalist Design**: Clean, focused interface with custom color palette
- **No Rounded Corners**: Sharp, modern geometric design
- **Responsive Layout**: 7-column grid system optimized for desktop
- **Custom Colors**: Blue (#c4d0e7), Pink (#f7e8e7), Green (#e2e5ce) palette
- **Serif Typography**: Fanwood Text font for elegance

### ⚡ Technical Features
- **Real-time Updates**: Live category and post synchronization
- **Security Rules**: Comprehensive Firestore security
- **Vanilla JavaScript**: No frameworks, lightweight and fast
- **Modern Firebase**: Latest SDK with module imports

## 🏗️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Tailwind CSS with custom configuration
- **Backend**: Firebase Auth + Firestore
- **Security**: Firestore security rules
- **Fonts**: Fanwood Text (Google Fonts)
- **Hosting**: Compatible with Netlify, Firebase Hosting, Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js (for development server)
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/ssaavvee.git
cd ssaavvee
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure Firebase**:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password provider)
   - Enable Firestore Database
   - Update Firebase config in `index.html` with your project credentials

4. **Deploy Firestore security rules**:
```bash
npx firebase deploy --only firestore:rules
```

5. **Start development server**:
```bash
npm start
# or
npx serve . --listen 3000
```

6. **Open your browser** to `http://localhost:3000`

## 📁 Project Structure

```
ssaavvee/
├── index.html          # Main HTML file with Firebase config & Tailwind
├── auth.js             # Core application logic and Firebase integration
├── package.json        # Dependencies and development scripts
├── firestore.rules     # Database security rules
├── firebase.json       # Firebase project configuration
├── .gitignore         # Git ignore patterns
└── README.md          # This file
```

## 🎯 Key Components

### Authentication Flow
- **Login/Signup Pages**: Clean forms with validation
- **Session Management**: 7-day automatic expiration
- **User Profiles**: Email verification and account details

### Category System
- **Dynamic Categories**: Users can create new categories
- **Smart Filtering**: Real-time filtering by selected category
- **"All Messages" View**: See posts across all categories
- **General Default**: Posts to "General" when "All Messages" selected

### Link Processing
- **URL Detection**: Automatic detection of http/https links
- **Link Styling**: Blue, underlined, clickable links
- **Preview Cards**: Rich previews showing domain, title, and click-to-visit
- **Security**: All links open in new tabs with security headers

## 🔧 Configuration

### 🔐 Secure Firebase Setup

**IMPORTANT**: This project uses secure configuration management. Follow these steps:

1. **Copy the template file**:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. **Edit firebase-config.js** with your actual Firebase credentials:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Project Settings → General Tab
   - Scroll to "Your apps" section
   - Copy your config object

3. **Replace the template values** in `firebase-config.js`:
   ```javascript
   const firebaseConfig = {
       apiKey: "your-actual-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.firebasestorage.app",
       messagingSenderId: "your-sender-id",
       appId: "your-app-id",
       measurementId: "your-measurement-id"
   };
   ```

4. **NEVER commit firebase-config.js** - it's in .gitignore for security

### Custom Colors
The app uses a custom Tailwind configuration with:
- **Blue**: `#c4d0e7` - Headers, branding, links
- **Pink**: `#f7e8e7` - Logout button, warnings  
- **Green**: `#e2e5ce` - Post button, success states
- **White**: `#F0EEE9` - Panel backgrounds
- **Grey**: `#A7A099` - Borders, secondary text
- **Black**: `#282727` - Primary text

## 🚀 Deployment

### Netlify (Recommended)
1. Drag and drop the project folder to [netlify.com](https://netlify.com)
2. Configure custom domain if desired

### Firebase Hosting
```bash
npx firebase init hosting
npx firebase deploy --only hosting
```

### Vercel
1. Connect your GitHub repository to [vercel.com](https://vercel.com)
2. Automatic deployments on every push

## 🔒 Security Features

### 🛡️ Authentication & Data Security
- **Firebase Auth**: Industry-standard authentication
- **Firestore Rules**: Users can only modify their own content
- **XSS Protection**: All user content is properly escaped
- **Secure Links**: External links use `noopener noreferrer`
- **Session Security**: Automatic logout after 7 days

### 🔐 Configuration Security
- **External Config**: Firebase credentials stored in gitignored file
- **Template System**: Example configuration for safe setup
- **No Hardcoded Keys**: All sensitive data excluded from version control
- **Force Push Protection**: Clean repository history without exposed keys

### 🚨 If Your API Key Was Compromised
If you accidentally committed API keys to version control:

1. **Immediately regenerate your Firebase API key**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Project Settings → General → Web API Key
   - Regenerate the key

2. **Update your local firebase-config.js** with the new key

3. **Review Firebase Security Rules** to ensure no unauthorized access

4. **Monitor your Firebase usage** for any suspicious activity

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use vanilla JavaScript (no frameworks)
- Follow the existing code style
- Add comments for complex logic
- Test in multiple browsers
- Ensure mobile responsiveness

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Firebase for robust backend services
- Tailwind CSS for utility-first styling
- Google Fonts for beautiful typography
- The open-source community for inspiration

---

**Built with ❤️ using vanilla JavaScript and modern web standards.** 