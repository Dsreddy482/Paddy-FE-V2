# .NET Backend Implementation Guide: Inventory Investment & Collection Tracking

## Overview
This document provides implementation details for adding investment and collection tracking to the inventory management system in your .NET backend.

## Database Schema Changes

### 1. Update `inventory_items` Table

Add two new columns to track total investment and total collected amounts:

```sql
ALTER TABLE inventory_items
ADD total_investment DECIMAL(18,2) DEFAULT 0 CHECK (total_investment >= 0),
    total_collected DECIMAL(18,2) DEFAULT 0 CHECK (total_collected >= 0);
```

**Column Descriptions:**
- `total_investment`: Total amount invested when purchasing inventory items (sum of all stock-in transactions)
- `total_collected`: Total amount collected when selling/allocating inventory items (sum of all stock-out transactions)

### 2. Update `inventory_stock_transactions` Table

Add three new columns to track per-transaction financial data:

```sql
ALTER TABLE inventory_stock_transactions
ADD amount_per_unit DECIMAL(18,2) DEFAULT 0 CHECK (amount_per_unit >= 0),
    total_amount DECIMAL(18,2) DEFAULT 0 CHECK (total_amount >= 0),
    collection_from_user_id NVARCHAR(450) NULL;

-- Add foreign key constraint if you have user relationships
ALTER TABLE inventory_stock_transactions
ADD CONSTRAINT FK_inventory_stock_transactions_users
FOREIGN KEY (collection_from_user_id) REFERENCES users(id);
```

**Column Descriptions:**
- `amount_per_unit`: Price per unit for this transaction (purchase price for stock-in, selling price for stock-out)
- `total_amount`: Total amount for this transaction (quantity × amount_per_unit)
- `collection_from_user_id`: User ID from whom money was collected (only for stock-out/allocation transactions)

## C# Model Updates

### Update InventoryItem Model

```csharp
public class InventoryItem
{
    public Guid Id { get; set; }
    public string ItemName { get; set; }
    public string Category { get; set; }
    public decimal CurrentStock { get; set; }
    public string Unit { get; set; }
    public decimal MinimumStockLevel { get; set; }
    public decimal MaximumStockLevel { get; set; }
    public string Location { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // NEW PROPERTIES
    public decimal TotalInvestment { get; set; }
    public decimal TotalCollected { get; set; }
}
```

### Update InventoryStockTransaction Model

```csharp
public class InventoryStockTransaction
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string TransactionType { get; set; } // "stock_in" or "stock_out"
    public decimal Quantity { get; set; }
    public string Reason { get; set; }
    public string Notes { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    // NEW PROPERTIES
    public decimal AmountPerUnit { get; set; }
    public decimal TotalAmount { get; set; }
    public string CollectionFromUserId { get; set; }

    // Navigation properties
    public InventoryItem InventoryItem { get; set; }
    public User CollectionFromUser { get; set; }
}
```

## API Request/Response DTOs

### CreateStockTransactionDto

```csharp
public class CreateStockTransactionDto
{
    [Required]
    public Guid InventoryItemId { get; set; }

    [Required]
    public string TransactionType { get; set; } // "stock_in" or "stock_out"

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Quantity { get; set; }

    [Required]
    public string Reason { get; set; }

    public string Notes { get; set; }

    // NEW PROPERTIES
    [Range(0, double.MaxValue)]
    public decimal AmountPerUnit { get; set; }

    public string CollectionFromUserId { get; set; }
}
```

### StockTransactionResponseDto

```csharp
public class StockTransactionResponseDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string TransactionType { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; }
    public string Notes { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    // NEW PROPERTIES
    public decimal AmountPerUnit { get; set; }
    public decimal TotalAmount { get; set; }
    public string CollectionFromUserId { get; set; }
    public UserSummaryDto CollectionFromUser { get; set; } // Optional: user details
}
```

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

    public async Task<StockTransactionResponseDto> CreateStockTransactionAsync(
        CreateStockTransactionDto dto,
        string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Get inventory item
            var inventoryItem = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.Id == dto.InventoryItemId);

            if (inventoryItem == null)
            {
                throw new NotFoundException("Inventory item not found");
            }

            // 2. Calculate total amount
            var totalAmount = dto.Quantity * dto.AmountPerUnit;

            // 3. Create stock transaction
            var stockTransaction = new InventoryStockTransaction
            {
                Id = Guid.NewGuid(),
                InventoryItemId = dto.InventoryItemId,
                TransactionType = dto.TransactionType,
                Quantity = dto.Quantity,
                Reason = dto.Reason,
                Notes = dto.Notes,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                AmountPerUnit = dto.AmountPerUnit,
                TotalAmount = totalAmount,
                CollectionFromUserId = dto.CollectionFromUserId
            };

            _context.InventoryStockTransactions.Add(stockTransaction);

            // 4. Update inventory item stock
            if (dto.TransactionType == "stock_in")
            {
                inventoryItem.CurrentStock += dto.Quantity;
                inventoryItem.TotalInvestment += totalAmount;
            }
            else if (dto.TransactionType == "stock_out")
            {
                if (inventoryItem.CurrentStock < dto.Quantity)
                {
                    throw new InvalidOperationException("Insufficient stock");
                }

                inventoryItem.CurrentStock -= dto.Quantity;
                inventoryItem.TotalCollected += totalAmount;
            }

            inventoryItem.UpdatedAt = DateTime.UtcNow;

            // 5. Save changes
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // 6. Return response
            return new StockTransactionResponseDto
            {
                Id = stockTransaction.Id,
                InventoryItemId = stockTransaction.InventoryItemId,
                TransactionType = stockTransaction.TransactionType,
                Quantity = stockTransaction.Quantity,
                Reason = stockTransaction.Reason,
                Notes = stockTransaction.Notes,
                CreatedBy = stockTransaction.CreatedBy,
                CreatedAt = stockTransaction.CreatedAt,
                AmountPerUnit = stockTransaction.AmountPerUnit,
                TotalAmount = stockTransaction.TotalAmount,
                CollectionFromUserId = stockTransaction.CollectionFromUserId
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating stock transaction");
            throw;
        }
    }

    public async Task<List<StockTransactionResponseDto>> GetStockTransactionsAsync(
        Guid inventoryItemId)
    {
        return await _context.InventoryStockTransactions
            .Where(t => t.InventoryItemId == inventoryItemId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new StockTransactionResponseDto
            {
                Id = t.Id,
                InventoryItemId = t.InventoryItemId,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                Reason = t.Reason,
                Notes = t.Notes,
                CreatedBy = t.CreatedBy,
                CreatedAt = t.CreatedAt,
                AmountPerUnit = t.AmountPerUnit,
                TotalAmount = t.TotalAmount,
                CollectionFromUserId = t.CollectionFromUserId,
                CollectionFromUser = t.CollectionFromUserId != null
                    ? new UserSummaryDto
                    {
                        Id = t.CollectionFromUser.Id,
                        Name = t.CollectionFromUser.Name
                    }
                    : null
            })
            .ToListAsync();
    }
}
```

## Controller Implementation

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

    [HttpPost("stock-transactions")]
    public async Task<ActionResult<StockTransactionResponseDto>> CreateStockTransaction(
        [FromBody] CreateStockTransactionDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _inventoryService.CreateStockTransactionAsync(dto, userId);
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
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpGet("{inventoryItemId}/stock-transactions")]
    public async Task<ActionResult<List<StockTransactionResponseDto>>> GetStockTransactions(
        Guid inventoryItemId)
    {
        var transactions = await _inventoryService.GetStockTransactionsAsync(inventoryItemId);
        return Ok(transactions);
    }

    [HttpGet]
    public async Task<ActionResult<List<InventoryItem>>> GetAllInventoryItems()
    {
        var items = await _inventoryService.GetAllInventoryItemsAsync();
        return Ok(items);
    }
}
```

## Database Migration (Entity Framework)

If using Entity Framework migrations:

```csharp
public partial class AddInventoryInvestmentTracking : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "total_investment",
            table: "inventory_items",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<decimal>(
            name: "total_collected",
            table: "inventory_items",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<decimal>(
            name: "amount_per_unit",
            table: "inventory_stock_transactions",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<decimal>(
            name: "total_amount",
            table: "inventory_stock_transactions",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<string>(
            name: "collection_from_user_id",
            table: "inventory_stock_transactions",
            type: "nvarchar(450)",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_inventory_stock_transactions_collection_from_user_id",
            table: "inventory_stock_transactions",
            column: "collection_from_user_id");

        migrationBuilder.AddForeignKey(
            name: "FK_inventory_stock_transactions_users_collection_from_user_id",
            table: "inventory_stock_transactions",
            column: "collection_from_user_id",
            principalTable: "users",
            principalSchema: null,
            principalColumn: "id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_inventory_stock_transactions_users_collection_from_user_id",
            table: "inventory_stock_transactions");

        migrationBuilder.DropIndex(
            name: "IX_inventory_stock_transactions_collection_from_user_id",
            table: "inventory_stock_transactions");

        migrationBuilder.DropColumn(
            name: "total_investment",
            table: "inventory_items");

        migrationBuilder.DropColumn(
            name: "total_collected",
            table: "inventory_items");

        migrationBuilder.DropColumn(
            name: "amount_per_unit",
            table: "inventory_stock_transactions");

        migrationBuilder.DropColumn(
            name: "total_amount",
            table: "inventory_stock_transactions");

        migrationBuilder.DropColumn(
            name: "collection_from_user_id",
            table: "inventory_stock_transactions");
    }
}
```

## Testing Scenarios

### 1. Stock In Transaction (Purchase)
```json
POST /api/inventory/stock-transactions
{
  "inventoryItemId": "123e4567-e89b-12d3-a456-426614174000",
  "transactionType": "stock_in",
  "quantity": 100,
  "reason": "Purchase",
  "amountPerUnit": 50.00,
  "notes": "Purchased from supplier ABC"
}
```

**Expected Results:**
- Stock increases by 100
- `total_investment` increases by 5000 (100 × 50)
- Transaction saved with `amount_per_unit = 50` and `total_amount = 5000`

### 2. Stock Out Transaction (Allocation/Sale)
```json
POST /api/inventory/stock-transactions
{
  "inventoryItemId": "123e4567-e89b-12d3-a456-426614174000",
  "transactionType": "stock_out",
  "quantity": 20,
  "reason": "Allocated to User",
  "amountPerUnit": 75.00,
  "collectionFromUserId": "user123",
  "notes": "Allocated to John Doe"
}
```

**Expected Results:**
- Stock decreases by 20
- `total_collected` increases by 1500 (20 × 75)
- Transaction saved with `amount_per_unit = 75`, `total_amount = 1500`, and `collection_from_user_id = user123`

## Validation Rules

1. **Amount Per Unit**: Must be >= 0
2. **Quantity**: Must be > 0
3. **Stock Out**: Cannot exceed current stock
4. **Transaction Type**: Must be either "stock_in" or "stock_out"
5. **Collection From User**: Only applicable for "stock_out" transactions

## Error Handling

Implement proper error handling for:
- Insufficient stock for stock_out transactions
- Invalid inventory item ID
- Invalid user ID for collection_from_user_id
- Database constraint violations
- Concurrent transaction conflicts

## Implementation Checklist

- [ ] Run database migration scripts
- [ ] Update C# models with new properties
- [ ] Create/update DTOs for requests and responses
- [ ] Implement business logic in service layer
- [ ] Update controller endpoints
- [ ] Add validation for new fields
- [ ] Implement error handling
- [ ] Test stock_in transactions
- [ ] Test stock_out transactions
- [ ] Test with insufficient stock scenarios
- [ ] Verify total_investment and total_collected calculations
- [ ] Test API integration with frontend

## Notes

- All monetary values use `DECIMAL(18,2)` for precision
- Transactions are wrapped in database transactions to ensure data consistency
- The `collection_from_user_id` is optional and only used for stock_out transactions
- Frontend is already updated to send and display these new fields
