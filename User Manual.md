# Circuitly | Official User Manual & Project Documentation

## 🌟 What is Circuitly?
**Circuitly** is a gamified, high-performance learning platform designed for engineering students to master electrical circuit theorems and analysis. It combines rigorous academic content with game-like elements such as XP (Experience Points), Hearts (Lives), and Topic Progression to make learning both engaging and data-driven.

---

## 📅 Weekly Progress Summary: Deep-Dive Comparison

### **Week 8: Infrastructure Foundation (Preparation)**
*   **AWS RDS Provisioning:** Initialized the PostgreSQL database instance. Configured core settings including the database engine (PostgreSQL 16), storage (20GB), and master credentials.
*   **Networking Isolation:** Set up the VPC and Public Access rules to allow remote connections, preparing the "pipe" for the backend to talk to the data.
*   **Variable Architecture:** Mapped out the environment variables (`DB_HOST`, `DB_USER`, etc.) required for the server to authenticate with AWS.
*   **Status:** The database was "Live" but empty and disconnected from the user experience.

### **Today (Week 9): Full-Stack Activation & Deployment (Execution)**
*   **Cloud Build Mastery:** Resolved critical AWS App Runner build failures by consolidating dependencies and fixing the "0.0.0.0" port binding. The app is now officially **publicly accessible**.
*   **Real-Time Data Synchro:** Transitioned the entire platform from static fallbacks to a **Live RDS Source of Truth**. Every XP point, heart, and quiz result now saves instantly to the AWS cloud.
*   **Behaviour Intelligence System:** Designed and implemented a custom "Behavioural Tracking" layer. We now log every major student action (Logins, Module Entrances, Quiz Completions) into a new `user_behaviours` table.
*   **Advanced Analytics API:** Built a "High-Resolution" Performance API that aggregates data. It doesn't just show XP; it calculates **cumulative time spent** per topic, giving you insight into student effort levels.
*   **Developer Visualizer:** Launched the `dev-dashboard.html`—a premium monitoring tool. This replaced reading "raw code" with a visual interface that streams student activity live.
*   **Code Stability & Quality:** Integrated **ESLint** to scan the codebase for errors. Fixed hidden bugs (like the quiz progression stall and API TypeErrors) that were previously blocking the user flow.
*   **Deployment Pipeline:** Established a "Dual-Remote" Git workflow. You can now push code for development while simultaneously triggering live AWS deployments with a single command.

---

## 🏗️ System Components

1.  **Student Frontend (Web App):** The main interface where students log in, learn topics, and take quizzes.
2.  **Admin Dashboard:** A built-in tool for educators to manage datasets, view activity logs, and monitor student performance.
3.  **Backend API:** The "brain" of the app, hosted on AWS App Runner, managing authentication and data flow.
4.  **AWS RDS Database:** The high-security storage for all questions, user accounts, and progress logs.

---

## 📖 How to Use Circuitly

### **For Students**
1.  **Registration/Login:** Create an account using your Student ID. Your progress follows you across any device.
2.  **Learning Modules:** Navigate through 8 core topics (Fundamentals, Op-Amps, Laplace, etc.).
3.  **Quizzes:** Test your knowledge. Earning XP unlocks higher levels. Be careful—losing hearts requires waiting for a recharge!
4.  **Progress Tracking:** See your total XP and active status on your profile.

### **For Administrators / Developers**
1.  **Monitoring Live Data:** Use the **Live Visualizer** to see if students are active and if the system is healthy.
2.  **Performance Reviews:** Export user data (XP and Time Spent) to analyze which topics students find most difficult.
3.  **Content Management:** Questions are stored in the `questions` table in RDS, allowing for easy updates without redeploying code.

---

## 🔗 Important Project Links

### **Live Applications**
*   **Main Application URL:** `https://huupmerkm6.ap-southeast-1.awsapprunner.com/`
*   **Live Visual Dashboard:** [Open Visualizer](https://huupmerkm6.ap-southeast-1.awsapprunner.com/dev-dashboard.html)

### **Live API Endpoints (Data Access)**
*   **Student Performance (JSON):** [View Performance](https://huupmerkm6.ap-southeast-1.awsapprunner.com/api/admin/users)
*   **Live Activity Logs (JSON):** [View Logs](https://huupmerkm6.ap-southeast-1.awsapprunner.com/api/behaviours)
*   **Backend Health Check:** [Check Connection](https://huupmerkm6.ap-southeast-1.awsapprunner.com/api/health)

### **Deployment Repositories**
*   **Main Codebase (GitHub):** `https://github.com/ruilong01/DIP-Circuitly`
*   **Deployment Remote (GitHub):** `https://github.com/ruilong01/DIP-Circuitly-deploy`
