# .NET Backend Implementation Guide: Inventory Selling Price

## Overview
This document outlines the required .NET backend changes to support separate investment and selling price tracking in the inventory management system.

**IMPORTANT:** This is a backend-only change. The frontend has already been updated and is ready to consume these API changes.

## Database Schema Changes

### Inventory Table
Add a new column to your Inventory table:

```sql
ALTER TABLE Inventory
ADD SellingPricePerUnit DECIMAL(18, 2) NOT NULL DEFAULT 0;
```

### Column Descriptions
- `UnitPrice` - Investment/purchase price (what you paid to acquire the item)
- `SellingPricePerUnit` - Standard selling price (what you charge customers)

## Model Updates

### InventoryItem Model
Update your `InventoryItem` class to include the new property:

```csharp
public class InventoryItem
{
    public Guid Id { get; set; }
    public string ItemCode { get; set; }
    public string ItemName { get; set; }
    public string Category { get; set; }
    public string Unit { get; set; }
    public string Description { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal MinimumStock { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SellingPricePerUnit { get; set; }  // NEW PROPERTY
    public string Status { get; set; }
    public decimal? TotalInvestment { get; set; }
    public decimal? TotalCollected { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### DTOs (Data Transfer Objects)

#### CreateInventoryItemDto
```csharp
public class CreateInventoryItemDto
{
    [Required]
    public string ItemCode { get; set; }

    [Required]
    public string ItemName { get; set; }

    [Required]
    public string Category { get; set; }

    [Required]
    public string Unit { get; set; }

    public string Description { get; set; }

    [Required]
    public decimal MinimumStock { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    [Required]
    public decimal SellingPricePerUnit { get; set; }  // NEW PROPERTY

    public string Status { get; set; } = "active";
}
```

#### UpdateInventoryItemDto
```csharp
public class UpdateInventoryItemDto
{
    public string ItemName { get; set; }
    public string ItemCode { get; set; }
    public string Category { get; set; }
    public string Unit { get; set; }
    public string Description { get; set; }
    public decimal? MinimumStock { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? SellingPricePerUnit { get; set; }  // NEW PROPERTY
    public string Status { get; set; }
}
```

## API Endpoints

### POST /api/Inventory/addItem
**Request Body:**
```json
{
  "itemCode": "FERT-001",
  "itemName": "Urea Fertilizer",
  "category": "fertilizer",
  "unit": "kg",
  "description": "Nitrogen-rich fertilizer",
  "minimumStock": 100,
  "unitPrice": 45.50,
  "sellingPricePerUnit": 60.00,
  "status": "active"
}
```

**Response:**
```json
{
  "id": "guid-here",
  "itemCode": "FERT-001",
  "itemName": "Urea Fertilizer",
  "category": "fertilizer",
  "unit": "kg",
  "description": "Nitrogen-rich fertilizer",
  "currentStock": 0,
  "minimumStock": 100,
  "unitPrice": 45.50,
  "sellingPricePerUnit": 60.00,
  "status": "active",
  "totalInvestment": 0,
  "totalCollected": 0,
  "createdAt": "2026-03-02T10:00:00Z",
  "updatedAt": "2026-03-02T10:00:00Z"
}
```

### PUT /api/Inventory/updateItem/{id}
**Request Body:**
```json
{
  "itemName": "Premium Urea Fertilizer",
  "unitPrice": 47.00,
  "sellingPricePerUnit": 65.00,
  "minimumStock": 150
}
```

**Implementation Note:** Only update fields that are provided in the request body.

### GET /api/Inventory/getAllItems
**Response:** Array of inventory items including `sellingPricePerUnit` for each item.

### GET /api/Inventory/getItem/{id}
**Response:** Single inventory item including `sellingPricePerUnit`.

## Stock Transaction Logic

### Investment Calculation (Stock Addition)
When adding stock, use the `amountPerUnit` from the transaction (investment price):

```csharp
public async Task<InventoryItem> AddStock(Guid itemId, decimal quantity, decimal amountPerUnit)
{
    var item = await _context.InventoryItems.FindAsync(itemId);

    // Update stock
    item.CurrentStock += quantity;

    // Calculate investment
    decimal investmentAmount = quantity * amountPerUnit;
    item.TotalInvestment = (item.TotalInvestment ?? 0) + investmentAmount;

    item.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();
    return item;
}
```

### Collection Calculation (Stock Removal)
When removing stock, use the `amountPerUnit` from the transaction (selling price):

```csharp
public async Task<InventoryItem> RemoveStock(Guid itemId, decimal quantity, decimal amountPerUnit, Guid userId)
{
    var item = await _context.InventoryItems.FindAsync(itemId);

    // Update stock
    item.CurrentStock = Math.Max(0, item.CurrentStock - quantity);

    // Calculate collection
    decimal collectionAmount = quantity * amountPerUnit;
    item.TotalCollected = (item.TotalCollected ?? 0) + collectionAmount;

    item.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();
    return item;
}
```

## Business Rules

### Profit Calculation
```csharp
public decimal GetItemProfit(InventoryItem item)
{
    decimal totalInvestment = item.TotalInvestment ?? 0;
    decimal totalCollected = item.TotalCollected ?? 0;
    return totalCollected - totalInvestment;
}
```

### Validation Rules
1. `SellingPricePerUnit` must be greater than or equal to 0
2. `UnitPrice` must be greater than or equal to 0
3. Both prices are required when creating a new inventory item
4. When updating, either price can be updated independently
5. Selling price can be different from unit price (allows for profit margin)

## Migration Script

```sql
-- Add SellingPricePerUnit column
ALTER TABLE Inventory
ADD SellingPricePerUnit DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- Optional: Set default selling price based on existing unit price
-- This assumes a 30% markup, adjust as needed
UPDATE Inventory
SET SellingPricePerUnit = UnitPrice * 1.30
WHERE SellingPricePerUnit = 0;

-- Add index for better query performance
CREATE INDEX IX_Inventory_SellingPricePerUnit ON Inventory(SellingPricePerUnit);
```

## Controller Implementation Example

```csharp
[HttpPost("addItem")]
public async Task<IActionResult> AddItem([FromBody] CreateInventoryItemDto dto)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var item = new InventoryItem
    {
        Id = Guid.NewGuid(),
        ItemCode = dto.ItemCode,
        ItemName = dto.ItemName,
        Category = dto.Category.ToLower(),
        Unit = dto.Unit,
        Description = dto.Description,
        CurrentStock = 0,
        MinimumStock = dto.MinimumStock,
        UnitPrice = dto.UnitPrice,
        SellingPricePerUnit = dto.SellingPricePerUnit,
        Status = dto.Status,
        TotalInvestment = 0,
        TotalCollected = 0,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    _context.InventoryItems.Add(item);
    await _context.SaveChangesAsync();

    return Ok(item);
}

[HttpPut("updateItem/{id}")]
public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateInventoryItemDto dto)
{
    var item = await _context.InventoryItems.FindAsync(id);

    if (item == null)
        return NotFound();

    if (dto.ItemName != null) item.ItemName = dto.ItemName;
    if (dto.ItemCode != null) item.ItemCode = dto.ItemCode;
    if (dto.Category != null) item.Category = dto.Category.ToLower();
    if (dto.Unit != null) item.Unit = dto.Unit;
    if (dto.Description != null) item.Description = dto.Description;
    if (dto.MinimumStock.HasValue) item.MinimumStock = dto.MinimumStock.Value;
    if (dto.UnitPrice.HasValue) item.UnitPrice = dto.UnitPrice.Value;
    if (dto.SellingPricePerUnit.HasValue) item.SellingPricePerUnit = dto.SellingPricePerUnit.Value;
    if (dto.Status != null) item.Status = dto.Status;

    item.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(item);
}
```

## Testing Checklist

- [ ] Create inventory item with both prices
- [ ] Update inventory item selling price independently
- [ ] Add stock transaction and verify investment calculation
- [ ] Remove stock transaction and verify collection calculation
- [ ] Verify profit calculation (TotalCollected - TotalInvestment)
- [ ] Test with edge cases (zero prices, very large numbers)
- [ ] Verify existing items have default selling price after migration

## Frontend Integration (Already Complete)

The frontend is **already updated** and ready to work with these backend changes. The frontend service layer at `src/services/inventory.ts` handles transformation between frontend snake_case and backend PascalCase naming.

### Expected API Response Format

The backend should return JSON with **PascalCase** property names:

```json
{
  "Id": "guid-here",
  "ItemName": "Urea Fertilizer",
  "ItemCode": "FERT-001",
  "Category": "fertilizer",
  "Unit": "kg",
  "CurrentStock": 100,
  "MinimumStock": 50,
  "UnitPrice": 45.50,
  "SellingPricePerUnit": 60.00,
  "TotalInvestment": 4550.00,
  "TotalCollected": 6000.00,
  "Status": "active",
  "CreatedAt": "2026-03-02T10:00:00Z",
  "UpdatedAt": "2026-03-02T10:00:00Z"
}
```

### Frontend Request Format

The frontend sends requests with **PascalCase** (converted from internal snake_case):

**Creating an item:**
```json
{
  "itemName": "Urea Fertilizer",
  "itemCode": "FERT-001",
  "category": "fertilizer",
  "unit": "kg",
  "description": "Nitrogen-rich fertilizer",
  "minimumStock": 100,
  "currentStock": 0,
  "unitPrice": 45.50,
  "sellingPricePerUnit": 60.00,
  "status": "active"
}
```

**Updating an item:**
```json
{
  "unitPrice": 47.00,
  "sellingPricePerUnit": 65.00,
  "minimumStock": 150
}
```

### API Endpoints Already Integrated

The frontend already calls these endpoints:
- `POST /api/Inventory/createItem` - Create new inventory item
- `PUT /api/Inventory/updateItem/{id}` - Update existing item
- `GET /api/Inventory/getAllItems` - Get all items
- `POST /api/Inventory/addStock` - Add stock (uses investment price)
- `POST /api/Inventory/removeStock` - Remove stock (uses selling price)
