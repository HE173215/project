# Company Management System

This project is a **fullstack management system** built with **React**, **Ant Design / React-Bootstrap**, and a **Node.js/Express + MongoDB backend**.  
It includes authentication (login, register, OTP, forgot password), and management modules such as **Departments**.

---

## 🚀 Features

- **Authentication**
  - Register / Login
  - OTP verification
  - Forgot password & reset via email

- **Dashboard Layout**
  - Sidebar (navigation)
  - Header (search + user info)
  - Footer
  - Responsive layout with React-Bootstrap / Ant Design

- **Department Management**
  - Create / Edit / Delete departments
  - Assign parent department (with cyclic-prevention: cannot assign self or children as parent)
  - Assign manager (user)
  - Status (active / inactive)
  - Validation with Ant Design Form
  - DepartmentContext for centralized state & CRUD logic

- **Reusable Contexts**
  - `AuthContext` → authentication state & API calls
  - `DepartmentContext` → department state, users, and CRUD actions

---

## 🛠️ Tech Stack

- **Frontend**
  - React 19
  - React Router v6
  - Ant Design + React-Bootstrap
  - Context API for state management
  - Axios for API requests

- **Backend** (assumed)
  - Node.js + Express
  - MongoDB with Mongoose
  - JWT authentication
  - Nodemailer for OTP and password reset

---

## 📂 Project Structure (Frontend)

src/
├── api/ # API service functions (departments, users, auth, etc.)
├── components/
│ └── layout/ # Sidebar, HeaderBar, FooterBar
│ └── auth/ # LoginForm, RegisterForm, OtpModal, ForgotPasswordModal
├── context/ # AuthContext, DepartmentContext
├── pages/
│ ├── AuthPage.js
│ ├── HomePage.js
│ ├── DepartmentPage.js
│ └── dashboard/ # Placeholder pages: Dashboard, Messages, Account, Chart, Calendar, Reports
├── style/ # CSS files (AuthPage.css, Sidebar.css, etc.)
└── App.js

## ⚡ Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/HE173215/project.git
cd company-management
2. Install dependencies
bash
npm install
3. Setup environment
Create a .env file in server/:
env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_password
4. Run backend
bash
cd server
npm run dev
5. Run frontend
bash
cd client
npm start
The app will run on http://localhost:3000.