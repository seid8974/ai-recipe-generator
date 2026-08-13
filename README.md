# 🍳 AI Recipe Generator & Meal Planner

An AI-powered full-stack web application designed to generate personalized recipes, track pantry inventory, plan weekly meals, and manage shopping lists using Google Gemini AI.

---

## 🚀 Key Features

### 🤖 AI Recipe Generation (Google Gemini)
- **Smart Generation:** Generate custom recipes based on ingredients you have in hand or directly from your pantry.
- **Customizable Options:** Set cuisine preference, dietary restrictions, target servings, and cooking time.
- **Detailed Output:** Complete with step-by-step instructions, nutrition breakdown, and cooking tips.
- **Dynamic Images:** Automatically fetches relevant, high-quality food photography via the **Unsplash API**.

### 🔐 User Authentication & Account Security
- JWT-based authentication (Secure Signup / Login).
- Password reset functionality via automated emails using **Nodemailer**.
- Protected API routes and persistent user sessions.

### 📚 Recipe Management
- Search, filter by cuisine/difficulty, and paginate through saved recipes.
- Dynamic serving size scaling (automatically adjusts ingredient quantities).
- Interactive ingredient checklists and favorite/star functionality.

### 🧺 Pantry Inventory Tracker
- Manage pantry items with quantities, units, categories, and expiration dates.
- Automated alerts for items expiring within 7 days.
- One-click recipe generation straight from expiring pantry items.

### 📅 Weekly Meal Planner & 🛒 Shopping List
- Interactive 7-day weekly calendar (Breakfast, Lunch, Dinner).
- Auto-generate shopping lists based on planned meals minus current pantry stock.
- Transfer checked shopping list items directly back into the pantry inventory.

### 📊 Dashboard & User Preferences
- Live metrics: Total saved recipes, pantry stock, and calorie tracking versus daily goals.
- Customizable profile: Dietary restrictions, allergies, metric/imperial unit preferences, and **Dark Mode** toggle.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS v4
- **Routing & Icons:** React Router v7, Lucide React
- **HTTP Client & Notifications:** Axios, React Hot Toast

### **Backend**
- **Runtime & Server:** Node.js, Express.js (v5)
- **Database:** PostgreSQL (Sequelize ORM & `pg`)
- **Authentication:** JSON Web Tokens (JWT), BcryptJS
- **Integrations:** `@google/genai` (Gemini 2.5 Flash), Unsplash API, Nodemailer

---

## 📁 Project Structure

AI-RECIPE-GENERATOR/
├── backend/
│   ├── config/          # Database configuration and schemas
│   ├── controllers/     # Auth, Recipe, Pantry, MealPlan & ShoppingList controllers
│   ├── middleware/      # Authentication middleware
│   ├── models/          # Sequelize models (User, Recipe, PantryItem, etc.)
│   ├── routes/          # Express API route endpoints
│   └── utils/           # Gemini AI, Unsplash, and Email utility helpers
└── frontend/
    ├── public/          # Static assets & favicons
    └── src/
        ├── components/  # Reusable UI components
        ├── context/     # Application state management
        ├── pages/       # Dashboard, Recipes, Pantry, Meal Planner views
        └── services/    # API integration services

---

## ⚡ Getting Started Locally

### **Prerequisites**
- **Node.js** (v18 or higher)
- **PostgreSQL** database

### **1. Clone the repository**
git clone https://github.com/seid8974/ai-recipe-generator.git
cd ai-recipe-generator

### **2. Setup Backend**
cd backend
npm install

Create a `.env` file in the `backend` folder with your environment keys:

PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_api_key
EMAIL_USER=your_email@gmail.com    
EMAIL_PASS=your_email_app_password

Run migrations and start the development server:
npm run dev

### **3. Setup Frontend**
cd ../frontend
npm install
npm run dev

---

⭐️ *Developed by [Seid Mohammed](https://github.com/seid8974)*
