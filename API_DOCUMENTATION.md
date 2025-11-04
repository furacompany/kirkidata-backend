# KirkiData Backend API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Migration from OTOBill to Aychindodata](#migration-from-otobill-to-aychindodata)
3. [Setup & Configuration](#setup--configuration)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
   - [Admin APIs](#admin-apis)
   - [User APIs](#user-apis)
6. [Request/Response Examples](#requestresponse-examples)
7. [Error Handling](#error-handling)
8. [Data Models](#data-models)

---

## Overview

KirkiData Backend is a digital services platform that allows users to purchase airtime and data bundles through the Aychindodata API. The system includes:

### Authentication System

**Two Separate Token Systems:**

1. **Your System JWT Tokens** (For API Access):
   - Used in Postman/API clients
   - Get from: `/auth/admin/login` or `/auth/login`
   - Header: `Authorization: Bearer {jwt-token}`
   - Expires: 1 day (configurable)

2. **Aychindodata API Token** (For Aychindodata API):
   - Used internally by backend
   - Get from: Aychindodata dashboard OR use username/password
   - Location: `.env` file as `AYCHINDODATA_TOKEN`
   - Expires: Never (if static token) OR dynamically generated

**See `TOKEN_USAGE_GUIDE.md` for detailed explanation.**

- **User Management**: Registration, authentication, wallet management
- **Airtime Purchases**: Purchase airtime for MTN, AIRTEL, GLO, and 9MOBILE
- **Data Purchases**: Purchase data plans across all networks
- **Admin Management**: Manual data plan management, pricing control, transaction monitoring
- **Virtual Accounts**: PalmPay virtual account integration for wallet funding

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

---

## Migration from OTOBill to Aychindodata

This implementation replaces OTOBill API integration with Aychindodata API. Key changes:

### What Changed
- ✅ API provider switched from OTOBill to Aychindodata
- ✅ Data plans are now manually managed by admins (no automatic sync)
- ✅ Network IDs: MTN=1, AIRTEL=2, GLO=3, 9MOBILE=4
- ✅ Authentication uses Basic Auth (username:password) to get access token
- ✅ Transaction metadata updated to store Aychindodata response structure

### Database Changes
- `DataPlan` model: `otobillId` → `aychindodataId` (numeric), added `dataSize` field
- `Airtime` model: Removed `lastSynced` field
- `Transaction` model: Added Aychindodata metadata fields (kept OTOBill fields for backward compatibility)

### Deprecated Files
All OTOBill-related files are marked as deprecated but kept for reference:
- `src/configs/otobill.ts`
- `src/services/otobill.service.ts`
- `src/controllers/otobill.controller.ts`
- `src/routes/otobill.routes.ts`

---

## Setup & Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/kirkidata

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-64-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production-minimum-64-characters-long

# Aychindodata API Configuration
AYCHINDODATA_BASE_URL=https://aychindodata.com/api

# Option 1: Use static token from dashboard (Recommended)
# Get this from Aychindodata dashboard → Pricing section
AYCHINDODATA_TOKEN=660096530e40260b8a0cd4fcd7f0c67f22e017718e80ffcfca8996cc31cb

# Option 2: Use username/password (Alternative)
# AYCHINDODATA_USERNAME=your-aychindodata-username
# AYCHINDODATA_PASSWORD=your-aychindodata-password

# Note: If AYCHINDODATA_TOKEN is set, it will be used. Otherwise, username/password will be used.
```

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

---

## Authentication

### User Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "08123456789",
  "password": "password123",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "wallet": 0,
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Admin Authentication

#### Login Admin
```http
POST /api/v1/auth/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

### Using Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry:**
- User tokens: 1 day
- Admin tokens: 1 day (configurable via `JWT_ADMIN_ACCESS_TOKEN_EXPIRY` in `.env`)

---

## API Endpoints

## Admin APIs

### Aychindodata Management

#### Get User Info & Wallet Balance
```http
GET /api/v1/aychindodata/user
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Aychindodata user info retrieved successfully",
  "data": {
    "status": "success",
    "AccessToken": "660096530e40260b8a0cd4fcd7f0c67f22e017718e80ffcfca8996cc31cb",
    "balance": "570.00",
    "username": "Danmalam"
  }
}
```

#### Get Networks
```http
GET /api/v1/aychindodata/networks
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Networks retrieved successfully",
  "data": [
    { "id": "MTN", "name": "MTN", "status": "On", "isActive": true },
    { "id": "AIRTEL", "name": "AIRTEL", "status": "On", "isActive": true },
    { "id": "GLO", "name": "GLO", "status": "On", "isActive": true },
    { "id": "9MOBILE", "name": "9MOBILE", "status": "On", "isActive": true }
  ]
}
```

#### Health Check
```http
GET /api/v1/aychindodata/health
```

### Data Plan Management

#### Create Data Plan
```http
POST /api/v1/data-plans
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "MTN 1GB Data Plan",
  "networkName": "MTN",
  "planType": "GIFTING",
  "dataSize": "1GB",
  "validityDays": 30,
  "aychindodataId": 55,
  "originalPrice": 450,
  "adminPrice": 490,
  "planId": "MTN_1GB_GIFTING",
  "isActive": true
}
```

**Field Descriptions:**
- `name`: Display name of the plan
- `networkName`: One of "MTN", "AIRTEL", "GLO", "9MOBILE"
- `planType`: Plan type (e.g., "GIFTING", "SME", "COOPERATE GIFTING")
- `dataSize`: Data size in format "1GB", "500MB", "2.5GB"
- `validityDays`: Number of days the plan is valid
- `aychindodataId`: **Required** - Numeric plan ID from Aychindodata (must be unique)
- `originalPrice`: Original price from Aychindodata (optional)
- `adminPrice`: **Required** - Price to charge users
- `planId`: Optional string identifier for reference
- `isActive`: Whether plan is active (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Data plan created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "MTN 1GB Data Plan",
    "networkName": "MTN",
    "planType": "GIFTING",
    "dataSize": "1GB",
    "validityDays": 30,
    "aychindodataId": 55,
    "adminPrice": 490,
    "profit": 40,
    "isActive": true
  }
}
```

#### Get All Data Plans
```http
GET /api/v1/data-plans?networkName=MTN&planType=GIFTING&isActive=true&page=1&limit=20
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `networkName` (optional): Filter by network
- `planType` (optional): Filter by plan type
- `isActive` (optional): Filter by active status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### Get Data Plan by ID
```http
GET /api/v1/data-plans/:id
Authorization: Bearer {adminToken}
```

#### Update Data Plan
```http
PATCH /api/v1/data-plans/:id
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "adminPrice": 500,
  "isActive": true
}
```

**Note:** All fields are optional in update. Only provide fields you want to change.

#### Delete Data Plan
```http
DELETE /api/v1/data-plans/:id
Authorization: Bearer {adminToken}
```

**Note:** This performs a soft delete (sets `isActive` to false).

#### Get Plan Types by Network
```http
GET /api/v1/data-plans/network/:networkName/types
Authorization: Bearer {adminToken}
```

#### Get Plans by Network and Type
```http
GET /api/v1/data-plans/network/:networkName/type/:planType?page=1&limit=20
Authorization: Bearer {adminToken}
```

---

## User APIs

### Browse Networks & Plans

#### Get Available Networks
```http
GET /api/v1/purchases/networks
Authorization: Bearer {userToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Networks retrieved successfully",
  "data": [
    {
      "id": "...",
      "name": "MTN",
      "status": "On",
      "isActive": true,
      "airtimeMarkup": 0
    }
  ]
}
```

#### Get Data Plan Categories
```http
GET /api/v1/purchases/data-plans/network/:networkName/categories
Authorization: Bearer {userToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Data plan categories retrieved successfully",
  "data": ["GIFTING", "SME", "COOPERATE GIFTING"]
}
```

#### Get Data Plans
```http
GET /api/v1/purchases/data-plans/network/:networkName?planType=GIFTING&page=1&limit=20&sortBy=price&sortOrder=asc
Authorization: Bearer {userToken}
```

**Query Parameters:**
- `planType` (optional): Filter by plan type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field - "price", "validity", or "name" (default: "price")
- `sortOrder` (optional): "asc" or "desc" (default: "asc")

**Response:**
```json
{
  "success": true,
  "message": "Data plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": "507f1f77bcf86cd799439011",
        "aychindodataId": 55,
        "name": "MTN 1GB Data Plan",
        "networkName": "MTN",
        "planType": "GIFTING",
        "dataSize": "1GB",
        "validityDays": 30,
        "price": 490,
        "formattedPrice": "₦490",
        "description": "MTN 1GB Data Plan - 30 days validity"
      }
    ],
    "total": 10,
    "page": 1,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Get Data Plans by Category
```http
GET /api/v1/purchases/data-plans/network/:networkName/category/:planType?page=1&limit=20&sortBy=price&sortOrder=asc
Authorization: Bearer {userToken}
```

#### Get Airtime Pricing
```http
GET /api/v1/purchases/airtime/pricing
Authorization: Bearer {userToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Airtime pricing retrieved successfully",
  "data": [
    {
      "networkName": "MTN",
      "markup": 0,
      "formattedMarkup": "₦0",
      "note": "No additional charges"
    }
  ]
}
```

### Purchase Operations

#### Buy Airtime
```http
POST /api/v1/purchases/airtime
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "networkName": "MTN",
  "phoneNumber": "08123456789",
  "amount": 100
}
```

**Field Descriptions:**
- `networkName`: Must be one of "MTN", "AIRTEL", "GLO", "9MOBILE"
- `phoneNumber`: 11-digit Nigerian phone number (must start with 0)
- `amount`: Amount in NGN (min: 50, max: 50000)

**Response:**
```json
{
  "success": true,
  "message": "Airtime purchase initiated successfully",
  "data": {
    "transactionId": "507f1f77bcf86cd799439011",
    "reference": "Airtime_1234567890_abc123",
    "amount": 100,
    "markup": 0,
    "totalCost": 100,
    "actualCost": 97,
    "discount": 3,
    "profit": 3,
    "status": "completed",
    "networkName": "MTN",
    "phoneNumber": "08123456789",
    "requestId": "Airtime_1234567890_abc123",
    "message": "successfully purchase MTN VTU to 08123456789, ₦100"
  }
}
```

#### Buy Data
```http
POST /api/v1/purchases/data
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "planId": "507f1f77bcf86cd799439011",
  "phoneNumber": "08123456789"
}
```

**Field Descriptions:**
- `planId`: MongoDB `_id` of the data plan OR the `aychindodataId` (as string)
- `phoneNumber`: 11-digit Nigerian phone number (must start with 0)

**Note:** You can also use `aychindodataId` directly:
```json
{
  "aychindodataId": 55,
  "phoneNumber": "08123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data purchase initiated successfully",
  "data": {
    "transactionId": "507f1f77bcf86cd799439011",
    "reference": "Data_1234567890_abc123",
    "amount": 490,
    "profit": 40,
    "status": "completed",
    "networkName": "MTN",
    "phoneNumber": "08123456789",
    "planId": "MTN_1GB_GIFTING",
    "planName": "MTN 1GB Data Plan",
    "dataSize": "1GB",
    "requestId": "Data_1234567890_abc123",
    "message": "Yello! You have gifted 1GB to 2348123456789..."
  }
}
```

### Transaction Management

#### Get User Transactions
```http
GET /api/v1/purchases/transactions?page=1&limit=10&type=all&status=all
Authorization: Bearer {userToken}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by type - "airtime", "data", "funding", "debit", or "all" (default: "all")
- `status` (optional): Filter by status - "pending", "completed", "failed", "cancelled", or "all" (default: "all")

**Response:**
```json
{
  "success": true,
  "message": "User transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "...",
        "type": "airtime",
        "amount": 100,
        "currency": "NGN",
        "status": "completed",
        "reference": "Airtime_1234567890_abc123",
        "description": "MTN airtime purchase for 08123456789",
        "networkName": "MTN",
        "phoneNumber": "08123456789",
        "profit": 3,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Check Transaction Status
```http
GET /api/v1/purchases/transactions/:transactionId/status
Authorization: Bearer {userToken}
```

**Note:** Aychindodata doesn't provide a transaction status check endpoint. This returns the current status from the database.

---

## Request/Response Examples

### Complete Purchase Flow

#### Step 1: User Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

#### Step 2: Browse Data Plans
```bash
curl -X GET "http://localhost:5000/api/v1/purchases/data-plans/network/MTN?planType=GIFTING" \
  -H "Authorization: Bearer {userToken}"
```

#### Step 3: Purchase Data
```bash
curl -X POST http://localhost:5000/api/v1/purchases/data \
  -H "Authorization: Bearer {userToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "507f1f77bcf86cd799439011",
    "phoneNumber": "08123456789"
  }'
```

### Complete Admin Flow

#### Step 1: Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword"
  }'
```

#### Step 2: Create Data Plan
```bash
curl -X POST http://localhost:5000/api/v1/data-plans \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MTN 1GB Data Plan",
    "networkName": "MTN",
    "planType": "GIFTING",
    "dataSize": "1GB",
    "validityDays": 30,
    "aychindodataId": 55,
    "originalPrice": 450,
    "adminPrice": 490,
    "isActive": true
  }'
```

#### Step 3: Check Aychindodata Wallet
```bash
curl -X GET http://localhost:5000/api/v1/aychindodata/user \
  -H "Authorization: Bearer {adminToken}"
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed: networkName - Network name must be one of: MTN, AIRTEL, GLO, 9MOBILE",
  "validationErrors": [
    {
      "field": "networkName",
      "message": "Network name must be one of: MTN, AIRTEL, GLO, 9MOBILE"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `500 Internal Server Error`: Server error

### Common Error Scenarios

#### Insufficient Balance
```json
{
  "success": false,
  "message": "Insufficient balance. Required: ₦490, Available: ₦100"
}
```

#### Invalid Network Name
```json
{
  "success": false,
  "message": "Invalid network name: INVALID. Must be one of: MTN, AIRTEL, GLO, 9MOBILE"
}
```

#### Data Plan Not Found
```json
{
  "success": false,
  "message": "Data plan not found"
}
```

#### Aychindodata API Error
```json
{
  "success": false,
  "message": "Airtime purchase failed. Your wallet has been refunded.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Note:** If a purchase fails, the user's wallet is automatically refunded.

---

## Data Models

### Data Plan Model

```typescript
{
  _id: ObjectId,
  customId: string,              // Auto-generated unique ID
  aychindodataId: number,        // REQUIRED: Numeric plan ID from Aychindodata
  planId: string,                // Optional: String identifier
  name: string,                  // Display name
  networkName: string,           // MTN, AIRTEL, GLO, 9MOBILE
  planType: string,              // GIFTING, SME, COOPERATE GIFTING
  dataSize: string,              // e.g., "1GB", "500MB"
  validityDays: number,          // Days the plan is valid
  originalPrice?: number,        // Original price from Aychindodata
  adminPrice: number,            // Price to charge users
  isActive: boolean,             // Whether plan is active
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  type: "funding" | "airtime" | "data" | "debit",
  amount: number,
  currency: string,              // "NGN"
  status: "pending" | "completed" | "failed" | "cancelled",
  reference: string,             // Unique transaction reference
  networkName?: string,          // For airtime/data
  phoneNumber?: string,           // For airtime/data
  planId?: string,                // For data transactions
  planName?: string,              // For data transactions
  profit?: number,
  metadata: {
    // Aychindodata specific
    aychindodataRequestId?: string,
    aychindodataStatus?: string,
    aychindodataResponse?: any,
    actualAychindodataCost?: number,
    oldBalance?: string,
    newBalance?: number,
    dataplan?: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Network Mapping

Aychindodata uses numeric IDs for networks:

| Network Name | Network ID |
|-------------|------------|
| MTN         | 1          |
| AIRTEL      | 2          |
| GLO         | 3          |
| 9MOBILE     | 4          |

The system automatically maps network names to IDs when making API calls.

---

## Important Notes

### Data Plan Management

1. **Admin Responsibility**: Admins must manually add data plans. There is no automatic sync from Aychindodata.
2. **Aychindodata ID**: The `aychindodataId` field is **required** and must be unique. Get this from Aychindodata documentation or dashboard.
3. **Pricing**: Set `adminPrice` to the price you want to charge users. `originalPrice` is optional for reference.
4. **Soft Delete**: Deleting a plan sets `isActive` to false but doesn't remove the record.

### Purchase Flow

1. **Wallet Check**: System checks user wallet balance before purchase
2. **Deduction**: Wallet is deducted immediately
3. **API Call**: Aychindodata API is called
4. **Refund**: If API call fails, wallet is automatically refunded
5. **Transaction Record**: All transactions are logged with full metadata

### Airtime Purchase

- Amount range: ₦50 - ₦50,000
- Discount is applied by Aychindodata
- Profit = (user paid amount) - (actual Aychindodata cost after discount)

### Data Purchase

- User can provide either `planId` (MongoDB _id) or `aychindodataId`
- System automatically finds the plan
- Profit = (adminPrice) - (actual Aychindodata cost)

---

## Testing

### Using Postman

1. Import the provided `KirkiData_API_Collection.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:5000/api/v1`
   - `userToken`: Get from login response
   - `adminToken`: Get from admin login response
3. Start testing endpoints

### Health Checks

```bash
# General health
GET /api/v1/health

# Aychindodata health
GET /api/v1/aychindodata/health

# Purchase service health
GET /api/v1/purchases/health
```

---

## Support

For issues or questions:
- Check error messages in API responses
- Review transaction metadata for detailed error information
- Ensure Aychindodata credentials are correctly configured
- Verify network names match exactly (case-sensitive)

---

**Last Updated:** January 2024  
**API Version:** v1

