# .NET Backend Implementation Guide: Inventory Allocation Tracking

## Overview
This document outlines the backend implementation requirements for the Inventory Allocation Tracking feature. This feature enables tracking of inventory items that are allocated to users or paddy fields, maintaining a complete history of where inventory is distributed and used.

## Database Schema

### Table: InventoryAllocations

Create a new table to store inventory allocation records:

```sql
CREATE TABLE InventoryAllocations (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    InventoryItemId UNIQUEIDENTIFIER NOT NULL,
    Quantity DECIMAL(18,2) NOT NULL,
    AllocatedToType NVARCHAR(50) NOT NULL, -- 'user' or 'paddy_field'
    AllocatedToId UNIQUEIDENTIFIER NOT NULL,
    AllocatedToName NVARCHAR(255) NOT NULL, -- Denormalized for quick access
    Purpose NVARCHAR(500) NULL,
    Notes NVARCHAR(1000) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'allocated', -- 'allocated', 'consumed', 'returned'
    AllocationDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_InventoryAllocations_InventoryItems
        FOREIGN KEY (InventoryItemId) REFERENCES InventoryItems(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_AllocatedToType
        CHECK (AllocatedToType IN ('user', 'paddy_field')),
    CONSTRAINT CHK_Status
        CHECK (Status IN ('allocated', 'consumed', 'returned')),
    CONSTRAINT CHK_Quantity
        CHECK (Quantity > 0)
);

-- Indexes for performance
CREATE INDEX IX_InventoryAllocations_InventoryItemId ON InventoryAllocations(InventoryItemId);
CREATE INDEX IX_InventoryAllocations_AllocatedToType_Id ON InventoryAllocations(AllocatedToType, AllocatedToId);
CREATE INDEX IX_InventoryAllocations_AllocationDate ON InventoryAllocations(AllocationDate DESC);
CREATE INDEX IX_InventoryAllocations_Status ON InventoryAllocations(Status);
```

## Data Models

### InventoryAllocation Entity

```csharp
public class InventoryAllocation
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public decimal Quantity { get; set; }
    public string AllocatedToType { get; set; } // "user" or "paddy_field"
    public Guid AllocatedToId { get; set; }
    public string AllocatedToName { get; set; }
    public string Purpose { get; set; }
    public string Notes { get; set; }
    public string Status { get; set; } // "allocated", "consumed", "returned"
    public DateTime AllocationDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public virtual InventoryItem InventoryItem { get; set; }
}
```

### DTOs

#### CreateInventoryAllocationDto
```csharp
public class CreateInventoryAllocationDto
{
    [Required]
    public Guid InventoryItemId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; set; }

    [Required]
    [RegularExpression("^(user|paddy_field)$", ErrorMessage = "AllocatedToType must be 'user' or 'paddy_field'")]
    public string AllocatedToType { get; set; }

    [Required]
    public Guid AllocatedToId { get; set; }

    [MaxLength(500)]
    public string Purpose { get; set; }

    [MaxLength(1000)]
    public string Notes { get; set; }

    public DateTime AllocationDate { get; set; } = DateTime.UtcNow;
}
```

#### InventoryAllocationResponseDto
```csharp
public class InventoryAllocationResponseDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public decimal Quantity { get; set; }
    public string AllocatedToType { get; set; }
    public Guid AllocatedToId { get; set; }
    public string AllocatedToName { get; set; }
    public string Purpose { get; set; }
    public string Notes { get; set; }
    public string Status { get; set; }
    public DateTime AllocationDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Optional: Include item details
    public string ItemName { get; set; }
    public string ItemCode { get; set; }
    public string Unit { get; set; }
}
```

## API Endpoints

### 1. Allocate Inventory
**POST** `/api/Inventory/allocateInventory`

Allocates inventory to a user or paddy field and reduces the current stock.

**IMPORTANT**: The request body expects a DTO wrapper object with a `dto` property containing the allocation data.

**Request Body:**
```json
{
  "dto": {
    "inventoryItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 50.5,
    "allocatedToType": "user",
    "allocatedToId": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
    "purpose": "Fertilizer for paddy cultivation",
    "notes": "Allocated for Plot A cultivation",
    "allocationDate": "2024-02-28T10:30:00Z"
  }
}
```

**Alternative Request Body Format (Direct DTO - Recommended):**
```json
{
  "inventoryItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 50.5,
  "allocatedToType": "user",
  "allocatedToId": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
  "purpose": "Fertilizer for paddy cultivation",
  "notes": "Allocated for Plot A cultivation",
  "allocationDate": "2024-02-28T10:30:00Z"
}
```

**Note**: If the current implementation requires the `dto` wrapper, update the controller to accept the DTO directly using `[FromBody] CreateInventoryAllocationDto dto` without an additional wrapper object.

**Response:** `200 OK`

**Implementation Steps:**
1. Validate that the inventory item exists
2. Validate that the quantity is available in current stock
3. Determine the allocated entity name:
   - If `allocatedToType` is "user", fetch the user's name from Users table
   - If `allocatedToType` is "paddy_field", fetch the field name from PaddyFields table
4. Create the allocation record with status "allocated"
5. Reduce the inventory item's `CurrentStock` by the allocated quantity
6. Create a stock transaction record (type: "removal") for audit trail
7. Return success response
8. Use database transaction to ensure atomicity

**Example Implementation:**
```csharp
// RECOMMENDED: Accept DTO directly without wrapper
[HttpPost("allocateInventory")]
public async Task<IActionResult> AllocateInventory([FromBody] CreateInventoryAllocationDto dto)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        // 1. Get inventory item
        var item = await _context.InventoryItems.FindAsync(dto.InventoryItemId);
        if (item == null)
            return NotFound("Inventory item not found");

        // 2. Validate stock availability
        if (item.CurrentStock < dto.Quantity)
            return BadRequest($"Insufficient stock. Available: {item.CurrentStock} {item.Unit}");

        // 3. Get allocated entity name
        string allocatedToName = "";
        if (dto.AllocatedToType == "user")
        {
            var user = await _context.Users.FindAsync(dto.AllocatedToId);
            if (user == null)
                return NotFound("User not found");
            allocatedToName = user.Name;
        }
        else if (dto.AllocatedToType == "paddy_field")
        {
            var field = await _context.PaddyFields.FindAsync(dto.AllocatedToId);
            if (field == null)
                return NotFound("Paddy field not found");
            allocatedToName = field.FieldName;
        }

        // 4. Create allocation record
        var allocation = new InventoryAllocation
        {
            Id = Guid.NewGuid(),
            InventoryItemId = dto.InventoryItemId,
            Quantity = dto.Quantity,
            AllocatedToType = dto.AllocatedToType,
            AllocatedToId = dto.AllocatedToId,
            AllocatedToName = allocatedToName,
            Purpose = dto.Purpose,
            Notes = dto.Notes,
            Status = "allocated",
            AllocationDate = dto.AllocationDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.InventoryAllocations.Add(allocation);

        // 5. Reduce stock
        item.CurrentStock -= dto.Quantity;
        item.UpdatedAt = DateTime.UtcNow;

        // 6. Create stock transaction for audit
        var stockTransaction = new StockTransaction
        {
            Id = Guid.NewGuid(),
            InventoryItemId = dto.InventoryItemId,
            TransactionType = "removal",
            Quantity = dto.Quantity,
            ReferenceNumber = $"ALLOC-{allocation.Id.ToString().Substring(0, 8)}",
            Notes = $"Allocated to {allocatedToName} - {dto.Purpose}",
            TransactionDate = dto.AllocationDate
        };

        _context.StockTransactions.Add(stockTransaction);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { message = "Inventory allocated successfully", allocationId = allocation.Id });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        return StatusCode(500, $"Error allocating inventory: {ex.Message}");
    }
}
```

### 2. Get Allocations by Item
**GET** `/api/Inventory/getAllocationsByItem/{itemId}`

Retrieves all allocation records for a specific inventory item.

**Response:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inventoryItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
    "quantity": 50.5,
    "allocatedToType": "user",
    "allocatedToId": "3fa85f64-5717-4562-b3fc-2c963f66afa8",
    "allocatedToName": "John Doe",
    "purpose": "Fertilizer for paddy cultivation",
    "notes": "Allocated for Plot A cultivation",
    "status": "allocated",
    "allocationDate": "2024-02-28T10:30:00Z",
    "createdAt": "2024-02-28T10:30:00Z"
  }
]
```

**Implementation:**
```csharp
[HttpGet("getAllocationsByItem/{itemId}")]
public async Task<IActionResult> GetAllocationsByItem(Guid itemId)
{
    var allocations = await _context.InventoryAllocations
        .Where(a => a.InventoryItemId == itemId)
        .OrderByDescending(a => a.AllocationDate)
        .Select(a => new InventoryAllocationResponseDto
        {
            Id = a.Id,
            InventoryItemId = a.InventoryItemId,
            Quantity = a.Quantity,
            AllocatedToType = a.AllocatedToType,
            AllocatedToId = a.AllocatedToId,
            AllocatedToName = a.AllocatedToName,
            Purpose = a.Purpose,
            Notes = a.Notes,
            Status = a.Status,
            AllocationDate = a.AllocationDate,
            CreatedAt = a.CreatedAt
        })
        .ToListAsync();

    return Ok(allocations);
}
```

### 3. Get All Allocations
**GET** `/api/Inventory/getAllAllocations`

Retrieves all allocation records with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status ("allocated", "consumed", "returned")
- `allocatedToType` (optional): Filter by type ("user", "paddy_field")
- `fromDate` (optional): Filter allocations from this date
- `toDate` (optional): Filter allocations up to this date

**Implementation:**
```csharp
[HttpGet("getAllAllocations")]
public async Task<IActionResult> GetAllAllocations(
    [FromQuery] string status = null,
    [FromQuery] string allocatedToType = null,
    [FromQuery] DateTime? fromDate = null,
    [FromQuery] DateTime? toDate = null)
{
    var query = _context.InventoryAllocations
        .Include(a => a.InventoryItem)
        .AsQueryable();

    if (!string.IsNullOrEmpty(status))
        query = query.Where(a => a.Status == status);

    if (!string.IsNullOrEmpty(allocatedToType))
        query = query.Where(a => a.AllocatedToType == allocatedToType);

    if (fromDate.HasValue)
        query = query.Where(a => a.AllocationDate >= fromDate.Value);

    if (toDate.HasValue)
        query = query.Where(a => a.AllocationDate <= toDate.Value);

    var allocations = await query
        .OrderByDescending(a => a.AllocationDate)
        .Select(a => new InventoryAllocationResponseDto
        {
            Id = a.Id,
            InventoryItemId = a.InventoryItemId,
            Quantity = a.Quantity,
            AllocatedToType = a.AllocatedToType,
            AllocatedToId = a.AllocatedToId,
            AllocatedToName = a.AllocatedToName,
            Purpose = a.Purpose,
            Notes = a.Notes,
            Status = a.Status,
            AllocationDate = a.AllocationDate,
            CreatedAt = a.CreatedAt,
            ItemName = a.InventoryItem.ItemName,
            ItemCode = a.InventoryItem.ItemCode,
            Unit = a.InventoryItem.Unit
        })
        .ToListAsync();

    return Ok(allocations);
}
```

### 4. Get Allocations by User
**GET** `/api/Inventory/getAllocationsByUser/{userId}`

Retrieves all allocations for a specific user.

**Implementation:**
```csharp
[HttpGet("getAllocationsByUser/{userId}")]
public async Task<IActionResult> GetAllocationsByUser(Guid userId)
{
    var allocations = await _context.InventoryAllocations
        .Include(a => a.InventoryItem)
        .Where(a => a.AllocatedToType == "user" && a.AllocatedToId == userId)
        .OrderByDescending(a => a.AllocationDate)
        .Select(a => new InventoryAllocationResponseDto
        {
            Id = a.Id,
            InventoryItemId = a.InventoryItemId,
            Quantity = a.Quantity,
            AllocatedToType = a.AllocatedToType,
            AllocatedToId = a.AllocatedToId,
            AllocatedToName = a.AllocatedToName,
            Purpose = a.Purpose,
            Notes = a.Notes,
            Status = a.Status,
            AllocationDate = a.AllocationDate,
            CreatedAt = a.CreatedAt,
            ItemName = a.InventoryItem.ItemName,
            ItemCode = a.InventoryItem.ItemCode,
            Unit = a.InventoryItem.Unit
        })
        .ToListAsync();

    return Ok(allocations);
}
```

### 5. Get Allocations by Paddy Field
**GET** `/api/Inventory/getAllocationsByPaddyField/{fieldId}`

Retrieves all allocations for a specific paddy field.

**Implementation:**
```csharp
[HttpGet("getAllocationsByPaddyField/{fieldId}")]
public async Task<IActionResult> GetAllocationsByPaddyField(Guid fieldId)
{
    var allocations = await _context.InventoryAllocations
        .Include(a => a.InventoryItem)
        .Where(a => a.AllocatedToType == "paddy_field" && a.AllocatedToId == fieldId)
        .OrderByDescending(a => a.AllocationDate)
        .Select(a => new InventoryAllocationResponseDto
        {
            Id = a.Id,
            InventoryItemId = a.InventoryItemId,
            Quantity = a.Quantity,
            AllocatedToType = a.AllocatedToType,
            AllocatedToId = a.AllocatedToId,
            AllocatedToName = a.AllocatedToName,
            Purpose = a.Purpose,
            Notes = a.Notes,
            Status = a.Status,
            AllocationDate = a.AllocationDate,
            CreatedAt = a.CreatedAt,
            ItemName = a.InventoryItem.ItemName,
            ItemCode = a.InventoryItem.ItemCode,
            Unit = a.InventoryItem.Unit
        })
        .ToListAsync();

    return Ok(allocations);
}
```

### 6. Update Allocation Status (Optional)
**PUT** `/api/Inventory/updateAllocationStatus/{allocationId}`

Updates the status of an allocation (e.g., from "allocated" to "consumed" or "returned").

**Request Body:**
```json
{
  "status": "consumed",
  "notes": "Fertilizer applied to the field"
}
```

**Implementation:**
```csharp
[HttpPut("updateAllocationStatus/{allocationId}")]
public async Task<IActionResult> UpdateAllocationStatus(
    Guid allocationId,
    [FromBody] UpdateAllocationStatusDto dto)
{
    var allocation = await _context.InventoryAllocations.FindAsync(allocationId);

    if (allocation == null)
        return NotFound("Allocation not found");

    // If returning stock, add it back to inventory
    if (dto.Status == "returned" && allocation.Status != "returned")
    {
        var item = await _context.InventoryItems.FindAsync(allocation.InventoryItemId);
        if (item != null)
        {
            item.CurrentStock += allocation.Quantity;
            item.UpdatedAt = DateTime.UtcNow;

            // Create stock transaction for audit
            var stockTransaction = new StockTransaction
            {
                Id = Guid.NewGuid(),
                InventoryItemId = allocation.InventoryItemId,
                TransactionType = "addition",
                Quantity = allocation.Quantity,
                ReferenceNumber = $"RETURN-{allocation.Id.ToString().Substring(0, 8)}",
                Notes = $"Returned from {allocation.AllocatedToName}",
                TransactionDate = DateTime.UtcNow
            };

            _context.StockTransactions.Add(stockTransaction);
        }
    }

    allocation.Status = dto.Status;
    allocation.Notes = dto.Notes ?? allocation.Notes;
    allocation.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new { message = "Allocation status updated successfully" });
}
```

## Business Rules

1. **Stock Validation**: Before allocating inventory, ensure sufficient stock is available (`CurrentStock >= Quantity`)

2. **Entity Validation**: Validate that the user or paddy field exists before creating the allocation

3. **Atomic Operations**: Use database transactions to ensure stock reduction and allocation creation happen together

4. **Audit Trail**: Create corresponding stock transactions for each allocation for complete audit history

5. **Status Management**:
   - Default status is "allocated"
   - Can be updated to "consumed" when used
   - Can be updated to "returned" if stock comes back (which should add back to inventory)

6. **Denormalization**: Store the allocated entity name (`AllocatedToName`) in the allocation record for faster queries and reporting

## Error Handling

Implement proper error handling for:
- Insufficient stock errors
- Invalid inventory item ID
- Invalid user/paddy field ID
- Database transaction failures
- Concurrent update conflicts

## Testing Checklist

- [ ] Allocate inventory to a user
- [ ] Allocate inventory to a paddy field
- [ ] Verify stock is reduced correctly
- [ ] Verify stock transaction is created
- [ ] Test insufficient stock scenario
- [ ] Test invalid user ID scenario
- [ ] Test invalid paddy field ID scenario
- [ ] Retrieve allocations by item
- [ ] Retrieve allocations by user
- [ ] Retrieve allocations by paddy field
- [ ] Update allocation status to consumed
- [ ] Update allocation status to returned (verify stock is added back)
- [ ] Test filtering by date range
- [ ] Test filtering by status
- [ ] Test concurrent allocation attempts
- [ ] Verify database constraints

## Performance Considerations

1. **Indexes**: Ensure proper indexes are created on foreign keys and frequently queried fields
2. **Pagination**: Implement pagination for listing all allocations if dataset grows large
3. **Caching**: Consider caching frequently accessed item/user/field names
4. **Bulk Operations**: Consider implementing bulk allocation if needed in the future

## Security Considerations

1. **Authorization**: Implement proper role-based access control
2. **Validation**: Validate all input data thoroughly
3. **SQL Injection**: Use parameterized queries (handled by Entity Framework)
4. **Audit Logging**: Log all allocation operations for security audit

## Troubleshooting Common Issues

### Error: "The dto field is required"

**Cause**: The controller is expecting a wrapper object with a `dto` property instead of the DTO directly.

**Solution**: Update your controller method signature to accept the DTO directly:

```csharp
// CORRECT - Direct DTO binding
[HttpPost("allocateInventory")]
public async Task<IActionResult> AllocateInventory([FromBody] CreateInventoryAllocationDto dto)

// INCORRECT - Wrapper object binding
[HttpPost("allocateInventory")]
public async Task<IActionResult> AllocateInventory([FromBody] AllocationWrapper wrapper)
public class AllocationWrapper { public CreateInventoryAllocationDto dto { get; set; } }
```

### Error: "The JSON value could not be converted to System.Guid"

**Cause**: The frontend is sending string IDs that cannot be parsed as GUIDs, or the JSON property names don't match.

**Solution**:
1. Ensure all GUID fields use proper JSON property naming (camelCase in JSON, PascalCase in C#)
2. Use `[JsonPropertyName]` attributes if needed:
```csharp
[JsonPropertyName("inventoryItemId")]
public Guid InventoryItemId { get; set; }
```
3. Ensure the frontend sends valid GUID strings (format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")

### Error: "Insufficient stock"

**Cause**: Attempting to allocate more than the available current stock.

**Solution**:
1. Frontend should validate quantity against `current_stock` before submission
2. Backend should return a clear error message with available stock amount
3. Consider implementing a warning threshold (e.g., warn if allocating >80% of stock)

### Performance Issues with Large Datasets

**Solution**:
1. Implement pagination on the `getAllAllocations` endpoint:
```csharp
[HttpGet("getAllAllocations")]
public async Task<IActionResult> GetAllAllocations(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50,
    [FromQuery] string status = null)
{
    var query = _context.InventoryAllocations.AsQueryable();
    // ... apply filters ...

    var total = await query.CountAsync();
    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Ok(new { total, page, pageSize, items });
}
```

2. Add database indexes (already included in schema)
3. Consider caching frequently accessed data

## Future Enhancements

1. Add ability to partially return inventory
2. Add allocation approval workflow
3. Add allocation expiry dates
4. Generate allocation reports and analytics
5. Send notifications on allocation/consumption
6. Track allocation costs based on unit price
7. Add bulk allocation support
8. Implement allocation templates for common scenarios
9. Add allocation forecasting based on historical data
10. Support for allocation transfers between users/fields
