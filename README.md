# 🧬 LabLink AI - Intelligent Lab Management System

<div align="center">

**An intelligent, AI-powered lab operating system for modern research.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-brightgreen?style=for-the-badge&logo=rocket)](http://9000-firebase-studio-1751458103249.cluster-bg6uurscprhn6qxr6xwtrhvkf6.cloudworkstations.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-SDK%20v11-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-AI-blue?style=for-the-badge&logo=google-gemini)](https://firebase.google.com/docs/genkit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

![LabLink Dashboard](https://placehold.co/1200x600.png?text=LabLink+Dashboard+Screenshot)
> *The main dashboard provides a comprehensive overview of your lab's activities.*

## 📝 About The Project

LabLink AI is a modern, web-based application designed to streamline lab management for research teams. It replaces scattered spreadsheets and notebooks with a centralized, intelligent system. With features like sample tracking, project management, and a powerful AI assistant, LabLink helps researchers save time, reduce errors, and focus on what matters most: **discovery**.

This application was built using a modern tech stack to provide a fast, responsive, and feature-rich user experience.

---

## ✨ Core Features

-   **🔐 Seamless Authentication**: Secure user login with email/password and an instant-access guest mode.
-   **📊 Comprehensive Dashboard**: Get a bird's-eye view of your lab with stats on total samples, projects, and workflows, plus a chart of sample status distribution.
-   **🤖 Conversational AI Assistant**: Powered by Google Gemini, the assistant can:
    -   Brainstorm new project and workflow ideas.
    -   Create new projects and samples through natural language commands.
    -   Maintain conversational context for follow-up questions.
-   **🧪 Sample Management**:
    -   Full CRUD (Create, Read, Update, Delete) for sample records.
    -   Advanced fields for tissue type, extraction method, storage conditions, and more.
    -   AI-powered tag suggestions based on the sample description.
    -   Upload and manage file attachments (images, CSVs, etc.) for each sample.
-   **📂 Project & Workflow Management**: Organize your work by creating projects and defining reusable analysis pipelines and protocols.
-   **🔒 Ownership & Security**: Users can only edit or delete the items they have created, ensuring data integrity.
-   **📱 Responsive Design**: A clean, modern UI that works beautifully on both desktop and mobile devices.

---

## 🛠️ Built With

This project leverages a powerful and modern set of technologies:

*   **Framework**: [Next.js](https://nextjs.org/) (React)
*   **AI**: [Google Gemini](https://ai.google/gemini/) & [Genkit](https://firebase.google.com/docs/genkit)
*   **Backend & DB**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
*   **Deployment**: Firebase App Hosting

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.
*   npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/your-username/lablink-ai.git
    cd lablink-ai
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up your environment variables**
    Create a `.env.local` file in the root of the project and add your Firebase project configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
4.  **Run the development server**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🔥 Firebase Configuration

This project requires a Firebase project to function correctly.

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Create a Web App**: Inside your project, create a new Web App and copy the `firebaseConfig` object values into your `.env.local` file.
3.  **Enable Authentication**:
    -   Go to the **Authentication** section.
    -   Under the **Sign-in method** tab, enable the **Email/Password** and **Anonymous** providers.
4.  **Set up Firestore**:
    -   Go to the **Firestore Database** section and create a new database in production mode.
    -   Navigate to the **Rules** tab and paste the following rules. This allows any authenticated user to read all data, but only create, update, or delete their own documents.
    ```firestore-rules
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow users to read/write their own user document
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        // Shared collections with ownership rules
        match /{collection}/{docId} {
          allow read: if request.auth != null;
          allow create: if request.auth != null 
                        && request.resource.data.createdBy.uid == request.auth.uid;
          allow update, delete: if request.auth != null 
                                && resource.data.createdBy.uid == request.auth.uid;
        }
      }
    }
    ```
    *Note: The generic `/{collection}/{docId}` rule will cover `samples`, `projects`, and `workflows` as long as they contain a `createdBy.uid` field matching the authenticated user.*
5.  **Set up Storage**:
    -   Go to the **Storage** section and click "Get Started" to enable it.
    -   Navigate to the **Rules** tab and update your rules to allow authenticated users to read and write files. A secure starting point is:
    ```firestore-rules
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        // Only allow authenticated users to read and write to storage
        match /{allPaths=**} {
          allow read, write: if request.auth != null;
        }
      }
    }
    ```
---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

*   Built in [Firebase Studio](https://firebase.google.com/studio)
*   UI Components by [ShadCN UI](https://ui.shadcn.com/)
*   AI powered by [Genkit](https://firebase.google.com/docs/genkit)
*   Icons by [Lucide](https://lucide.dev/)
*   Badges by [Shields.io](https://shields.io/)
