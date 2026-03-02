# User Collection Tracking - Implementation Summary

## Overview
The system already tracks **amounts collected from users** when inventory items are removed/allocated. This document explains the complete implementation.

---

## ✅ Frontend Implementation (COMPLETE)

### Key Features
1. **User Selection Required**: When removing stock, you MUST select which user to collect from
2. **Amount Tracking**: System tracks both the selling price per unit and total amount collected
3. **Investment vs Collection**: Separates investment (stock-in) from collection (stock-out)
4. **Per-Transaction Detail**: Each transaction records the specific user and amount

### How It Works

#### Stock Removal Flow
1. Open stock transaction modal
2. Select "Remove" transaction type
3. Enter quantity to remove
4. Enter selling price per unit (defaults to item's standard selling price)
5. **Select user** to collect from (mandatory)
6. System calculates total collection amount
7. Transaction is saved with user ID and collection amount

#### Data Tracked Per Transaction
- **User ID**: Who the amount was collected from
- **Amount Per Unit**: Price charged to the user
- **Total Amount**: Quantity × Amount Per Unit
- **Transaction Date**: When the collection occurred
- **Reference Number**: Optional invoice/receipt number
- **Notes**: Additional details

### User Interface

**Stock Transaction Modal** (`src/components/StockTransactionModal.tsx`):
- Line 50-53: Validates user selection is required for removals
- Line 205-238: User selection interface
- Line 240-248: Total collection amount display
- Line 73: Passes `collection_from_user_id` to backend

**Transaction History Modal** (`src/components/StockHistoryModal.tsx`):
- Shows which user each collection was from
- Displays amount collected per transaction
- Lists all transactions with user details

---

## 📊 Data Flow

### Frontend → Backend (Stock Removal)
```typescript
{
  inventory_item_id: "item-guid",
  transaction_type: "removal",
  quantity: 20,
  amount_per_unit: 75.00,
  total_amount: 1500.00,
  collection_from_user_id: "user-guid",  // ← USER TRACKING
  reference_number: "INV-001",
  notes: "Allocated to user",
  transaction_date: "2026-03-02T10:00:00Z"
}
```

### Backend Response Expected
```json
{
  "Id": "transaction-guid",
  "InventoryItemId": "item-guid",
  "TransactionType": "out",
  "Quantity": 20,
  "AmountPerUnit": 75.00,
  "TotalAmount": 1500.00,
  "CollectionFromUserId": "user-guid",  // ← USER TRACKING
  "ReferenceNumber": "INV-001",
  "Notes": "Allocated to user",
  "TransactionDate": "2026-03-02T10:00:00Z",
  "ItemName": "Urea Fertilizer",
  "ItemCode": "FERT-001"
}
```

---

## 🔧 Backend Requirements

### Database Schema

**inventory_stock_transactions table** needs:
```sql
-- User tracking column
collection_from_user_id NVARCHAR(450) NULL

-- Financial tracking columns
amount_per_unit DECIMAL(18,2) DEFAULT 0
total_amount DECIMAL(18,2) DEFAULT 0

-- Foreign key to users table
CONSTRAINT FK_inventory_stock_transactions_users
  FOREIGN KEY (collection_from_user_id)
  REFERENCES users(id)
```

**inventory_items table** needs:
```sql
-- Aggregate tracking
total_investment DECIMAL(18,2) DEFAULT 0  -- Sum of all stock-in
total_collected DECIMAL(18,2) DEFAULT 0   -- Sum of all stock-out
```

### API Endpoints Required

#### 1. Remove Stock (Stock-Out)
```
POST /api/Inventory/removeStock
```

**Request Body:**
```json
{
  "inventoryItemId": "guid",
  "transactionType": "out",
  "quantity": 20,
  "amountPerUnit": 75.00,
  "totalAmount": 1500.00,
  "collectionFromUserId": "user-guid",  // ← REQUIRED
  "referenceNumber": "INV-001",
  "notes": "Allocated to user",
  "transactionDate": "2026-03-02T10:00:00Z"
}
```

**Backend Logic:**
```csharp
// 1. Validate user exists
var user = await _context.Users.FindAsync(dto.CollectionFromUserId);
if (user == null) throw new NotFoundException("User not found");

// 2. Create transaction
var transaction = new InventoryStockTransaction
{
    InventoryItemId = dto.InventoryItemId,
    TransactionType = "out",
    Quantity = dto.Quantity,
    AmountPerUnit = dto.AmountPerUnit,
    TotalAmount = dto.TotalAmount,
    CollectionFromUserId = dto.CollectionFromUserId,  // ← STORE USER
    ReferenceNumber = dto.ReferenceNumber,
    Notes = dto.Notes,
    TransactionDate = dto.TransactionDate,
    CreatedAt = DateTime.UtcNow
};

// 3. Update inventory item
inventoryItem.CurrentStock -= dto.Quantity;
inventoryItem.TotalCollected += dto.TotalAmount;  // ← TRACK COLLECTION
inventoryItem.UpdatedAt = DateTime.UtcNow;

// 4. Save changes
await _context.SaveChangesAsync();
```

#### 2. Get Transaction History
```
GET /api/Inventory/getTransactionsByItem/{itemId}
```

**Response:**
```json
[
  {
    "Id": "transaction-guid",
    "TransactionType": "out",
    "Quantity": 20,
    "AmountPerUnit": 75.00,
    "TotalAmount": 1500.00,
    "CollectionFromUserId": "user-guid",
    "TransactionDate": "2026-03-02T10:00:00Z",
    "ItemName": "Urea Fertilizer",
    "ItemCode": "FERT-001"
  }
]
```

#### 3. Get User Collections (Optional but Recommended)
```
GET /api/Inventory/getCollectionsByUser/{userId}
```

Returns all inventory collections from a specific user.

---

## 📈 Reporting Capabilities

With this implementation, you can generate reports for:

### Per-User Analysis
- Total amount collected from each user
- List of all items allocated to a user
- User payment history
- Outstanding balances (if applicable)

### Per-Item Analysis
- Total invested in the item
- Total collected from the item
- Profit/loss analysis (collected - invested)
- Which users purchased/received the item

### Financial Summary
```
Item: Urea Fertilizer
├─ Total Investment: ₹45,000 (1000 kg @ ₹45/kg)
├─ Total Collected: ₹60,000 (800 kg @ ₹75/kg)
├─ Profit: ₹15,000
└─ Remaining Stock: 200 kg
```

### User Collection Summary
```
User: John Doe
├─ Urea Fertilizer: ₹1,500 (20 kg @ ₹75/kg)
├─ Pesticide XYZ: ₹3,000 (10 liters @ ₹300/liter)
└─ Total Collected: ₹4,500
```

---

## 🔍 Example Scenarios

### Scenario 1: Farmer Purchases Fertilizer

**User Action:**
1. Manager opens "Urea Fertilizer" item
2. Clicks "Stock Transaction"
3. Selects "Remove" type
4. Enters quantity: 50 kg
5. Enters price: ₹80/kg (selling price)
6. Selects user: "Rajesh Kumar"
7. Enters reference: "BILL-2026-001"
8. Clicks Submit

**System Records:**
- Transaction Type: Removal
- Quantity: 50 kg
- Amount Per Unit: ₹80
- Total Amount: ₹4,000
- Collection From User: Rajesh Kumar
- Reference: BILL-2026-001

**Database Updates:**
- Stock decreased by 50 kg
- `total_collected` increased by ₹4,000
- Transaction saved with Rajesh Kumar's user ID

### Scenario 2: Multiple Users Purchase Same Item

**Transaction 1:**
- User: Rajesh Kumar
- Quantity: 50 kg @ ₹80/kg = ₹4,000

**Transaction 2:**
- User: Priya Sharma
- Quantity: 30 kg @ ₹85/kg = ₹2,550

**Transaction 3:**
- User: Amit Patel
- Quantity: 20 kg @ ₹75/kg = ₹1,500

**Result:**
- Total Stock Removed: 100 kg
- Total Collected: ₹8,050
- System tracks exactly who paid what

---

## 📋 Implementation Checklist for Backend

- [ ] Add `collection_from_user_id` column to transactions table
- [ ] Add `amount_per_unit` column to transactions table
- [ ] Add `total_amount` column to transactions table
- [ ] Add `total_investment` column to items table
- [ ] Add `total_collected` column to items table
- [ ] Add foreign key constraint from transactions to users
- [ ] Update `removeStock` endpoint to accept `collectionFromUserId`
- [ ] Validate user exists when `collectionFromUserId` provided
- [ ] Update inventory item's `total_collected` on stock-out
- [ ] Update inventory item's `total_investment` on stock-in
- [ ] Return user details in transaction history
- [ ] Create endpoint to get collections by user (optional)
- [ ] Test with multiple users
- [ ] Test amount calculations
- [ ] Verify data consistency

---

## 📖 Related Documentation

- **Investment & Collection Tracking**: `/DOTNET_INVENTORY_INVESTMENT_IMPLEMENTATION.md`
- **Selling Price Implementation**: `/DOTNET_INVENTORY_SELLING_PRICE_IMPLEMENTATION.md`
- **Allocation System**: `/DOTNET_INVENTORY_ALLOCATION_IMPLEMENTATION.md`

---

## 🎯 Key Takeaways

1. **Frontend is Ready**: User collection tracking is fully implemented in the UI
2. **User Selection is Mandatory**: Cannot remove stock without selecting a user
3. **Complete Audit Trail**: Every transaction records who, what, when, and how much
4. **Financial Tracking**: Separate investment and collection amounts
5. **Reporting Ready**: Data structure supports comprehensive financial reports

The frontend is waiting for your backend to implement the corresponding database columns and API logic as documented in the implementation guides.
