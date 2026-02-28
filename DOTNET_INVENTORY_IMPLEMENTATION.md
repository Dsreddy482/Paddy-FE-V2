# .NET Backend Implementation - Inventory Management Feature

## Overview
This document provides a complete implementation guide for the Inventory Management feature in .NET, including database schema, models, repositories, services, and API endpoints.

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [Model Implementation](#model-implementation)
3. [DTOs](#dtos-data-transfer-objects)
4. [Repository Layer](#repository-layer)
5. [Service Layer](#service-layer)
6. [Controller](#controller)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)

---

## Database Schema

### Inventory Items Table

```sql
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('seeds', 'fertilizers', 'pesticides', 'equipment', 'other')),
  unit TEXT NOT NULL,
  current_stock NUMERIC NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock NUMERIC NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_item_code ON inventory_items(item_code);
```

### Inventory Stock Transactions Table

```sql
CREATE TABLE IF NOT EXISTS inventory_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_transactions_item ON inventory_stock_transactions(inventory_item_id);
CREATE INDEX idx_stock_transactions_date ON inventory_stock_transactions(transaction_date);
CREATE INDEX idx_stock_transactions_type ON inventory_stock_transactions(transaction_type);
```

---

## Model Implementation

### InventoryItem.cs

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagementAPI.Models
{
    /// <summary>
    /// Represents an inventory item in the system
    /// </summary>
    [Table("inventory_items")]
    public class InventoryItem
    {
        /// <summary>
        /// Unique identifier for the inventory item
        /// </summary>
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Unique code for the inventory item
        /// </summary>
        [Required(ErrorMessage = "Item code is required")]
        [StringLength(50, ErrorMessage = "Item code cannot exceed 50 characters")]
        [Column("item_code")]
        public string ItemCode { get; set; } = string.Empty;

        /// <summary>
        /// Name of the inventory item
        /// </summary>
        [Required(ErrorMessage = "Item name is required")]
        [StringLength(200, ErrorMessage = "Item name cannot exceed 200 characters")]
        [Column("item_name")]
        public string ItemName { get; set; } = string.Empty;

        /// <summary>
        /// Description of the inventory item
        /// </summary>
        [Column("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Category of the item (seeds, fertilizers, pesticides, equipment, other)
        /// </summary>
        [Required(ErrorMessage = "Category is required")]
        [Column("category")]
        public string Category { get; set; } = "other";

        /// <summary>
        /// Unit of measurement (kg, liters, bags, pieces, etc.)
        /// </summary>
        [Required(ErrorMessage = "Unit is required")]
        [StringLength(50, ErrorMessage = "Unit cannot exceed 50 characters")]
        [Column("unit")]
        public string Unit { get; set; } = string.Empty;

        /// <summary>
        /// Current stock quantity
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Current stock cannot be negative")]
        [Column("current_stock")]
        public decimal CurrentStock { get; set; } = 0;

        /// <summary>
        /// Minimum stock level for alerts
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Minimum stock cannot be negative")]
        [Column("minimum_stock")]
        public decimal MinimumStock { get; set; } = 0;

        /// <summary>
        /// Unit price of the item
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Unit price cannot be negative")]
        [Column("unit_price")]
        public decimal UnitPrice { get; set; } = 0;

        /// <summary>
        /// Status of the inventory item (active, inactive)
        /// </summary>
        [Required(ErrorMessage = "Status is required")]
        [Column("status")]
        public string Status { get; set; } = "active";

        /// <summary>
        /// Timestamp when the item was created
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when the item was last updated
        /// </summary>
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Navigation property for stock transactions
        /// </summary>
        public ICollection<InventoryStockTransaction> StockTransactions { get; set; } = new List<InventoryStockTransaction>();

        /// <summary>
        /// Checks if stock is below minimum level
        /// </summary>
        public bool IsLowStock() => CurrentStock <= MinimumStock;

        /// <summary>
        /// Validates if the category is one of the allowed values
        /// </summary>
        public bool IsValidCategory()
        {
            var allowedCategories = new[] { "seeds", "fertilizers", "pesticides", "equipment", "other" };
            return allowedCategories.Contains(Category.ToLower());
        }

        /// <summary>
        /// Validates if the status is one of the allowed values
        /// </summary>
        public bool IsValidStatus()
        {
            var allowedStatuses = new[] { "active", "inactive" };
            return allowedStatuses.Contains(Status.ToLower());
        }
    }
}
```

### InventoryStockTransaction.cs

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagementAPI.Models
{
    /// <summary>
    /// Represents a stock transaction for inventory items
    /// </summary>
    [Table("inventory_stock_transactions")]
    public class InventoryStockTransaction
    {
        /// <summary>
        /// Unique identifier for the transaction
        /// </summary>
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Reference to the inventory item
        /// </summary>
        [Required]
        [Column("inventory_item_id")]
        public Guid InventoryItemId { get; set; }

        /// <summary>
        /// Type of transaction (in, out, adjustment)
        /// </summary>
        [Required(ErrorMessage = "Transaction type is required")]
        [Column("transaction_type")]
        public string TransactionType { get; set; } = string.Empty;

        /// <summary>
        /// Quantity of items (positive for in, negative for out)
        /// </summary>
        [Required(ErrorMessage = "Quantity is required")]
        [Column("quantity")]
        public decimal Quantity { get; set; }

        /// <summary>
        /// Reference number for the transaction
        /// </summary>
        [Column("reference_number")]
        public string? ReferenceNumber { get; set; }

        /// <summary>
        /// Additional notes about the transaction
        /// </summary>
        [Column("notes")]
        public string? Notes { get; set; }

        /// <summary>
        /// User who created this transaction
        /// </summary>
        [Required]
        [Column("created_by")]
        public Guid CreatedBy { get; set; }

        /// <summary>
        /// Date and time of the transaction
        /// </summary>
        [Column("transaction_date")]
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when the record was created
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Navigation property to the inventory item
        /// </summary>
        [ForeignKey("InventoryItemId")]
        public InventoryItem? InventoryItem { get; set; }

        /// <summary>
        /// Validates if the transaction type is one of the allowed values
        /// </summary>
        public bool IsValidTransactionType()
        {
            var allowedTypes = new[] { "in", "out", "adjustment" };
            return allowedTypes.Contains(TransactionType.ToLower());
        }
    }
}
```

---

## DTOs (Data Transfer Objects)

### InventoryItemDto.cs

```csharp
namespace PaddyManagementAPI.DTOs.Inventory
{
    /// <summary>
    /// DTO for returning inventory item data
    /// </summary>
    public class InventoryItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal CurrentStock { get; set; }
        public decimal MinimumStock { get; set; }
        public decimal UnitPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsLowStock { get; set; }
    }
}
```

### CreateInventoryItemDto.cs

```csharp
using System.ComponentModel.DataAnnotations;

namespace PaddyManagementAPI.DTOs.Inventory
{
    /// <summary>
    /// DTO for creating a new inventory item
    /// </summary>
    public class CreateInventoryItemDto
    {
        [Required(ErrorMessage = "Item code is required")]
        [StringLength(50, ErrorMessage = "Item code cannot exceed 50 characters")]
        public string ItemCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Item name is required")]
        [StringLength(200, ErrorMessage = "Item name cannot exceed 200 characters")]
        public string ItemName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Category is required")]
        [RegularExpression("^(seeds|fertilizers|pesticides|equipment|other)$",
            ErrorMessage = "Category must be one of: seeds, fertilizers, pesticides, equipment, other")]
        public string Category { get; set; } = "other";

        [Required(ErrorMessage = "Unit is required")]
        [StringLength(50, ErrorMessage = "Unit cannot exceed 50 characters")]
        public string Unit { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Current stock cannot be negative")]
        public decimal CurrentStock { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Minimum stock cannot be negative")]
        public decimal MinimumStock { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Unit price cannot be negative")]
        public decimal UnitPrice { get; set; } = 0;

        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(active|inactive)$", ErrorMessage = "Status must be 'active' or 'inactive'")]
        public string Status { get; set; } = "active";
    }
}
```

### UpdateInventoryItemDto.cs

```csharp
using System.ComponentModel.DataAnnotations;

namespace PaddyManagementAPI.DTOs.Inventory
{
    /// <summary>
    /// DTO for updating an existing inventory item
    /// </summary>
    public class UpdateInventoryItemDto
    {
        [Required(ErrorMessage = "Item name is required")]
        [StringLength(200, ErrorMessage = "Item name cannot exceed 200 characters")]
        public string ItemName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Category is required")]
        [RegularExpression("^(seeds|fertilizers|pesticides|equipment|other)$",
            ErrorMessage = "Category must be one of: seeds, fertilizers, pesticides, equipment, other")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Unit is required")]
        [StringLength(50, ErrorMessage = "Unit cannot exceed 50 characters")]
        public string Unit { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Minimum stock cannot be negative")]
        public decimal MinimumStock { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Unit price cannot be negative")]
        public decimal UnitPrice { get; set; }

        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(active|inactive)$", ErrorMessage = "Status must be 'active' or 'inactive'")]
        public string Status { get; set; } = string.Empty;
    }
}
```

### StockTransactionDto.cs

```csharp
namespace PaddyManagementAPI.DTOs.Inventory
{
    /// <summary>
    /// DTO for returning stock transaction data
    /// </summary>
    public class StockTransactionDto
    {
        public string Id { get; set; } = string.Empty;
        public string InventoryItemId { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
        public DateTime TransactionDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public InventoryItemDto? InventoryItem { get; set; }
    }
}
```

### CreateStockTransactionDto.cs

```csharp
using System.ComponentModel.DataAnnotations;

namespace PaddyManagementAPI.DTOs.Inventory
{
    /// <summary>
    /// DTO for creating a stock transaction
    /// </summary>
    public class CreateStockTransactionDto
    {
        [Required(ErrorMessage = "Inventory item ID is required")]
        public string InventoryItemId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Transaction type is required")]
        [RegularExpression("^(in|out|adjustment)$",
            ErrorMessage = "Transaction type must be 'in', 'out', or 'adjustment'")]
        public string TransactionType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quantity is required")]
        public decimal Quantity { get; set; }

        public string? ReferenceNumber { get; set; }

        public string? Notes { get; set; }

        public DateTime? TransactionDate { get; set; }
    }
}
```

---

## Repository Layer

### IInventoryRepository.cs

```csharp
using PaddyManagementAPI.Models;

namespace PaddyManagementAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interface for inventory repository operations
    /// </summary>
    public interface IInventoryRepository
    {
        Task<InventoryItem?> GetByIdAsync(Guid id);
        Task<IEnumerable<InventoryItem>> GetAllAsync();
        Task<InventoryItem> CreateAsync(InventoryItem item);
        Task<InventoryItem> UpdateAsync(InventoryItem item);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<InventoryItem>> GetByCategoryAsync(string category);
        Task<IEnumerable<InventoryItem>> GetActiveItemsAsync();
        Task<IEnumerable<InventoryItem>> GetLowStockItemsAsync();
        Task<IEnumerable<InventoryItem>> SearchAsync(string searchTerm);
        Task<bool> ExistsByCodeAsync(string itemCode, Guid? excludeId = null);
        Task<bool> UpdateStockAsync(Guid itemId, decimal newStock);
    }
}
```

### IStockTransactionRepository.cs

```csharp
using PaddyManagementAPI.Models;

namespace PaddyManagementAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interface for stock transaction repository operations
    /// </summary>
    public interface IStockTransactionRepository
    {
        Task<InventoryStockTransaction> CreateAsync(InventoryStockTransaction transaction);
        Task<IEnumerable<InventoryStockTransaction>> GetByItemIdAsync(Guid itemId);
        Task<IEnumerable<InventoryStockTransaction>> GetAllAsync(int limit = 100);
        Task<IEnumerable<InventoryStockTransaction>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
}
```

### InventoryRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using PaddyManagementAPI.Data;
using PaddyManagementAPI.Models;
using PaddyManagementAPI.Repositories.Interfaces;

namespace PaddyManagementAPI.Repositories.Implementations
{
    /// <summary>
    /// Repository implementation for inventory operations
    /// </summary>
    public class InventoryRepository : IInventoryRepository
    {
        private readonly ApplicationDbContext _context;

        public InventoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InventoryItem?> GetByIdAsync(Guid id)
        {
            return await _context.InventoryItems.FindAsync(id);
        }

        public async Task<IEnumerable<InventoryItem>> GetAllAsync()
        {
            return await _context.InventoryItems
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<InventoryItem> CreateAsync(InventoryItem item)
        {
            item.CreatedAt = DateTime.UtcNow;
            item.UpdatedAt = DateTime.UtcNow;

            _context.InventoryItems.Add(item);
            await _context.SaveChangesAsync();

            return item;
        }

        public async Task<InventoryItem> UpdateAsync(InventoryItem item)
        {
            item.UpdatedAt = DateTime.UtcNow;

            _context.InventoryItems.Update(item);
            await _context.SaveChangesAsync();

            return item;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var item = await GetByIdAsync(id);
            if (item == null)
                return false;

            _context.InventoryItems.Remove(item);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<InventoryItem>> GetByCategoryAsync(string category)
        {
            return await _context.InventoryItems
                .Where(i => i.Category.ToLower() == category.ToLower())
                .OrderBy(i => i.ItemName)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryItem>> GetActiveItemsAsync()
        {
            return await _context.InventoryItems
                .Where(i => i.Status.ToLower() == "active")
                .OrderBy(i => i.ItemName)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryItem>> GetLowStockItemsAsync()
        {
            return await _context.InventoryItems
                .Where(i => i.Status.ToLower() == "active" && i.CurrentStock <= i.MinimumStock)
                .OrderBy(i => i.ItemName)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryItem>> SearchAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetAllAsync();

            var lowerSearchTerm = searchTerm.ToLower();

            return await _context.InventoryItems
                .Where(i => i.ItemName.ToLower().Contains(lowerSearchTerm) ||
                           i.ItemCode.ToLower().Contains(lowerSearchTerm) ||
                           (i.Description != null && i.Description.ToLower().Contains(lowerSearchTerm)))
                .OrderBy(i => i.ItemName)
                .ToListAsync();
        }

        public async Task<bool> ExistsByCodeAsync(string itemCode, Guid? excludeId = null)
        {
            var query = _context.InventoryItems
                .Where(i => i.ItemCode.ToLower() == itemCode.ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(i => i.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> UpdateStockAsync(Guid itemId, decimal newStock)
        {
            var item = await GetByIdAsync(itemId);
            if (item == null)
                return false;

            item.CurrentStock = newStock;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
```

### StockTransactionRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using PaddyManagementAPI.Data;
using PaddyManagementAPI.Models;
using PaddyManagementAPI.Repositories.Interfaces;

namespace PaddyManagementAPI.Repositories.Implementations
{
    /// <summary>
    /// Repository implementation for stock transaction operations
    /// </summary>
    public class StockTransactionRepository : IStockTransactionRepository
    {
        private readonly ApplicationDbContext _context;

        public StockTransactionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InventoryStockTransaction> CreateAsync(InventoryStockTransaction transaction)
        {
            transaction.CreatedAt = DateTime.UtcNow;
            transaction.TransactionDate = transaction.TransactionDate == default
                ? DateTime.UtcNow
                : transaction.TransactionDate;

            _context.InventoryStockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return transaction;
        }

        public async Task<IEnumerable<InventoryStockTransaction>> GetByItemIdAsync(Guid itemId)
        {
            return await _context.InventoryStockTransactions
                .Include(t => t.InventoryItem)
                .Where(t => t.InventoryItemId == itemId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryStockTransaction>> GetAllAsync(int limit = 100)
        {
            return await _context.InventoryStockTransactions
                .Include(t => t.InventoryItem)
                .OrderByDescending(t => t.TransactionDate)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryStockTransaction>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.InventoryStockTransactions
                .Include(t => t.InventoryItem)
                .Where(t => t.TransactionDate >= startDate && t.TransactionDate <= endDate)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }
    }
}
```

---

## Service Layer

### IInventoryService.cs

```csharp
using PaddyManagementAPI.DTOs.Inventory;

namespace PaddyManagementAPI.Services.Interfaces
{
    /// <summary>
    /// Interface for inventory business logic
    /// </summary>
    public interface IInventoryService
    {
        Task<InventoryItemDto?> GetItemAsync(Guid id);
        Task<IEnumerable<InventoryItemDto>> GetAllItemsAsync();
        Task<InventoryItemDto> CreateItemAsync(CreateInventoryItemDto dto);
        Task<InventoryItemDto> UpdateItemAsync(Guid id, UpdateInventoryItemDto dto);
        Task<bool> DeleteItemAsync(Guid id);
        Task<IEnumerable<InventoryItemDto>> GetItemsByCategoryAsync(string category);
        Task<IEnumerable<InventoryItemDto>> GetActiveItemsAsync();
        Task<IEnumerable<InventoryItemDto>> GetLowStockItemsAsync();
        Task<IEnumerable<InventoryItemDto>> SearchItemsAsync(string searchTerm);
        Task AddStockAsync(CreateStockTransactionDto dto, Guid userId);
        Task RemoveStockAsync(CreateStockTransactionDto dto, Guid userId);
        Task AdjustStockAsync(CreateStockTransactionDto dto, decimal newStock, Guid userId);
        Task<IEnumerable<StockTransactionDto>> GetTransactionsByItemAsync(Guid itemId);
        Task<IEnumerable<StockTransactionDto>> GetAllTransactionsAsync();
    }
}
```

### InventoryService.cs

```csharp
using PaddyManagementAPI.DTOs.Inventory;
using PaddyManagementAPI.Models;
using PaddyManagementAPI.Repositories.Interfaces;
using PaddyManagementAPI.Services.Interfaces;

namespace PaddyManagementAPI.Services.Implementations
{
    /// <summary>
    /// Service implementation for inventory business logic
    /// </summary>
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IStockTransactionRepository _transactionRepository;

        public InventoryService(
            IInventoryRepository inventoryRepository,
            IStockTransactionRepository transactionRepository)
        {
            _inventoryRepository = inventoryRepository;
            _transactionRepository = transactionRepository;
        }

        public async Task<InventoryItemDto?> GetItemAsync(Guid id)
        {
            var item = await _inventoryRepository.GetByIdAsync(id);
            return item == null ? null : MapToDto(item);
        }

        public async Task<IEnumerable<InventoryItemDto>> GetAllItemsAsync()
        {
            var items = await _inventoryRepository.GetAllAsync();
            return items.Select(MapToDto);
        }

        public async Task<InventoryItemDto> CreateItemAsync(CreateInventoryItemDto dto)
        {
            if (await _inventoryRepository.ExistsByCodeAsync(dto.ItemCode))
            {
                throw new InvalidOperationException($"An item with code '{dto.ItemCode}' already exists");
            }

            var item = new InventoryItem
            {
                ItemCode = dto.ItemCode,
                ItemName = dto.ItemName,
                Description = dto.Description,
                Category = dto.Category.ToLower(),
                Unit = dto.Unit,
                CurrentStock = dto.CurrentStock,
                MinimumStock = dto.MinimumStock,
                UnitPrice = dto.UnitPrice,
                Status = dto.Status.ToLower()
            };

            if (!item.IsValidCategory())
            {
                throw new ArgumentException("Invalid category");
            }

            if (!item.IsValidStatus())
            {
                throw new ArgumentException("Invalid status");
            }

            var created = await _inventoryRepository.CreateAsync(item);
            return MapToDto(created);
        }

        public async Task<InventoryItemDto> UpdateItemAsync(Guid id, UpdateInventoryItemDto dto)
        {
            var item = await _inventoryRepository.GetByIdAsync(id);
            if (item == null)
            {
                throw new KeyNotFoundException($"Inventory item with ID {id} not found");
            }

            item.ItemName = dto.ItemName;
            item.Description = dto.Description;
            item.Category = dto.Category.ToLower();
            item.Unit = dto.Unit;
            item.MinimumStock = dto.MinimumStock;
            item.UnitPrice = dto.UnitPrice;
            item.Status = dto.Status.ToLower();

            if (!item.IsValidCategory())
            {
                throw new ArgumentException("Invalid category");
            }

            if (!item.IsValidStatus())
            {
                throw new ArgumentException("Invalid status");
            }

            var updated = await _inventoryRepository.UpdateAsync(item);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteItemAsync(Guid id)
        {
            var exists = await _inventoryRepository.GetByIdAsync(id);
            if (exists == null)
            {
                throw new KeyNotFoundException($"Inventory item with ID {id} not found");
            }

            return await _inventoryRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<InventoryItemDto>> GetItemsByCategoryAsync(string category)
        {
            var items = await _inventoryRepository.GetByCategoryAsync(category);
            return items.Select(MapToDto);
        }

        public async Task<IEnumerable<InventoryItemDto>> GetActiveItemsAsync()
        {
            var items = await _inventoryRepository.GetActiveItemsAsync();
            return items.Select(MapToDto);
        }

        public async Task<IEnumerable<InventoryItemDto>> GetLowStockItemsAsync()
        {
            var items = await _inventoryRepository.GetLowStockItemsAsync();
            return items.Select(MapToDto);
        }

        public async Task<IEnumerable<InventoryItemDto>> SearchItemsAsync(string searchTerm)
        {
            var items = await _inventoryRepository.SearchAsync(searchTerm);
            return items.Select(MapToDto);
        }

        public async Task AddStockAsync(CreateStockTransactionDto dto, Guid userId)
        {
            var itemId = Guid.Parse(dto.InventoryItemId);
            var item = await _inventoryRepository.GetByIdAsync(itemId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Inventory item with ID {itemId} not found");
            }

            var newStock = item.CurrentStock + Math.Abs(dto.Quantity);
            await _inventoryRepository.UpdateStockAsync(itemId, newStock);

            var transaction = new InventoryStockTransaction
            {
                InventoryItemId = itemId,
                TransactionType = "in",
                Quantity = Math.Abs(dto.Quantity),
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes,
                CreatedBy = userId,
                TransactionDate = dto.TransactionDate ?? DateTime.UtcNow
            };

            await _transactionRepository.CreateAsync(transaction);
        }

        public async Task RemoveStockAsync(CreateStockTransactionDto dto, Guid userId)
        {
            var itemId = Guid.Parse(dto.InventoryItemId);
            var item = await _inventoryRepository.GetByIdAsync(itemId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Inventory item with ID {itemId} not found");
            }

            var newStock = Math.Max(0, item.CurrentStock - Math.Abs(dto.Quantity));
            await _inventoryRepository.UpdateStockAsync(itemId, newStock);

            var transaction = new InventoryStockTransaction
            {
                InventoryItemId = itemId,
                TransactionType = "out",
                Quantity = -Math.Abs(dto.Quantity),
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes,
                CreatedBy = userId,
                TransactionDate = dto.TransactionDate ?? DateTime.UtcNow
            };

            await _transactionRepository.CreateAsync(transaction);
        }

        public async Task AdjustStockAsync(CreateStockTransactionDto dto, decimal newStock, Guid userId)
        {
            var itemId = Guid.Parse(dto.InventoryItemId);
            var item = await _inventoryRepository.GetByIdAsync(itemId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Inventory item with ID {itemId} not found");
            }

            await _inventoryRepository.UpdateStockAsync(itemId, newStock);

            var transaction = new InventoryStockTransaction
            {
                InventoryItemId = itemId,
                TransactionType = "adjustment",
                Quantity = dto.Quantity,
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes,
                CreatedBy = userId,
                TransactionDate = dto.TransactionDate ?? DateTime.UtcNow
            };

            await _transactionRepository.CreateAsync(transaction);
        }

        public async Task<IEnumerable<StockTransactionDto>> GetTransactionsByItemAsync(Guid itemId)
        {
            var transactions = await _transactionRepository.GetByItemIdAsync(itemId);
            return transactions.Select(MapTransactionToDto);
        }

        public async Task<IEnumerable<StockTransactionDto>> GetAllTransactionsAsync()
        {
            var transactions = await _transactionRepository.GetAllAsync();
            return transactions.Select(MapTransactionToDto);
        }

        private static InventoryItemDto MapToDto(InventoryItem item)
        {
            return new InventoryItemDto
            {
                Id = item.Id.ToString(),
                ItemCode = item.ItemCode,
                ItemName = item.ItemName,
                Description = item.Description,
                Category = item.Category,
                Unit = item.Unit,
                CurrentStock = item.CurrentStock,
                MinimumStock = item.MinimumStock,
                UnitPrice = item.UnitPrice,
                Status = item.Status,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                IsLowStock = item.IsLowStock()
            };
        }

        private static StockTransactionDto MapTransactionToDto(InventoryStockTransaction transaction)
        {
            return new StockTransactionDto
            {
                Id = transaction.Id.ToString(),
                InventoryItemId = transaction.InventoryItemId.ToString(),
                TransactionType = transaction.TransactionType,
                Quantity = transaction.Quantity,
                ReferenceNumber = transaction.ReferenceNumber,
                Notes = transaction.Notes,
                TransactionDate = transaction.TransactionDate,
                CreatedAt = transaction.CreatedAt,
                InventoryItem = transaction.InventoryItem != null ? MapToDto(transaction.InventoryItem) : null
            };
        }
    }
}
```

---

## Controller

### InventoryController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaddyManagementAPI.DTOs.Inventory;
using PaddyManagementAPI.Services.Interfaces;
using System.Security.Claims;

namespace PaddyManagementAPI.Controllers
{
    /// <summary>
    /// API controller for managing inventory
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _service;
        private readonly ILogger<InventoryController> _logger;

        public InventoryController(
            IInventoryService service,
            ILogger<InventoryController> logger)
        {
            _service = service;
            _logger = logger;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim ?? throw new UnauthorizedAccessException("User ID not found"));
        }

        [HttpGet("getAllItems")]
        [ProducesResponseType(typeof(IEnumerable<InventoryItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InventoryItemDto>>> GetAllItems()
        {
            try
            {
                var items = await _service.GetAllItemsAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all inventory items");
                return StatusCode(500, new { message = "An error occurred while retrieving inventory items" });
            }
        }

        [HttpGet("getItem/{id}")]
        [ProducesResponseType(typeof(InventoryItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<InventoryItemDto>> GetItem(Guid id)
        {
            try
            {
                var item = await _service.GetItemAsync(id);
                if (item == null)
                {
                    return NotFound(new { message = $"Inventory item with ID {id} not found" });
                }

                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving inventory item {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the inventory item" });
            }
        }

        [HttpPost("createItem")]
        [ProducesResponseType(typeof(InventoryItemDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<InventoryItemDto>> CreateItem([FromBody] CreateInventoryItemDto dto)
        {
            try
            {
                var created = await _service.CreateItemAsync(dto);
                return CreatedAtAction(nameof(GetItem), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating inventory item");
                return StatusCode(500, new { message = "An error occurred while creating the inventory item" });
            }
        }

        [HttpPut("updateItem/{id}")]
        [ProducesResponseType(typeof(InventoryItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<InventoryItemDto>> UpdateItem(Guid id, [FromBody] UpdateInventoryItemDto dto)
        {
            try
            {
                var updated = await _service.UpdateItemAsync(id, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating inventory item {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the inventory item" });
            }
        }

        [HttpDelete("deleteItem/{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> DeleteItem(Guid id)
        {
            try
            {
                await _service.DeleteItemAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting inventory item {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the inventory item" });
            }
        }

        [HttpGet("getItemsByCategory/{category}")]
        [ProducesResponseType(typeof(IEnumerable<InventoryItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InventoryItemDto>>> GetItemsByCategory(string category)
        {
            try
            {
                var items = await _service.GetItemsByCategoryAsync(category);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving items by category {Category}", category);
                return StatusCode(500, new { message = "An error occurred while retrieving items" });
            }
        }

        [HttpGet("getActiveItems")]
        [ProducesResponseType(typeof(IEnumerable<InventoryItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InventoryItemDto>>> GetActiveItems()
        {
            try
            {
                var items = await _service.GetActiveItemsAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active items");
                return StatusCode(500, new { message = "An error occurred while retrieving active items" });
            }
        }

        [HttpGet("getLowStockItems")]
        [ProducesResponseType(typeof(IEnumerable<InventoryItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InventoryItemDto>>> GetLowStockItems()
        {
            try
            {
                var items = await _service.GetLowStockItemsAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving low stock items");
                return StatusCode(500, new { message = "An error occurred while retrieving low stock items" });
            }
        }

        [HttpPost("searchItems")]
        [ProducesResponseType(typeof(IEnumerable<InventoryItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InventoryItemDto>>> SearchItems([FromBody] SearchRequest request)
        {
            try
            {
                var items = await _service.SearchItemsAsync(request.Search ?? string.Empty);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching items");
                return StatusCode(500, new { message = "An error occurred while searching items" });
            }
        }

        [HttpPost("addStock")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult> AddStock([FromBody] CreateStockTransactionDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _service.AddStockAsync(dto, userId);
                return Ok(new { message = "Stock added successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding stock");
                return StatusCode(500, new { message = "An error occurred while adding stock" });
            }
        }

        [HttpPost("removeStock")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult> RemoveStock([FromBody] CreateStockTransactionDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _service.RemoveStockAsync(dto, userId);
                return Ok(new { message = "Stock removed successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing stock");
                return StatusCode(500, new { message = "An error occurred while removing stock" });
            }
        }

        [HttpPost("adjustStock")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult> AdjustStock([FromBody] AdjustStockRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _service.AdjustStockAsync(request.Transaction, request.NewStock, userId);
                return Ok(new { message = "Stock adjusted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adjusting stock");
                return StatusCode(500, new { message = "An error occurred while adjusting stock" });
            }
        }

        [HttpGet("getTransactionsByItem/{itemId}")]
        [ProducesResponseType(typeof(IEnumerable<StockTransactionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StockTransactionDto>>> GetTransactionsByItem(Guid itemId)
        {
            try
            {
                var transactions = await _service.GetTransactionsByItemAsync(itemId);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transactions for item {ItemId}", itemId);
                return StatusCode(500, new { message = "An error occurred while retrieving transactions" });
            }
        }

        [HttpGet("getAllTransactions")]
        [ProducesResponseType(typeof(IEnumerable<StockTransactionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StockTransactionDto>>> GetAllTransactions()
        {
            try
            {
                var transactions = await _service.GetAllTransactionsAsync();
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all transactions");
                return StatusCode(500, new { message = "An error occurred while retrieving transactions" });
            }
        }
    }

    public class SearchRequest
    {
        public string? Search { get; set; }
    }

    public class AdjustStockRequest
    {
        public CreateStockTransactionDto Transaction { get; set; } = new();
        public decimal NewStock { get; set; }
    }
}
```

---

## API Endpoints

### Base URL
```
https://your-api.azurewebsites.net/api/Inventory
```

### Inventory Item Endpoints

#### 1. Get All Items
```http
GET /api/Inventory/getAllItems
Authorization: Bearer {token}
```

#### 2. Get Item by ID
```http
GET /api/Inventory/getItem/{id}
Authorization: Bearer {token}
```

#### 3. Create Item
```http
POST /api/Inventory/createItem
Authorization: Bearer {token}
Content-Type: application/json

{
  "itemCode": "SEED-001",
  "itemName": "Paddy Seeds",
  "description": "High quality paddy seeds",
  "category": "seeds",
  "unit": "kg",
  "currentStock": 100,
  "minimumStock": 20,
  "unitPrice": 50,
  "status": "active"
}
```

#### 4. Update Item
```http
PUT /api/Inventory/updateItem/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "itemName": "Paddy Seeds Updated",
  "description": "Updated description",
  "category": "seeds",
  "unit": "kg",
  "minimumStock": 25,
  "unitPrice": 55,
  "status": "active"
}
```

#### 5. Delete Item
```http
DELETE /api/Inventory/deleteItem/{id}
Authorization: Bearer {token}
```

#### 6. Get Items by Category
```http
GET /api/Inventory/getItemsByCategory/seeds
Authorization: Bearer {token}
```

#### 7. Get Active Items
```http
GET /api/Inventory/getActiveItems
Authorization: Bearer {token}
```

#### 8. Get Low Stock Items
```http
GET /api/Inventory/getLowStockItems
Authorization: Bearer {token}
```

#### 9. Search Items
```http
POST /api/Inventory/searchItems
Authorization: Bearer {token}
Content-Type: application/json

{
  "search": "seeds"
}
```

### Stock Transaction Endpoints

#### 10. Add Stock
```http
POST /api/Inventory/addStock
Authorization: Bearer {token}
Content-Type: application/json

{
  "inventoryItemId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionType": "in",
  "quantity": 50,
  "referenceNumber": "PO-001",
  "notes": "Purchase from supplier",
  "transactionDate": "2024-01-15T10:00:00Z"
}
```

#### 11. Remove Stock
```http
POST /api/Inventory/removeStock
Authorization: Bearer {token}
Content-Type: application/json

{
  "inventoryItemId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionType": "out",
  "quantity": 20,
  "referenceNumber": "ISSUE-001",
  "notes": "Issued for field work"
}
```

#### 12. Adjust Stock
```http
POST /api/Inventory/adjustStock
Authorization: Bearer {token}
Content-Type: application/json

{
  "transaction": {
    "inventoryItemId": "550e8400-e29b-41d4-a716-446655440000",
    "transactionType": "adjustment",
    "quantity": 0,
    "notes": "Stock count correction"
  },
  "newStock": 95
}
```

#### 13. Get Transactions by Item
```http
GET /api/Inventory/getTransactionsByItem/{itemId}
Authorization: Bearer {token}
```

#### 14. Get All Transactions
```http
GET /api/Inventory/getAllTransactions
Authorization: Bearer {token}
```

---

## Configuration

### Add to Program.cs

```csharp
// Register repositories
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IStockTransactionRepository, StockTransactionRepository>();

// Register services
builder.Services.AddScoped<IInventoryService, InventoryService>();
```

### Database Context Configuration

In `ApplicationDbContext.cs`:

```csharp
public DbSet<InventoryItem> InventoryItems { get; set; }
public DbSet<InventoryStockTransaction> InventoryStockTransactions { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<InventoryItem>(entity =>
    {
        entity.ToTable("inventory_items");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.ItemCode).IsUnique();
        entity.Property(e => e.CurrentStock).HasPrecision(18, 2);
        entity.Property(e => e.MinimumStock).HasPrecision(18, 2);
        entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
    });

    modelBuilder.Entity<InventoryStockTransaction>(entity =>
    {
        entity.ToTable("inventory_stock_transactions");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Quantity).HasPrecision(18, 2);

        entity.HasOne(e => e.InventoryItem)
            .WithMany(i => i.StockTransactions)
            .HasForeignKey(e => e.InventoryItemId)
            .OnDelete(DeleteBehavior.Cascade);
    });
}
```

---

## Summary

This implementation provides:
1. Complete inventory management system with stock tracking
2. Multiple categories for different types of items
3. Stock transaction history with in/out/adjustment types
4. Low stock alerts and monitoring
5. Comprehensive search and filter capabilities
6. Proper separation of concerns
7. JWT authentication
8. RESTful API design
9. Production-ready code following .NET best practices
