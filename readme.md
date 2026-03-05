# 🔗 Bitespeed Identity Reconciliation

A backend web service that identifies and links customer contacts across multiple purchases — even when they use different emails or phone numbers.

Built for the [Bitespeed Backend Task](https://bitespeed.notion.site/Bitespeed-Backend-Task-Identity-Reconciliation-53392ab01fe149fab989422300423199).

---

## 🚀 Live Endpoint

```
POST https://bytespeed-fffv.onrender.com//identify
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | MongoDB (Atlas) |
| ODM | Mongoose |
| Hosting | Render |

---

## 📖 How It Works

FluxKart customers sometimes use different emails or phone numbers across purchases. This service reconciles those identities into a single consolidated contact.

### Logic

| Scenario | Behaviour |
|----------|-----------|
| No existing contact found | Creates a new **primary** contact |
| Match found, same info | Returns the existing consolidated contact |
| Match found, new email/phone | Creates a **secondary** contact linked to primary |
| Two separate primaries get linked | Older one stays **primary**, newer is demoted to **secondary** |

---

## 📁 Project Structure

```
src/
├── index.ts                  # App entry point
├── models/
│   └── Contact.ts            # Mongoose schema + auto-increment ID
├── services/
│   └── identityService.ts    # Core reconciliation logic
└── routes/
    └── identify.ts           # POST /identify route handler
```

---

## 🔌 API Reference

### `POST /identify`

**Request Body**

```json
{
  "email": "string (optional)",
  "phoneNumber": "string | number (optional)"
}
```

> At least one of `email` or `phoneNumber` must be provided.

**Response `200 OK`**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

- `emails[0]` and `phoneNumbers[0]` always belong to the **primary** contact
- `secondaryContactIds` lists all contacts linked under the primary

---

## 🧪 Example Scenarios

### 1. New customer
```json
{ "email": "lorraine@hillvalley.edu", "phoneNumber": "123456" }
```

### 2. Same phone, new email → creates secondary
```json
{ "email": "mcfly@hillvalley.edu", "phoneNumber": "123456" }
```

### 3. Two primaries get merged (older wins)
```json
// Existing primaries: george@... (phone 919191) and biffsucks@... (phone 717171)
{ "email": "george@hillvalley.edu", "phoneNumber": "717171" }
// → george stays primary, biffsucks becomes secondary
```

### 4. Lookup by email only
```json
{ "email": "mcfly@hillvalley.edu" }
```

### 5. Lookup by phone only
```json
{ "phoneNumber": "123456" }
```

---

## ⚙️ Running Locally

### Prerequisites
- Node.js v18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/harshvardhan5703/bitespeed.git
cd bitespeed

# 2. Install dependencies
npm install

# 3. Create .env file

# → Fill in your MONGO_URI

# 4. Start dev server
npm run dev
```

### Environment Variables

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bitespeed
PORT=3000
```

### Scripts

```bash
npm run dev      # Start with hot reload (ts-node-dev)
npm run build    # Compile TypeScript → dist/
npm start        # Run compiled output
```

---

## 🌐 Deployment (Render)

| Field | Value |
|-------|-------|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment Variable | `MONGO_URI` = your Atlas URI |

> **Note:** Free tier on Render spins down after 15 minutes of inactivity. The first request after that may take ~30 seconds to respond.

---

## 📊 Database Schema

```ts
Contact {
  numericId       Int               // auto-incremented
  phoneNumber     String?
  email           String?
  linkedId        Int?              // points to primary contact's numericId
  linkPrecedence  "primary" | "secondary"
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime?
}
```

---

## 👨‍💻 Author
Harshvardhan Singh
Built as part of the Bitespeed Backend Engineering Task.