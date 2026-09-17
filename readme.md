# 🏦 Bank Transactra — Advanced Banking & Transaction Processing Backend

**Bank Transactra** is a backend-focused banking system built with **Node.js, Express.js, MongoDB, and Mongoose** to model and implement core banking transaction workflows.

The project focuses on how financial transactions can be represented, processed, and recorded reliably through concepts such as **accounts, transactions, double-entry-style ledger records, idempotency, transaction sessions, validation, authentication, and immutable financial records**.

> **Bank Transactra is an educational backend project designed to demonstrate real-world backend engineering concepts involved in banking and financial transaction systems.**

---

## 📌 Table of Contents

* [Overview](#-overview)
* [Core Objectives](#-core-objectives)
* [Key Features](#-key-features)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Banking Transaction Flow](#-banking-transaction-flow)
* [Ledger Architecture](#-ledger-architecture)
* [Transaction Lifecycle](#-transaction-lifecycle)
* [Idempotency](#-idempotency)
* [MongoDB Transactions](#-mongodb-transactions)
* [Data Models](#-data-models)
* [Project Structure](#-project-structure)
* [Authentication & Security](#-authentication--security)
* [Environment Variables](#-environment-variables)
* [Installation](#-installation)
* [Running the Project](#-running-the-project)
* [API Design](#-api-design)
* [Error Handling](#-error-handling)
* [Design Principles](#-design-principles)
* [Future Enhancements](#-future-enhancements)
* [Learning Outcomes](#-learning-outcomes)
* [Author](#-author)

---

# 📖 Overview

Bank Transactra explores the backend architecture behind banking-style financial operations.

Instead of treating a transfer as a simple database update, the system models a transaction as a sequence of related operations involving:

```text
Account
   ↓
Transaction
   ↓
Ledger Entries
   ↓
Account Balances
```

A financial operation can therefore be represented through a transaction record and corresponding ledger entries.

For example, a transfer of `₹5,000` can conceptually produce:

```text
Source Account
      │
      │ DEBIT ₹5,000
      ▼
 Transaction
      │
      │ CREDIT ₹5,000
      ▼
Destination Account
```

This approach provides a structured foundation for maintaining transaction history and financial records.

---

# 🎯 Core Objectives

Bank Transactra was designed around several important backend engineering objectives:

* Model banking entities using MongoDB and Mongoose.
* Implement secure authentication.
* Represent financial transactions explicitly.
* Maintain ledger records for financial operations.
* Prevent modification of historical ledger entries.
* Introduce idempotency for transaction requests.
* Understand MongoDB sessions and transactions.
* Maintain consistency across multiple database operations.
* Validate incoming API data.
* Structure the backend using modular controllers, models, middleware, and routes.

---

# ✨ Key Features

## 🔐 Authentication

The backend uses authentication mechanisms based on:

* JSON Web Tokens (JWT)
* HTTP cookies
* Password hashing with bcrypt
* Request authentication middleware
* Input validation

Authentication establishes the identity of the user before protected banking operations are performed.

---

## 🏦 Account Management

The banking domain is represented through account documents associated with users.

An account can contain information such as:

* Account owner
* Account status
* Account number / identifier
* Balance
* Currency
* Account metadata

Account state can be represented using controlled values such as:

```text
ACTIVE
FROZEN
CLOSED
```

This allows the application to reason about whether an account is available for financial operations.

---

# 💸 Transaction Processing

Transactions are represented explicitly rather than treating a transfer as an isolated balance update.

A transaction can contain information such as:

```text
fromAccount
toAccount
amount
status
idempotencyKey
timestamps
```

A transaction can move through states such as:

```text
PENDING
   ↓
COMPLETED
```

If an operation fails, transaction handling can prevent incomplete financial operations from being committed.

---

# 📒 Immutable Ledger

One of the core concepts of Bank Transactra is the **ledger**.

A ledger entry records the financial effect of a transaction against an account.

Ledger entries contain concepts such as:

```text
Account
Amount
Transaction
Type
```

Ledger types are explicitly restricted to:

```text
CREDIT
DEBIT
```

For example:

```text
Transaction: TXN001
Amount: ₹5,000

Ledger Entry 1
Account: A001
Type: DEBIT
Amount: ₹5,000

Ledger Entry 2
Account: A002
Type: CREDIT
Amount: ₹5,000
```

---

## 🔒 Ledger Immutability

Financial history should not casually be rewritten after it has been recorded.

Bank Transactra therefore treats ledger entries as **immutable records**.

Ledger fields use Mongoose immutability where appropriate, and modification/deletion middleware is used to prevent operations such as:

```text
updateOne
updateMany
findOneAndUpdate
deleteOne
deleteMany
findOneAndDelete
findOneAndReplace
```

from modifying historical ledger records.

The principle is:

```text
Create Ledger Entry
        ↓
      Record
        ↓
Do NOT Modify
        ↓
Do NOT Delete
```

This creates a cleaner foundation for maintaining an auditable financial history.

---

# 🔄 Banking Transaction Flow

A typical transaction can conceptually follow this workflow:

```text
                 ┌───────────────────┐
                 │  Client Request   │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Authentication &  │
                 │    Validation     │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Validate Accounts │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Check Idempotency │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Start DB Session  │
                 │   Transaction     │
                 └─────────┬─────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │ Create Transaction       │
              │ Record                   │
              └────────────┬─────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │ DEBIT Ledger │          │ CREDIT Ledger│
      └──────────────┘          └──────────────┘
              │                         │
              └────────────┬────────────┘
                           ▼
                 ┌───────────────────┐
                 │ Update Transaction│
                 │      Status       │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │      COMMIT       │
                 └───────────────────┘
```

---

# 🔁 Transaction Lifecycle

The transaction model separates the concept of a transaction request from its final state.

A simplified lifecycle is:

```text
             Request
                │
                ▼
            PENDING
                │
        ┌───────┴───────┐
        │               │
      Success          Error
        │               │
        ▼               ▼
   COMPLETED         ABORTED
```

This approach makes transaction processing easier to reason about and provides a clear state transition model.

---

# ♻️ Idempotency

Bank Transactra introduces an **idempotency key** for transaction requests.

Example:

```json
{
  "toAccount": "ACCOUNT_ID",
  "amount": 5000,
  "idempotencyKey": "TXN-UNIQUE-001"
}
```

### Why Idempotency Matters

Imagine a client sends a transaction request and does not receive a response because of a network interruption.

The client may send the same request again.

Without idempotency:

```text
Request 1 → ₹5,000 transferred
Request 2 → ₹5,000 transferred again
```

With idempotency:

```text
Request 1 → Transaction processed
Request 2 → Existing transaction identified
```

This helps prevent accidental duplicate processing.

---

# 🧩 MongoDB Transactions

Banking operations can involve multiple database changes.

For example:

```text
Create Transaction
       +
Create Debit Ledger
       +
Create Credit Ledger
       +
Update Account Information
```

These operations should be treated as one logical unit.

Bank Transactra uses **Mongoose sessions and MongoDB transactions** for this purpose.

Conceptually:

```js
const session = await mongoose.startSession();

try {
    session.startTransaction();

    // Banking operations

    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
} finally {
    await session.endSession();
}
```

If an operation fails before the transaction is committed, the transaction can be aborted instead of leaving partially completed database changes.

### MongoDB Requirement

MongoDB multi-document transactions require a deployment that supports transactions, such as a **replica set or mongos-backed deployment**.

For local development, MongoDB should therefore be configured appropriately before using `session.startTransaction()`.

---

# 🗃️ Data Models

The backend revolves around several core domain models.

## User

Represents an authenticated application user.

Conceptual relationship:

```text
User
 │
 └── Account
```

---

## Account

Represents a bank account owned by a user.

Conceptual relationship:

```text
User
  │
  ▼
Account
  │
  ├── Transactions
  │
  └── Ledger Entries
```

---

## Transaction

Represents the logical financial operation.

Important concepts include:

```text
fromAccount
toAccount
amount
status
idempotencyKey
```

---

## Ledger

Represents the accounting effect of a transaction.

Each ledger entry belongs to:

```text
Account
Transaction
```

and has a type:

```text
CREDIT
DEBIT
```

---

# 🏗️ Project Structure

The project follows a modular Node.js backend structure.

```text
Bank-Transactra/
│
├── src/
│   │
│   ├── app.js
│   │
│   ├── controllers/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── middleware/
│   │
│   ├── utils/
│   │
│   └── ...
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

The exact modules can evolve as the banking domain grows.

---

# 🔐 Authentication & Security

The backend uses several security-oriented technologies.

### Password Hashing

Passwords are protected using:

```text
bcrypt
```

Instead of storing raw passwords, the application stores password hashes.

---

### JWT Authentication

JSON Web Tokens are used to establish authenticated sessions.

The general flow is:

```text
Register
   ↓
Password Hashing
   ↓
Store User
   ↓
Login
   ↓
Verify Credentials
   ↓
Generate JWT
   ↓
Authenticated Requests
```

---

### Cookies

`cookie-parser` is included for handling HTTP cookies.

This allows authentication-related tokens to be managed through cookies where the application's authentication flow requires them.

---

### Input Validation

The project uses:

```text
validator
```

to validate user-provided data and maintain cleaner input boundaries.

---

# 🛠️ Technology Stack

| Technology        | Purpose                         |
| ----------------- | ------------------------------- |
| **Node.js**       | JavaScript runtime              |
| **Express.js**    | REST API framework              |
| **MongoDB**       | NoSQL database                  |
| **Mongoose**      | MongoDB ODM                     |
| **JWT**           | Authentication                  |
| **bcrypt**        | Password hashing                |
| **Nodemailer**    | Email functionality             |
| **dotenv**        | Environment configuration       |
| **cookie-parser** | Cookie handling                 |
| **validator**     | Input validation                |
| **ES Modules**    | Modern JavaScript module system |

The repository currently declares these core dependencies in `package.json`.

---

# 📦 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/iamkeshavSharma19/Bank-Transactra.git
```

Navigate into the project:

```bash
cd Bank-Transactra
```

---

## 2. Install Dependencies

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

Use your actual configuration values.

> Never commit `.env` or other secret credentials to GitHub.

---

# ▶️ Running the Project

### Development

The repository includes a development script using Nodemon:

```bash
npm run dev
```

### Production / Normal Start

```bash
npm start
```

The project's `package.json` defines the development and start scripts.

---

# 🌐 API Design

The backend is structured around REST-style API endpoints.

Typical domain areas include:

```text
Authentication
      │
      ├── Register
      ├── Login
      └── Authentication

Accounts
      │
      ├── Account Creation
      ├── Account Details
      └── Account Management

Transactions
      │
      ├── Create Transaction
      ├── Process Transaction
      └── Transaction History

Ledger
      │
      ├── Credit Entry
      ├── Debit Entry
      └── Ledger History
```

The exact endpoints should be treated according to the routes implemented in the current source code.

---

# 🧯 Error Handling

Bank Transactra validates important conditions before processing financial operations.

Examples include:

```text
Missing required fields
        ↓
400 Bad Request
```

```text
Invalid account
        ↓
400 Bad Request
```

```text
Authentication failure
        ↓
Unauthorized response
```

```text
Database / transaction failure
        ↓
Operation aborted
```

The objective is to prevent invalid requests from progressing into financial operations.

---

# 🧠 Design Principles

## 1. Separation of Concerns

Different responsibilities are separated into:

```text
Routes
   ↓
Controllers
   ↓
Models
   ↓
Database
```

This keeps the application modular and easier to maintain.

---

## 2. Immutable Financial History

Ledger records represent historical financial events.

Therefore:

```text
Historical Record
       ↓
   Append Only
```

rather than:

```text
Historical Record
       ↓
Repeatedly Edited
```

---

## 3. Atomic Operations

Related banking operations should be processed as one logical unit wherever database transactions are used.

```text
All Operations Successful
          ↓
        COMMIT
```

or:

```text
Any Critical Failure
          ↓
        ABORT
```

---

## 4. Idempotent Transaction Requests

Transaction requests use an idempotency key to help identify duplicate requests.

This is particularly important for operations involving money.

---

## 5. Explicit Transaction State

Rather than treating every request as instantly successful, transaction status provides an explicit representation of the processing lifecycle.

---

# 🔍 Example: Transaction + Ledger

Suppose:

```text
Account A = ₹20,000
Account B = ₹10,000
Transfer = ₹5,000
```

The transaction can be represented as:

```text
Transaction
────────────────────────────
From: Account A
To:   Account B
Amount: ₹5,000
Status: COMPLETED
```

The ledger records the corresponding financial effects:

```text
Ledger Entry
────────────────────────────
Account: A
Type: DEBIT
Amount: ₹5,000

Ledger Entry
────────────────────────────
Account: B
Type: CREDIT
Amount: ₹5,000
```

Conceptually:

```text
             ₹5,000
Account A ───────────────► Account B
    │                           │
  DEBIT                       CREDIT
    │                           │
    └──────── Transaction ──────┘
```

This creates a traceable relationship between:

```text
Account
   ↕
Transaction
   ↕
Ledger
```

---

# 📈 Why Ledger-Based Design?

A ledger provides an explicit historical representation of financial movements.

Instead of relying only on the current account balance:

```text
Current Balance = ₹15,000
```

the system can retain the events that contributed to that balance:

```text
Opening Balance
      +
Credit
      -
Debit
      +
Credit
      -
Debit
      =
Current Balance
```

This makes the transaction history easier to inspect and reason about.

---

# 🚀 Future Enhancements

The architecture can be extended with additional banking capabilities such as:

* Transaction history APIs
* Pagination for transaction records
* Advanced transaction filtering
* Account statement generation
* Scheduled transactions
* Transaction reversal workflows
* Refund processing
* Transfer limits
* Account-level transaction restrictions
* Role-based authorization
* Audit logging
* Rate limiting
* Request tracing
* Automated testing
* API documentation with OpenAPI / Swagger
* Docker-based development
* Production deployment
* Background transaction processing
* Enhanced fraud and transaction validation rules

---

# 📚 Learning Outcomes

Building Bank Transactra provides practical exposure to several backend engineering concepts:

### Backend Development

* REST API development
* Express.js architecture
* Controller design
* Middleware
* Request validation
* Error handling

### Database Engineering

* MongoDB
* Mongoose schemas
* References between collections
* Indexing
* Aggregation concepts
* Database sessions
* Multi-document transactions

### Financial Domain Modeling

* Accounts
* Transactions
* Credits
* Debits
* Ledgers
* Transaction states
* Idempotency

### Security

* Password hashing
* JWT authentication
* Cookies
* Environment variables
* Input validation

---

# 🔗 Repository

**GitHub Repository:**

https://github.com/iamkeshavSharma19/Bank-Transactra

---

# 👨‍💻 Author

**Keshav Sharma**

B.Tech Computer Science & Engineering

GitHub:

https://github.com/iamkeshavSharma19

---

## ⭐ Project Philosophy

> **Bank Transactra is built to understand not just how to transfer money, but how a backend can model, process, record, and protect financial transactions.**

The project focuses on applying backend engineering principles to a realistic financial domain while exploring the relationship between **accounts, transactions, ledgers, database consistency, and secure API design**.
