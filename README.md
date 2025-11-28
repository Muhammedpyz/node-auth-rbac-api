# 🛡️ Advanced Authentication & RBAC API

A production-ready, high-security Authentication and Role-Based Access Control (RBAC) API built with **Node.js**, **Express**, and **Prisma (MySQL)**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)
![Status](https://img.shields.io/badge/status-production--ready-success)
![Build](https://img.shields.io/github/actions/workflow/status/yourusername/level2-auth-api/node.js.yml)
![Coverage](https://img.shields.io/codecov/c/github/yourusername/level2-auth-api)

## 🚀 Key Features

### 🔐 Secure Authentication
- **JWT Implementation:** Short-lived Access Tokens (15m) + Long-lived Refresh Tokens (7d).
- **Bcrypt Hashing:** Industry-standard password hashing.
- **Account Lockout:** Brute-force protection (locks account after 3 failed attempts).
- **Email Verification:** Secure code verification flow.
- **Password Reset:** Secure token-based password reset via email.
- **Token Revocation:** Secure logout functionality (Blacklist/Revoke).

### 👮 Role-Based Access Control (RBAC)
- **Granular Permissions:** Middleware to protect routes based on roles.
- **Roles:** `USER`, `ADMIN`, `MODERATOR`.

### 🛡️ Advanced Security
- **Helmet:** Secure HTTP headers (CSP, HSTS, etc.).
- **HPP:** Protection against HTTP Parameter Pollution.
- **Rate Limiting:** Strict IP-based limiting for auth routes.
- **Input Sanitization:** Custom XSS protection and data validation.
- **CORS:** Configured with Origin Whitelist.

### ⚡ Performance
- **Response Caching:** `apicache` for public endpoints.
- **Compression:** Gzip compression for all responses.

### 💻 Developer Experience
- **Swagger/OpenAPI:** Full interactive API documentation.
- **Winston Logging:** Professional production-grade logging.
- **Jest Testing:** Automated integration tests.
- **Email Templates:** Beautiful HTML emails using Handlebars.
- **CI/CD:** GitHub Actions workflow included.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Prisma
- **Testing:** Jest, Supertest
- **Documentation:** Swagger UI
- **Logging:** Winston
- **Email:** Nodemailer, Handlebars

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MySQL database running

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Muhammedpyz/node-auth-rbac-api.git
    cd node-auth-rbac-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    NODE_ENV=development
    DATABASE_URL="mysql://user:password@localhost:3306/level2_db"
    JWT_SECRET="your_super_secret_key"
    JWT_REFRESH_SECRET="your_refresh_secret_key"
    SMTP_USER="your_email@gmail.com"
    SMTP_PASS="your_app_password"
    ```

4.  **Setup Database:**
    ```bash
    npx prisma migrate dev --name init
    node prisma/seed.js # Create initial Admin user
    ```

5.  **Run the Server:**
    ```bash
    npm run dev
    ```

---

## 📖 Documentation

### API Documentation (Swagger)
Once the server is running, visit:
👉 **http://localhost:3000/api-docs**

### Debug Client
A simple frontend is included for testing flows visually:
👉 **http://localhost:3000/debug**

---

## 🧪 Running Tests & Verification

### ✅ Automated Tests (Jest)
All automated tests passed successfully, verifying the core flows:
- **Registration:** User created, password hashed, email sent.
- **Duplicate Check:** Prevents registering with the same email.
- **Login:** Returns Access & Refresh tokens after email verification.

Run the tests:
```bash
npm test
```

**Expected Output:**
```bash
PASS  tests/auth.test.js
  Auth Endpoints
    √ should register a new user (2006 ms)
    √ should not register duplicate user (6 ms)
    √ should login successfully after verification (64 ms)
```

### ✅ Manual Verification
- **Swagger UI:** Accessible at `http://localhost:3000/api-docs`.
- **Debug Client:** Accessible at `http://localhost:3000/debug`.
- **Email Sending:** Verified using Nodemailer + Handlebars templates.
- **Security:**
    - Rate Limiting active on `/api/auth`.
    - Helmet headers present.
    - Input sanitization active.

---

## 📂 Project Structure

```
src/
├── config/         # Configuration (Swagger, DB, etc.)
├── controllers/    # Route Logic
├── middlewares/    # Auth, Role, Error, Security Middlewares
├── routes/         # API Route Definitions
├── services/       # Business Logic (Email, etc.)
├── utils/          # Helpers (Logger, AppError)
├── views/          # Email Templates (Handlebars)
├── app.js          # Express App Setup
└── server.js       # Server Entry Point
```

---

## 📜 License

This project is licensed under the MIT License.
