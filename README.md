# Simple Note: A Modern, AI-Powered Note-Taking App

Simple Note is a beautifully designed, feature-rich note-taking application built with a modern tech stack. It offers a seamless and intuitive experience for capturing your thoughts, organizing tasks, and collaborating with others, whether you're online or offline.

Powered by Next.js and Firebase, Simple Note ensures your notes are always in sync across all your devices in real-time. The clean, responsive interface is built with Tailwind CSS and ShadCN UI, providing a polished user experience with both light and dark modes.

![Simple Note Screenshot]<img width="1666" height="568" alt="image" src="https://github.com/user-attachments/assets/425ca1d9-d758-4ffa-9999-78c1fc4afaae" />



## ✨ Key Features

*   **☁️ Real-Time Cloud Sync:** Your notes are automatically saved and synced across devices using Firebase Firestore.
*   **🔌 Offline Support:** Continue working without an internet connection. Your changes will sync automatically when you reconnect.
*   **✍️ Rich Text Formatting:** Customize your notes with different fonts, alignments, text colors, and highlights.
*   **✅ Integrated To-Do Lists:** Add checklists to any note to track tasks and to-dos.
*   **🤖 AI-Powered Tagging:** Automatically generate relevant tags for your notes using Google's Gemini model via Genkit.
*   **🤝 Note Sharing & Collaboration:** Securely share notes with others and set permissions (viewer or editor).
*   **💾 Import/Export:** Easily back up your notes to a JSON file or import notes from a backup.
*   **🌓 Light & Dark Modes:** A beautiful, theme-aware interface that adapts to your system settings.
*   ** masonry-layout Responsive Masonry Layout:** A dynamic and visually appealing grid layout for your notes.
*   **🔐 Google Authentication:** Secure sign-in and user management with Firebase Authentication.

## 🚀 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router & Turbopack)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
*   **Generative AI:** [Firebase Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models
*   **State Management:** React Hooks & Context API

## Local Development

To run this project on your local machine, follow these steps:

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/installation) (or npm/yarn)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a file named `.env.local` in the root of your project and add your Firebase and Genkit configuration details. You can get your Firebase config from the Firebase Console.

```
# Firebase App Configuration
# Replace with your actual Firebase project config
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# Genkit (Gemini) API Key
# Get this from Google AI Studio
GEMINI_API_KEY="AIza..."
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
