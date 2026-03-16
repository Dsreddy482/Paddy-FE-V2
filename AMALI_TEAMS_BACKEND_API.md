# Amali Teams Backend API Documentation

## Overview
This document describes the backend API endpoints required to support the Amali Teams feature. This feature allows tracking of different loading teams (Potha, Kata, Loading, Combined) and their rates per bag for each loading entry.

## Database Schema

### AmaliTeams Table
```sql
CREATE TABLE AmaliTeams (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LoadingId INT NOT NULL,
    AmaliTeamName NVARCHAR(100) NOT NULL,
    LoadingType NVARCHAR(50) NOT NULL, -- 'potha', 'kata', 'loading', or 'combined'
    RatePerBag DECIMAL(18,2) NOT NULL,
    TotalBags INT DEFAULT 0,
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (LoadingId) REFERENCES LoadingDetails(Id) ON DELETE CASCADE
);

CREATE INDEX IX_AmaliTeams_LoadingId ON AmaliTeams(LoadingId);
CREATE INDEX IX_AmaliTeams_LoadingType ON AmaliTeams(LoadingType);
```

## API Endpoints

### 1. Get Amali Teams by Loading ID
**Endpoint:** `/Account/getAmaliTeamsByLoading`
**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "loadingId": 123
}
```

**Response:**
```json
[
  {
    "id": 1,
    "loadingId": 123,
    "amaliTeamName": "Team A",
    "loadingType": "potha",
    "ratePerBag": 25.50,
    "totalBags": 100,
    "totalAmount": 2550.00,
    "createdAt": "2024-03-16T10:30:00",
    "updatedAt": "2024-03-16T10:30:00"
  },
  {
    "id": 2,
    "loadingId": 123,
    "amaliTeamName": "Team B",
    "loadingType": "kata",
    "ratePerBag": 30.00,
    "totalBags": 100,
    "totalAmount": 3000.00,
    "createdAt": "2024-03-16T10:30:00",
    "updatedAt": "2024-03-16T10:30:00"
  }
]
```

**Business Logic:**
- Retrieve all amali teams associated with the given loading ID
- Calculate totalAmount as totalBags * ratePerBag (if not already stored)
- Order by createdAt descending

---

### 2. Get All Amali Teams
**Endpoint:** `/Account/getAllAmaliTeams`
**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{}
```

**Response:**
```json
[
  {
    "id": 1,
    "loadingId": 123,
    "amaliTeamName": "Team A",
    "loadingType": "potha",
    "ratePerBag": 25.50,
    "totalBags": 100,
    "totalAmount": 2550.00,
    "loadedDate": "2024-03-16",
    "lorryNumber": "TN01AB1234",
    "dealerName": "Dealer 1",
    "amaliName": "Amali 1",
    "createdAt": "2024-03-16T10:30:00",
    "updatedAt": "2024-03-16T10:30:00"
  }
]
```

**Business Logic:**
- Retrieve all amali teams with JOIN to LoadingDetails table to include loading information
- Include: loadedDate, lorryNumber, dealerName, amaliName from LoadingDetails
- Order by createdAt descending

---

### 3. Get Amali Teams by Amali ID
**Endpoint:** `/Account/getAmaliTeamsByAmali`
**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "amaliId": "amali-user-id-123"
}
```

**Response:**
```json
[
  {
    "id": 1,
    "loadingId": 123,
    "amaliTeamName": "Team A",
    "loadingType": "potha",
    "ratePerBag": 25.50,
    "totalBags": 100,
    "totalAmount": 2550.00,
    "loadedDate": "2024-03-16",
    "lorryNumber": "TN01AB1234",
    "dealerName": "Dealer 1",
    "amaliName": "Amali 1",
    "createdAt": "2024-03-16T10:30:00",
    "updatedAt": "2024-03-16T10:30:00"
  }
]
```

**Business Logic:**
- JOIN AmaliTeams with LoadingDetails where LoadingDetails.AmaliId = provided amaliId
- Include loading information in response
- Order by createdAt descending

---

### 4. Insert Amali Team
**Endpoint:** `/Account/insertAmaliTeam`
**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "loadingId": 123,
  "amaliTeamName": "Team A",
  "loadingType": "potha",
  "ratePerBag": 25.50
}
```

**Response:**
```json
{
  "id": 1,
  "loadingId": 123,
  "amaliTeamName": "Team A",
  "loadingType": "potha",
  "ratePerBag": 25.50,
  "totalBags": 0,
  "totalAmount": 0,
  "createdAt": "2024-03-16T10:30:00",
  "updatedAt": "2024-03-16T10:30:00"
}
```

**Business Logic:**
- Validate that loadingId exists in LoadingDetails table
- Validate loadingType is one of: 'potha', 'kata', 'loading', 'combined'
- Initialize totalBags and totalAmount to 0
- Set createdAt and updatedAt to current timestamp
- Return the created record with generated ID

**Validation Rules:**
- loadingId: Required, must exist in LoadingDetails
- amaliTeamName: Required, max 100 characters
- loadingType: Required, must be one of the valid types
- ratePerBag: Required, must be >= 0

---

### 5. Update Amali Team
**Endpoint:** `/Account/updateAmaliTeam`
**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "id": 1,
  "loadingId": 123,
  "amaliTeamName": "Team A Updated",
  "loadingType": "potha",
  "ratePerBag": 28.00,
  "totalBags": 150,
  "totalAmount": 4200.00
}
```

**Response:**
```json
{
  "id": 1,
  "loadingId": 123,
  "amaliTeamName": "Team A Updated",
  "loadingType": "potha",
  "ratePerBag": 28.00,
  "totalBags": 150,
  "totalAmount": 4200.00,
  "createdAt": "2024-03-16T10:30:00",
  "updatedAt": "2024-03-16T11:45:00"
}
```

**Business Logic:**
- Validate that the record with given ID exists
- Update all provided fields
- Recalculate totalAmount = totalBags * ratePerBag (if totalBags changed)
- Update updatedAt to current timestamp
- Return the updated record

**Validation Rules:**
- id: Required, must exist in AmaliTeams
- All other validation rules same as insert

---

### 6. Delete Amali Team
**Endpoint:** `/Account/deleteAmaliTeam`
**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Amali team deleted successfully"
}
```

**Business Logic:**
- Validate that the record exists
- Delete the record from AmaliTeams table
- Return success response

**Error Response:**
```json
{
  "success": false,
  "message": "Amali team not found"
}
```

---

## Integration with Existing Features

### 1. Amali Ledger Updates
The `/Account/getAllAmaliLedgers` endpoint should be updated to include amali team statistics:

**Updated Response:**
```json
{
  "amaliId": "user-id-123",
  "amaliName": "Amali 1",
  "totalBags": 500,
  "totalLoadings": 10,
  "totalAmaliTeams": 25,
  "totalPayableAmount": 125000.00,
  "totalPaid": 75000.00,
  "pendingAmount": 50000.00,
  "payments": [...]
}
```

**Additional Fields:**
- `totalLoadings`: Count of distinct loading IDs for this amali
- `totalAmaliTeams`: Count of amali team records for this amali

**Query Logic:**
```sql
SELECT
    u.UserId as amaliId,
    u.UserName as amaliName,
    SUM(ld.TotalNoOfBags) as totalBags,
    COUNT(DISTINCT ld.Id) as totalLoadings,
    COUNT(at.Id) as totalAmaliTeams,
    SUM(at.TotalAmount) as totalPayableAmount,
    SUM(COALESCE(ap.PaidAmount, 0)) as totalPaid,
    (SUM(at.TotalAmount) - SUM(COALESCE(ap.PaidAmount, 0))) as pendingAmount
FROM Users u
LEFT JOIN LoadingDetails ld ON u.UserId = ld.AmaliId
LEFT JOIN AmaliTeams at ON ld.Id = at.LoadingId
LEFT JOIN AmaliPayments ap ON u.UserId = ap.AmaliId
WHERE u.UserRole = 'amali'
GROUP BY u.UserId, u.UserName
```

### 2. Calculation When Paddy Entry is Added/Updated
When a paddy entry is added or updated, automatically update the `totalBags` and `totalAmount` for all related amali teams:

**Trigger Logic:**
```sql
-- When paddy entry is inserted or updated
-- Get the loading ID from the paddy entry
-- Update all amali teams for that loading

UPDATE AmaliTeams
SET
    TotalBags = (SELECT SUM(Bags) FROM PaddyEntry WHERE LoadingId = @LoadingId),
    TotalAmount = TotalBags * RatePerBag,
    UpdatedAt = GETDATE()
WHERE LoadingId = @LoadingId;
```

This can be implemented as:
1. Database trigger (recommended)
2. Stored procedure called after paddy entry insert/update
3. Application logic in the paddy entry service

---

## Available Team Names
The frontend uses the following team names in a dropdown:
- Team A
- Team B
- Team C
- Team D
- Team E
- Team F
- Team G
- Team H

**Note:** These are not stored in the database. They are managed on the frontend for simplicity.

---

## Loading Types
Valid loading type values:
- `potha`: Potha loading
- `kata`: Kata loading
- `loading`: Regular loading
- `combined`: Combined operations

---

## Error Handling
All endpoints should return appropriate HTTP status codes and error messages:

**Success Response:**
- Status: 200 OK
- Body: JSON with requested data

**Error Responses:**
- 400 Bad Request: Invalid input data
- 404 Not Found: Record not found
- 500 Internal Server Error: Server-side error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description here",
  "errors": [
    "Specific error 1",
    "Specific error 2"
  ]
}
```

---

## Notes for Backend Implementation

1. **Transaction Management**: Ensure all database operations use transactions where appropriate, especially when updating multiple tables.

2. **Cascade Deletes**: When a loading entry is deleted, all associated amali teams should be automatically deleted (handled by FK constraint).

3. **Concurrency**: Consider implementing optimistic locking using the `UpdatedAt` field to handle concurrent updates.

4. **Performance**: Add appropriate indexes on frequently queried columns (LoadingId, LoadingType).

5. **Audit Trail**: Consider adding CreatedBy and UpdatedBy fields to track which user made changes.

6. **Decimal Precision**: Use DECIMAL(18,2) for all monetary values and rates to ensure precision.

7. **Validation**: Implement server-side validation for all inputs to prevent invalid data entry.

8. **Authorization**: Ensure proper authorization checks - only authorized users should be able to manage amali teams.
