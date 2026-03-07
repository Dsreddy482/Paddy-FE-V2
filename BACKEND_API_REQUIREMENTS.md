# Backend API Requirements for Enhanced Paddy Management System

This document outlines the new API endpoints that need to be implemented on the .NET backend to support the enhanced features in the frontend application.

## Base URL
All endpoints should be prefixed with the API base URL: `https://paddyapi-aheec7dvhtf7graj.canadacentral-01.azurewebsites.net/`

---

## 1. Farmer Payment APIs

### Endpoint: `/api/FarmerPayment`

#### POST - Create Farmer Payment
**Request Body:**
```json
{
  "farmerId": "string",
  "paddyEntryId": "string",
  "totalAmount": 0,
  "paidAmount": 0,
  "balanceAmount": 0,
  "paymentDate": "2024-01-01T00:00:00Z",
  "paymentMethod": "cash",
  "notes": "string"
}
```

**Response:** 200 OK with created FarmerPayment object

---

#### GET - Get Farmer Ledger
**Endpoint:** `/api/FarmerPayment/ledger/{farmerId}`

**Response:**
```json
{
  "farmerId": "string",
  "farmerName": "string",
  "totalBags": 0,
  "totalAmount": 0,
  "totalPaid": 0,
  "pendingBalance": 0,
  "payments": [
    {
      "id": "string",
      "farmerId": "string",
      "paddyEntryId": "string",
      "totalAmount": 0,
      "paidAmount": 0,
      "balanceAmount": 0,
      "paymentDate": "2024-01-01T00:00:00Z",
      "paymentMethod": "string",
      "notes": "string"
    }
  ]
}
```

---

#### GET - Get All Farmer Ledgers
**Endpoint:** `/api/FarmerPayment/ledgers`

**Response:** Array of FarmerLedger objects

---

## 2. Dealer Payment APIs

### Endpoint: `/api/DealerPayment`

#### POST - Create Dealer Payment
**Request Body:**
```json
{
  "dealerId": "string",
  "loadingId": "string",
  "totalAmount": 0,
  "receivedAmount": 0,
  "balanceAmount": 0,
  "paymentDate": "2024-01-01T00:00:00Z",
  "paymentMode": "cash",
  "notes": "string"
}
```

**Response:** 200 OK with created DealerPayment object

---

#### GET - Get Dealer Ledger
**Endpoint:** `/api/DealerPayment/ledger/{dealerId}`

**Response:**
```json
{
  "dealerId": "string",
  "dealerName": "string",
  "totalBags": 0,
  "totalAmount": 0,
  "totalReceived": 0,
  "pendingAmount": 0,
  "payments": [
    {
      "id": "string",
      "dealerId": "string",
      "loadingId": "string",
      "totalAmount": 0,
      "receivedAmount": 0,
      "balanceAmount": 0,
      "paymentDate": "2024-01-01T00:00:00Z",
      "paymentMode": "string",
      "notes": "string"
    }
  ]
}
```

---

#### GET - Get All Dealer Ledgers
**Endpoint:** `/api/DealerPayment/ledgers`

**Response:** Array of DealerLedger objects

---

## 3. Amali Payment APIs

### Endpoint: `/api/AmaliPayment`

#### POST - Create Amali Payment
**Request Body:**
```json
{
  "amaliId": "string",
  "loadingId": "string",
  "totalBags": 0,
  "ratePerBag": 0,
  "totalAmount": 0,
  "paidAmount": 0,
  "balanceAmount": 0,
  "paymentDate": "2024-01-01T00:00:00Z"
}
```

**Response:** 200 OK with created AmaliPayment object

---

#### GET - Get Amali Ledger
**Endpoint:** `/api/AmaliPayment/ledger/{amaliId}`

**Response:**
```json
{
  "amaliId": "string",
  "amaliName": "string",
  "totalBags": 0,
  "totalPayableAmount": 0,
  "totalPaid": 0,
  "pendingAmount": 0,
  "payments": [
    {
      "id": "string",
      "amaliId": "string",
      "loadingId": "string",
      "totalBags": 0,
      "ratePerBag": 0,
      "totalAmount": 0,
      "paidAmount": 0,
      "balanceAmount": 0,
      "paymentDate": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### GET - Get All Amali Ledgers
**Endpoint:** `/api/AmaliPayment/ledgers`

**Response:** Array of AmaliLedger objects

---

## 4. Commission Tracking APIs

### Endpoint: `/api/Commission`

#### GET - Get Commission Summary
**Endpoint:** `/api/Commission/summary`

**Response:**
```json
{
  "todayCommission": 0,
  "monthlyCommission": 0,
  "totalCommission": 0,
  "todayBags": 0,
  "monthlyBags": 0,
  "totalBags": 0,
  "transactions": [
    {
      "id": "string",
      "loadingId": "string",
      "paddyEntryId": "string",
      "totalBags": 0,
      "farmerPricePerBag": 0,
      "dealerPricePerBag": 0,
      "commissionPerBag": 0,
      "totalCommission": 0,
      "date": "2024-01-01T00:00:00Z",
      "lorryNumber": "string",
      "dealerName": "string",
      "farmerName": "string"
    }
  ]
}
```

---

#### GET - Get Commission Transactions
**Endpoint:** `/api/Commission/transactions?startDate={date}&endDate={date}`

**Query Parameters:**
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date

**Response:** Array of CommissionTransaction objects

---

#### GET - Get Today's Commission
**Endpoint:** `/api/Commission/today`

**Response:** Number representing today's commission amount

---

#### GET - Get Monthly Commission
**Endpoint:** `/api/Commission/monthly`

**Response:** Number representing current month's commission amount

---

## 5. Lorry Management APIs

### Endpoint: `/api/Lorry`

#### POST - Create Lorry
**Request Body:**
```json
{
  "lorryNumber": "string",
  "driverName": "string",
  "driverPhone": "string",
  "dealerId": "string"
}
```

**Response:** 200 OK with created Lorry object

---

#### PUT - Update Lorry
**Endpoint:** `/api/Lorry/{id}`

**Request Body:**
```json
{
  "lorryNumber": "string",
  "driverName": "string",
  "driverPhone": "string",
  "dealerId": "string"
}
```

**Response:** 200 OK with updated Lorry object

---

#### GET - Get All Lorries
**Endpoint:** `/api/Lorry`

**Response:**
```json
[
  {
    "id": "string",
    "lorryNumber": "string",
    "driverName": "string",
    "driverPhone": "string",
    "dealerId": "string",
    "dealerName": "string",
    "createdDate": "2024-01-01T00:00:00Z"
  }
]
```

---

#### GET - Get Lorry by ID
**Endpoint:** `/api/Lorry/{id}`

**Response:** Lorry object

---

#### GET - Get Lorry Statistics
**Endpoint:** `/api/Lorry/stats`

**Response:**
```json
[
  {
    "lorryId": "string",
    "lorryNumber": "string",
    "totalTrips": 0,
    "totalWeight": 0,
    "totalBags": 0,
    "driverName": "string",
    "driverPhone": "string"
  }
]
```

---

#### DELETE - Delete Lorry
**Endpoint:** `/api/Lorry/{id}`

**Response:** 204 No Content

---

## 6. Smart Reports APIs

### Endpoint: `/api/Reports`

#### GET - Get Daily Loading Report
**Endpoint:** `/api/Reports/daily-loading?startDate={date}&endDate={date}`

**Query Parameters:**
- `startDate` (required): Report start date
- `endDate` (required): Report end date

**Response:**
```json
[
  {
    "date": "2024-01-01T00:00:00Z",
    "lorryNumber": "string",
    "dealer": "string",
    "farmer": "string",
    "bags": 0,
    "weight": 0,
    "farmerAmount": 0,
    "dealerAmount": 0,
    "commission": 0
  }
]
```

---

#### GET - Get Monthly Report
**Endpoint:** `/api/Reports/monthly?month={month}&year={year}`

**Query Parameters:**
- `month` (required): Month name (e.g., "January")
- `year` (required): Year (e.g., "2024")

**Response:**
```json
{
  "month": "string",
  "totalBags": 0,
  "totalWeight": 0,
  "totalFarmerPayment": 0,
  "totalDealerCollection": 0,
  "totalCommission": 0,
  "totalAmaliPayment": 0,
  "netProfit": 0
}
```

---

#### POST - Export Report to PDF
**Endpoint:** `/api/Reports/export-pdf`

**Request Body:**
```json
{
  "reportData": {},
  "reportType": "string"
}
```

**Response:** Binary PDF file (Content-Type: application/pdf)

---

#### POST - Export Report to Excel
**Endpoint:** `/api/Reports/export-excel`

**Request Body:**
```json
{
  "reportData": {},
  "reportType": "string"
}
```

**Response:** Binary Excel file (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## 7. User APIs (New Endpoints)

### Endpoint: `/users/farmers`
**Method:** GET
**Response:** Array of users with role "farmer"
```json
[
  {
    "id": "string",
    "name": "string"
  }
]
```

---

### Endpoint: `/users/dealers`
**Method:** GET
**Response:** Array of users with role "dealer"
```json
[
  {
    "id": "string",
    "name": "string"
  }
]
```

---

### Endpoint: `/users/amali`
**Method:** GET
**Response:** Array of users with role "amali"
```json
[
  {
    "id": "string",
    "name": "string"
  }
]
```

---

## 8. Enhanced Paddy Entry Fields

The existing PaddyEntry model needs to be extended with the following fields:

```csharp
public class PaddyEntry
{
    // ... existing fields ...

    // New fields for commission tracking
    public decimal? FarmerPricePerBag { get; set; }
    public decimal? CommissionPerBag { get; set; }
    public decimal? TotalCommission { get; set; }
}
```

**Calculation Logic:**
- `CommissionPerBag = DealerBagAmount - BagAmount` (FarmerPricePerBag)
- `TotalCommission = CommissionPerBag * Bags`

---

## Database Schema

### New Tables Required

#### 1. FarmerPayments
```sql
CREATE TABLE FarmerPayments (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    FarmerId NVARCHAR(450) NOT NULL,
    PaddyEntryId NVARCHAR(450) NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    PaidAmount DECIMAL(18,2) NOT NULL,
    BalanceAmount DECIMAL(18,2) NOT NULL,
    PaymentDate DATETIME2 NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME2 DEFAULT GETDATE()
);
```

#### 2. DealerPayments
```sql
CREATE TABLE DealerPayments (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    DealerId NVARCHAR(450) NOT NULL,
    LoadingId NVARCHAR(450) NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    ReceivedAmount DECIMAL(18,2) NOT NULL,
    BalanceAmount DECIMAL(18,2) NOT NULL,
    PaymentDate DATETIME2 NOT NULL,
    PaymentMode NVARCHAR(50) NOT NULL,
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME2 DEFAULT GETDATE()
);
```

#### 3. AmaliPayments
```sql
CREATE TABLE AmaliPayments (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    AmaliId NVARCHAR(450) NOT NULL,
    LoadingId NVARCHAR(450) NOT NULL,
    TotalBags INT NOT NULL,
    RatePerBag DECIMAL(18,2) NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    PaidAmount DECIMAL(18,2) NOT NULL,
    BalanceAmount DECIMAL(18,2) NOT NULL,
    PaymentDate DATETIME2,
    CreatedDate DATETIME2 DEFAULT GETDATE()
);
```

#### 4. Lorries
```sql
CREATE TABLE Lorries (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    LorryNumber NVARCHAR(50) NOT NULL UNIQUE,
    DriverName NVARCHAR(200) NOT NULL,
    DriverPhone NVARCHAR(20) NOT NULL,
    DealerId NVARCHAR(450),
    CreatedDate DATETIME2 DEFAULT GETDATE()
);
```

#### 5. CommissionTransactions
```sql
CREATE TABLE CommissionTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    LoadingId NVARCHAR(450) NOT NULL,
    PaddyEntryId NVARCHAR(450),
    TotalBags INT NOT NULL,
    FarmerPricePerBag DECIMAL(18,2) NOT NULL,
    DealerPricePerBag DECIMAL(18,2) NOT NULL,
    CommissionPerBag DECIMAL(18,2) NOT NULL,
    TotalCommission DECIMAL(18,2) NOT NULL,
    Date DATETIME2 NOT NULL,
    LorryNumber NVARCHAR(50),
    DealerName NVARCHAR(200),
    FarmerName NVARCHAR(200)
);
```

---

## Validation Rules

### All Payment APIs:
- Amounts must be >= 0
- Paid/Received amounts cannot exceed total amounts
- Balance amounts must be calculated correctly: `BalanceAmount = TotalAmount - PaidAmount/ReceivedAmount`
- Payment dates cannot be in the future

### Lorry Management:
- Lorry number must be unique
- Driver phone must be valid format
- Driver name and lorry number are required fields

### Commission Tracking:
- Commission per bag must be calculated as: `DealerPricePerBag - FarmerPricePerBag`
- Commission cannot be negative
- Total commission = `CommissionPerBag * Bags`

---

## Notes for Backend Implementation

1. **Transaction Management**: All payment operations should be wrapped in database transactions to ensure data consistency.

2. **Ledger Calculations**: Ledger endpoints should aggregate data from multiple tables:
   - Farmer Ledger: Aggregate all paddy entries for a farmer + all farmer payments
   - Dealer Ledger: Aggregate all loading/paddy entries for a dealer + all dealer payments
   - Amali Ledger: Aggregate all loading entries for an amali + all amali payments

3. **Commission Auto-calculation**: When a paddy entry is created or updated with both farmer and dealer prices, automatically calculate and store commission data.

4. **Report Generation**: Daily and monthly reports should aggregate data efficiently using database queries. Consider adding database indexes on date fields for better performance.

5. **Authorization**: All endpoints should require authentication. Consider implementing role-based access control where appropriate.

6. **Error Handling**: Implement proper error handling and return appropriate HTTP status codes with meaningful error messages.

7. **Audit Trail**: Consider adding audit fields (CreatedBy, ModifiedBy, ModifiedDate) to all new tables for tracking purposes.

---

## Testing Checklist

- [ ] All payment CRUD operations work correctly
- [ ] Ledger calculations are accurate
- [ ] Commission calculations are correct
- [ ] Reports generate accurate data
- [ ] Lorry statistics are calculated properly
- [ ] Validation rules are enforced
- [ ] Error handling works as expected
- [ ] Authentication/Authorization is enforced
- [ ] Database transactions maintain data integrity
