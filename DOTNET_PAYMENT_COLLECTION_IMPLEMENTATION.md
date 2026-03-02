# .NET Backend Implementation Guide: Payment Collection Tracking

## Overview
This document provides implementation details for tracking payment collection status when inventory is allocated to users. The system now supports marking allocations as pending, partial, or fully collected.

---

## Business Flow

### 1. Inventory Allocation (Stock Removal)
When inventory is allocated to a user:
- Stock is **immediately reduced**
- Transaction is created with `payment_status = 'pending'`
- Amount to collect is recorded (`total_amount`)
- User reference is stored (`collection_from_user_id`)

### 2. Payment Collection
When payment is received from the user:
- Transaction's `payment_status` is updated to 'collected' or 'partial'
- `amount_collected` is updated with the received amount
- `payment_date` is set to current timestamp
- Optional `payment_notes` can be added

### 3. Investment Calculation (Stock Addition)
When inventory is added:
- Stock increases
- `total_investment` on inventory item increases
- Transaction has `payment_status = 'not_applicable'`

---

## Database Schema

### 1. inventory_stock_transactions Table (Updated)

```sql
CREATE TABLE inventory_stock_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  transaction_type text CHECK (transaction_type IN ('addition', 'removal', 'adjustment')),
  quantity numeric NOT NULL,

  -- Financial tracking
  amount_per_unit numeric DEFAULT 0 CHECK (amount_per_unit >= 0),
  total_amount numeric DEFAULT 0 CHECK (total_amount >= 0),

  -- Collection tracking
  collection_from_user_id uuid REFERENCES auth.users(id),
  payment_status text DEFAULT 'not_applicable'
    CHECK (payment_status IN ('pending', 'partial', 'collected', 'not_applicable')),
  amount_collected numeric DEFAULT 0 CHECK (amount_collected >= 0),
  payment_date timestamptz,
  payment_notes text,

  -- Other fields
  reference_number text,
  notes text,
  transaction_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_inventory_stock_transactions_payment_status
  ON inventory_stock_transactions(payment_status)
  WHERE payment_status IN ('pending', 'partial');

CREATE INDEX idx_inventory_stock_transactions_user_collections
  ON inventory_stock_transactions(collection_from_user_id, payment_status)
  WHERE collection_from_user_id IS NOT NULL;
```

### 2. inventory_items Table (Already Exists)

```sql
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  item_code text UNIQUE NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  description text,
  minimum_stock numeric DEFAULT 0,
  current_stock numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  selling_price_per_unit numeric DEFAULT 0,

  -- Financial tracking
  total_investment numeric DEFAULT 0 CHECK (total_investment >= 0),
  total_collected numeric DEFAULT 0 CHECK (total_collected >= 0),

  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## C# Models

### StockTransaction Model (Updated)

```csharp
public class InventoryStockTransaction
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }

    [Required]
    public string TransactionType { get; set; } // "addition", "removal", "adjustment"

    [Required]
    public decimal Quantity { get; set; }

    // Financial tracking
    public decimal AmountPerUnit { get; set; }
    public decimal TotalAmount { get; set; }

    // Collection tracking
    public Guid? CollectionFromUserId { get; set; }
    public string PaymentStatus { get; set; } // "pending", "partial", "collected", "not_applicable"
    public decimal AmountCollected { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string PaymentNotes { get; set; }

    // Other fields
    public string ReferenceNumber { get; set; }
    public string Notes { get; set; }
    public DateTime TransactionDate { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public InventoryItem InventoryItem { get; set; }
    public User CollectionFromUser { get; set; }
}
```

---

## API DTOs

### RemoveStockDto (Updated)

```csharp
public class RemoveStockDto
{
    [Required]
    public Guid InventoryItemId { get; set; }

    [Required]
    public string TransactionType { get; set; } // "out"

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Quantity { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal AmountPerUnit { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal TotalAmount { get; set; }

    [Required]
    public Guid CollectionFromUserId { get; set; }

    // Payment tracking (defaults to pending)
    public string PaymentStatus { get; set; } = "pending";
    public decimal AmountCollected { get; set; } = 0;

    public string ReferenceNumber { get; set; }
    public string Notes { get; set; }
    public DateTime? TransactionDate { get; set; }
}
```

### UpdatePaymentStatusDto (New)

```csharp
public class UpdatePaymentStatusDto
{
    [Required]
    public Guid TransactionId { get; set; }

    [Required]
    public string PaymentStatus { get; set; } // "partial" or "collected"

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal AmountCollected { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    public string PaymentNotes { get; set; }
}
```

### StockTransactionResponseDto (Updated)

```csharp
public class StockTransactionResponseDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string TransactionType { get; set; }
    public decimal Quantity { get; set; }
    public decimal AmountPerUnit { get; set; }
    public decimal TotalAmount { get; set; }

    // Collection tracking
    public Guid? CollectionFromUserId { get; set; }
    public string PaymentStatus { get; set; }
    public decimal AmountCollected { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string PaymentNotes { get; set; }

    public string ReferenceNumber { get; set; }
    public string Notes { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Item details
    public string ItemName { get; set; }
    public string ItemCode { get; set; }
}
```

---

## Business Logic Implementation

### InventoryService.cs

```csharp
public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InventoryService> _logger;

    public InventoryService(ApplicationDbContext context, ILogger<InventoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Remove stock and mark payment as pending collection
    /// </summary>
    public async Task<StockTransactionResponseDto> RemoveStockAsync(
        RemoveStockDto dto,
        string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Validate inventory item exists
            var inventoryItem = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.Id == dto.InventoryItemId);

            if (inventoryItem == null)
            {
                throw new NotFoundException("Inventory item not found");
            }

            // 2. Validate sufficient stock
            if (inventoryItem.CurrentStock < dto.Quantity)
            {
                throw new InvalidOperationException(
                    $"Insufficient stock. Available: {inventoryItem.CurrentStock}, Requested: {dto.Quantity}");
            }

            // 3. Validate user exists
            var user = await _context.Users.FindAsync(dto.CollectionFromUserId);
            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            // 4. Create stock transaction with pending payment
            var stockTransaction = new InventoryStockTransaction
            {
                Id = Guid.NewGuid(),
                InventoryItemId = dto.InventoryItemId,
                TransactionType = "removal",
                Quantity = dto.Quantity,
                AmountPerUnit = dto.AmountPerUnit,
                TotalAmount = dto.TotalAmount,
                CollectionFromUserId = dto.CollectionFromUserId,
                PaymentStatus = "pending", // ← Mark as pending collection
                AmountCollected = 0,       // ← No payment received yet
                PaymentDate = null,
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes,
                TransactionDate = dto.TransactionDate ?? DateTime.UtcNow,
                CreatedBy = Guid.Parse(userId),
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryStockTransactions.Add(stockTransaction);

            // 5. Reduce stock (immediately)
            inventoryItem.CurrentStock -= dto.Quantity;
            inventoryItem.UpdatedAt = DateTime.UtcNow;

            // 6. Note: Do NOT update total_collected yet (payment pending)
            // total_collected will be updated when payment is marked as collected

            // 7. Save changes
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new StockTransactionResponseDto
            {
                Id = stockTransaction.Id,
                InventoryItemId = stockTransaction.InventoryItemId,
                TransactionType = stockTransaction.TransactionType,
                Quantity = stockTransaction.Quantity,
                AmountPerUnit = stockTransaction.AmountPerUnit,
                TotalAmount = stockTransaction.TotalAmount,
                CollectionFromUserId = stockTransaction.CollectionFromUserId,
                PaymentStatus = stockTransaction.PaymentStatus,
                AmountCollected = stockTransaction.AmountCollected,
                PaymentDate = stockTransaction.PaymentDate,
                ReferenceNumber = stockTransaction.ReferenceNumber,
                Notes = stockTransaction.Notes,
                TransactionDate = stockTransaction.TransactionDate,
                CreatedAt = stockTransaction.CreatedAt,
                ItemName = inventoryItem.ItemName,
                ItemCode = inventoryItem.ItemCode
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error removing stock");
            throw;
        }
    }

    /// <summary>
    /// Update payment status when payment is received
    /// </summary>
    public async Task UpdatePaymentStatusAsync(UpdatePaymentStatusDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Get the stock transaction
            var stockTransaction = await _context.InventoryStockTransactions
                .Include(t => t.InventoryItem)
                .FirstOrDefaultAsync(t => t.Id == dto.TransactionId);

            if (stockTransaction == null)
            {
                throw new NotFoundException("Transaction not found");
            }

            // 2. Validate transaction is a removal with collection
            if (stockTransaction.TransactionType != "removal" ||
                stockTransaction.CollectionFromUserId == null)
            {
                throw new InvalidOperationException("This transaction does not involve collection");
            }

            // 3. Validate payment amount
            if (dto.AmountCollected > stockTransaction.TotalAmount)
            {
                throw new InvalidOperationException(
                    $"Amount collected cannot exceed total amount of {stockTransaction.TotalAmount}");
            }

            // 4. Calculate amount difference (what's newly collected)
            var previouslyCollected = stockTransaction.AmountCollected;
            var newlyCollected = dto.AmountCollected - previouslyCollected;

            // 5. Update transaction payment status
            stockTransaction.PaymentStatus = dto.PaymentStatus;
            stockTransaction.AmountCollected = dto.AmountCollected;
            stockTransaction.PaymentDate = dto.PaymentDate;
            stockTransaction.PaymentNotes = dto.PaymentNotes;

            // 6. Update inventory item's total_collected
            stockTransaction.InventoryItem.TotalCollected += newlyCollected;
            stockTransaction.InventoryItem.UpdatedAt = DateTime.UtcNow;

            // 7. Save changes
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error updating payment status");
            throw;
        }
    }

    /// <summary>
    /// Get all pending collections
    /// </summary>
    public async Task<List<StockTransactionResponseDto>> GetPendingCollectionsAsync()
    {
        return await _context.InventoryStockTransactions
            .Include(t => t.InventoryItem)
            .Where(t => t.PaymentStatus == "pending" || t.PaymentStatus == "partial")
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new StockTransactionResponseDto
            {
                Id = t.Id,
                InventoryItemId = t.InventoryItemId,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                AmountPerUnit = t.AmountPerUnit,
                TotalAmount = t.TotalAmount,
                CollectionFromUserId = t.CollectionFromUserId,
                PaymentStatus = t.PaymentStatus,
                AmountCollected = t.AmountCollected,
                PaymentDate = t.PaymentDate,
                PaymentNotes = t.PaymentNotes,
                ReferenceNumber = t.ReferenceNumber,
                Notes = t.Notes,
                TransactionDate = t.TransactionDate,
                CreatedAt = t.CreatedAt,
                ItemName = t.InventoryItem.ItemName,
                ItemCode = t.InventoryItem.ItemCode
            })
            .ToListAsync();
    }

    /// <summary>
    /// Get collections by user (all transactions where they owe money)
    /// </summary>
    public async Task<List<StockTransactionResponseDto>> GetCollectionsByUserAsync(Guid userId)
    {
        return await _context.InventoryStockTransactions
            .Include(t => t.InventoryItem)
            .Where(t => t.CollectionFromUserId == userId)
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new StockTransactionResponseDto
            {
                Id = t.Id,
                InventoryItemId = t.InventoryItemId,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                AmountPerUnit = t.AmountPerUnit,
                TotalAmount = t.TotalAmount,
                CollectionFromUserId = t.CollectionFromUserId,
                PaymentStatus = t.PaymentStatus,
                AmountCollected = t.AmountCollected,
                PaymentDate = t.PaymentDate,
                PaymentNotes = t.PaymentNotes,
                ReferenceNumber = t.ReferenceNumber,
                Notes = t.Notes,
                TransactionDate = t.TransactionDate,
                CreatedAt = t.CreatedAt,
                ItemName = t.InventoryItem.ItemName,
                ItemCode = t.InventoryItem.ItemCode
            })
            .ToListAsync();
    }

    /// <summary>
    /// Add stock and track investment
    /// </summary>
    public async Task<StockTransactionResponseDto> AddStockAsync(
        AddStockDto dto,
        string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var inventoryItem = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.Id == dto.InventoryItemId);

            if (inventoryItem == null)
            {
                throw new NotFoundException("Inventory item not found");
            }

            var stockTransaction = new InventoryStockTransaction
            {
                Id = Guid.NewGuid(),
                InventoryItemId = dto.InventoryItemId,
                TransactionType = "addition",
                Quantity = dto.Quantity,
                AmountPerUnit = dto.AmountPerUnit,
                TotalAmount = dto.TotalAmount,
                PaymentStatus = "not_applicable", // ← Not collecting, we're buying
                AmountCollected = 0,
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes,
                TransactionDate = dto.TransactionDate ?? DateTime.UtcNow,
                CreatedBy = Guid.Parse(userId),
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryStockTransactions.Add(stockTransaction);

            // Increase stock and track investment
            inventoryItem.CurrentStock += dto.Quantity;
            inventoryItem.TotalInvestment += dto.TotalAmount;
            inventoryItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new StockTransactionResponseDto
            {
                Id = stockTransaction.Id,
                InventoryItemId = stockTransaction.InventoryItemId,
                TransactionType = stockTransaction.TransactionType,
                Quantity = stockTransaction.Quantity,
                AmountPerUnit = stockTransaction.AmountPerUnit,
                TotalAmount = stockTransaction.TotalAmount,
                PaymentStatus = stockTransaction.PaymentStatus,
                AmountCollected = stockTransaction.AmountCollected,
                ReferenceNumber = stockTransaction.ReferenceNumber,
                Notes = stockTransaction.Notes,
                TransactionDate = stockTransaction.TransactionDate,
                CreatedAt = stockTransaction.CreatedAt,
                ItemName = inventoryItem.ItemName,
                ItemCode = inventoryItem.ItemCode
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error adding stock");
            throw;
        }
    }
}
```

---

## Controller Endpoints

### InventoryController.cs

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    /// <summary>
    /// Remove stock and mark payment as pending
    /// </summary>
    [HttpPost("removeStock")]
    public async Task<ActionResult<StockTransactionResponseDto>> RemoveStock(
        [FromBody] RemoveStockDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _inventoryService.RemoveStockAsync(dto, userId);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing stock");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update payment status when money is collected
    /// </summary>
    [HttpPut("updatePaymentStatus")]
    public async Task<IActionResult> UpdatePaymentStatus(
        [FromBody] UpdatePaymentStatusDto dto)
    {
        try
        {
            await _inventoryService.UpdatePaymentStatusAsync(dto);
            return Ok(new { message = "Payment status updated successfully" });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating payment status");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get all pending collections
    /// </summary>
    [HttpGet("getPendingCollections")]
    public async Task<ActionResult<List<StockTransactionResponseDto>>> GetPendingCollections()
    {
        var collections = await _inventoryService.GetPendingCollectionsAsync();
        return Ok(collections);
    }

    /// <summary>
    /// Get collections by specific user
    /// </summary>
    [HttpGet("getCollectionsByUser/{userId}")]
    public async Task<ActionResult<List<StockTransactionResponseDto>>> GetCollectionsByUser(
        Guid userId)
    {
        var collections = await _inventoryService.GetCollectionsByUserAsync(userId);
        return Ok(collections);
    }

    /// <summary>
    /// Add stock and track investment
    /// </summary>
    [HttpPost("addStock")]
    public async Task<ActionResult<StockTransactionResponseDto>> AddStock(
        [FromBody] AddStockDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _inventoryService.AddStockAsync(dto, userId);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding stock");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
```

---

## Testing Scenarios

### Scenario 1: Allocate Inventory to User (Pending Payment)

**Request:**
```json
POST /api/Inventory/removeStock
{
  "inventoryItemId": "item-guid",
  "transactionType": "out",
  "quantity": 50,
  "amountPerUnit": 80,
  "totalAmount": 4000,
  "collectionFromUserId": "user-guid",
  "paymentStatus": "pending",
  "amountCollected": 0,
  "notes": "Allocated fertilizer to Rajesh Kumar"
}
```

**Expected Result:**
- Stock reduced by 50
- Transaction created with `payment_status = 'pending'`
- `total_collected` on inventory item NOT updated (payment pending)

---

### Scenario 2: Collect Full Payment

**Request:**
```json
PUT /api/Inventory/updatePaymentStatus
{
  "transactionId": "transaction-guid",
  "paymentStatus": "collected",
  "amountCollected": 4000,
  "paymentDate": "2026-03-02T15:30:00Z",
  "paymentNotes": "Cash payment received"
}
```

**Expected Result:**
- Transaction `payment_status` changed to 'collected'
- Transaction `amount_collected` = 4000
- Transaction `payment_date` set
- Inventory item's `total_collected` increased by 4000

---

### Scenario 3: Collect Partial Payment

**Request 1: Allocate ₹5000**
```json
POST /api/Inventory/removeStock
{
  "inventoryItemId": "item-guid",
  "quantity": 50,
  "amountPerUnit": 100,
  "totalAmount": 5000,
  "collectionFromUserId": "user-guid",
  "paymentStatus": "pending"
}
```

**Request 2: Collect ₹3000 (Partial)**
```json
PUT /api/Inventory/updatePaymentStatus
{
  "transactionId": "transaction-guid",
  "paymentStatus": "partial",
  "amountCollected": 3000,
  "paymentDate": "2026-03-02T10:00:00Z",
  "paymentNotes": "Partial payment - ₹3000"
}
```

**Request 3: Collect Remaining ₹2000**
```json
PUT /api/Inventory/updatePaymentStatus
{
  "transactionId": "transaction-guid",
  "paymentStatus": "collected",
  "amountCollected": 5000,
  "paymentDate": "2026-03-05T14:00:00Z",
  "paymentNotes": "Final payment - ₹2000"
}
```

**Expected Results:**
- After partial: `payment_status = 'partial'`, `amount_collected = 3000`, `total_collected += 3000`
- After final: `payment_status = 'collected'`, `amount_collected = 5000`, `total_collected += 2000`

---

## Validation Rules

1. **Payment Status Transitions**
   - pending → partial → collected
   - pending → collected (direct full payment)
   - Cannot go backwards (collected → pending)

2. **Amount Validations**
   - `amount_collected` must be >= 0
   - `amount_collected` must be <= `total_amount`
   - When updating, new `amount_collected` must be >= previous value

3. **Transaction Type Rules**
   - Only 'removal' transactions can have payment tracking
   - 'addition' transactions always have `payment_status = 'not_applicable'`
   - 'adjustment' transactions always have `payment_status = 'not_applicable'`

---

## Implementation Checklist

- [ ] Run database migration to add payment columns
- [ ] Update C# models with new properties
- [ ] Create UpdatePaymentStatusDto
- [ ] Update RemoveStockDto to include payment fields
- [ ] Implement UpdatePaymentStatusAsync in service
- [ ] Update RemoveStockAsync to set payment_status = 'pending'
- [ ] Update AddStockAsync to track investment
- [ ] Create GetPendingCollectionsAsync endpoint
- [ ] Create GetCollectionsByUserAsync endpoint
- [ ] Add UpdatePaymentStatus controller endpoint
- [ ] Add validation for payment status transitions
- [ ] Test pending payment flow
- [ ] Test partial payment flow
- [ ] Test full payment flow
- [ ] Verify total_collected calculations
- [ ] Test frontend integration

---

## Key Differences from Previous Implementation

### Before (Simple Collection Tracking)
- Allocation → Stock reduced + Amount immediately added to `total_collected`
- No way to track if payment was actually received
- No pending/collected status

### After (Payment Collection Tracking)
- Allocation → Stock reduced + Payment marked as **pending**
- Explicit payment collection step required
- Can track partial payments
- `total_collected` only updates when payment actually received
- Clear audit trail of when payments were made

---

## Frontend Integration

The frontend is already updated with:
- `CollectPaymentModal` component for recording payments
- Payment status badges (Pending, Partial, Collected)
- "Collect" button on pending transactions
- Support for partial and full payment collection

The backend implementation in this document provides the API endpoints the frontend needs.
