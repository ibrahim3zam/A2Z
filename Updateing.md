# 🚀 A2Z Decoration - First Update

Welcome to the first major update of the **A2Z Decoration** backend. In this update, the project infrastructure has been completely refactored for better scalability, security, and separation of concerns.

---

## 🛠️ Key Architecture & Features Implemented

### 1. 📁 Project Bootstrapping (`index.js` & App Init)
* Refactored the entry point `index.js` to handle the application bootstrapping cleanly.
* Created an isolation layer for application startup (`initiatApp.js`) to handle server configurations, middleware stacking, and modular routing smoothly.

### 2. 🗄️ Database Service
* Centralized MongoDB connection logic using **Mongoose** with solid connection management and error handling.

### 3. 🎯 Separation of Concerns (MVC Design Pattern)
* Completely separated the logic by moving from inline route handling to a clean **Controller Layer**.
* **Flow:** `Routes` ➡️ `Validation Middleware` ➡️ `Auth Middleware` ➡️ `Controllers`.

### 4. 🔐 Authentication & Authorization (RBAC)
* Implemented **Role-Based Access Control (RBAC)** supporting three distinct roles:
  * 👑 **Admin**
  * 🛠️ **Engineer**
  * 👤 **User**
* Secured endpoints using dual-token architecture:
  * **Access Token:** Short-lived token for secure API requests.
  * **Refresh Token:** Long-lived token to securely renew access without prompting re-login.

### 5. 📨 Email Notification Service
* Integrated **Nodemailer** for handling automated system emails (e.g., account verification, password resets) configured securely via environment variables.

### 6. 🛡️ Request Validation
* Integrated **Joi** validation as a global/route-level middleware to sanitize and validate incoming request payloads (`body`, `params`, `query`) before reaching the controllers.

### 7. 🔄 Standardized Global Response & Error Handling
* Created a unified API response structure for consistency across all mobile/frontend consumers:
  * **Success Response:** Standardized JSON layout for successful data retrieval/mutations.
  * **App Error Handling:** Implemented a global async error-wrapper (`globalResponse`) to catch runtime failures and avoid server crashes (Zero downtime).

---

## 🏗️ Folder Structure Highlight
```text
src/
├── DB/
│   └── connection.js
├── modules/
│   ├── admin/
│   ├── engineer/
│   └── user/
├── middlewares/
│   └── validation.middleware.js
└── utils/
    ├── initiatApp.js
    ├── errorhandling.js
    └── emailService.js





    # You're all verified!
If you lose your phone, or don’t have access to your verification device, this code is your failsafe to access your account.

Recovery code
Y9HNG4FV1WTUVQ43WJXGEWYJ


(warning)
Save this code somewhere safe and accessible

