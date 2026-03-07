# Backend Implementation Guide - Paddy Management System Enhancements

## Overview
This document outlines all backend changes required to support the enhanced Paddy Management System. The frontend is built with React + TypeScript, and expects a .NET Web API backend with SQL Server database.

---

## Table of Contents
1. [Database Schema Changes](#database-schema-changes)
2. [Entity Models](#entity-models)
3. [API Controllers](#api-controllers)
4. [Service Layer](#service-layer)
5. [API Endpoints Reference](#api-endpoints-reference)

---

## 1. Database Schema Changes

### 1.1 Lorry Master Table

```sql
CREATE TABLE Lorries (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LorryNumber NVARCHAR(50) NOT NULL UNIQUE,
    DriverName NVARCHAR(100) NOT NULL,
    DriverPhone NVARCHAR(20) NOT NULL,
    DealerId UNIQUEIDENTIFIER NULL,
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DealerId) REFERENCES Users(Id)
);

CREATE INDEX IX_Lorries_LorryNumber ON Lorries(LorryNumber);
CREATE INDEX IX_Lorries_DealerId ON Lorries(DealerId);
```

### 1.2 Update Loading Table

```sql
-- Add LorryId column to replace LorryNumber text field
ALTER TABLE LoadingDetails ADD LorryId UNIQUEIDENTIFIER NULL;
ALTER TABLE LoadingDetails ADD CONSTRAINT FK_LoadingDetails_Lorries
    FOREIGN KEY (LorryId) REFERENCES Lorries(Id);

CREATE INDEX IX_LoadingDetails_LorryId ON LoadingDetails(LorryId);
```

### 1.3 Farmer Payments Table

```sql
CREATE TABLE FarmerPayments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FarmerId UNIQUEIDENTIFIER NOT NULL,
    PaddyEntryId UNIQUEIDENTIFIER NOT NULL,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    PaidAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    BalanceAmount DECIMAL(18, 2) NOT NULL,
    PaymentDate DATETIME NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    Notes NVARCHAR(500) NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CreatedBy UNIQUEIDENTIFIER NOT NULL,
    FOREIGN KEY (FarmerId) REFERENCES Users(Id),
    FOREIGN KEY (PaddyEntryId) REFERENCES PaddyEntryDetails(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

CREATE INDEX IX_FarmerPayments_FarmerId ON FarmerPayments(FarmerId);
CREATE INDEX IX_FarmerPayments_PaddyEntryId ON FarmerPayments(PaddyEntryId);
CREATE INDEX IX_FarmerPayments_PaymentDate ON FarmerPayments(PaymentDate);
```

### 1.4 Dealer Payments Table

```sql
CREATE TABLE DealerPayments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DealerId UNIQUEIDENTIFIER NOT NULL,
    LoadingId UNIQUEIDENTIFIER NOT NULL,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    ReceivedAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    BalanceAmount DECIMAL(18, 2) NOT NULL,
    PaymentDate DATETIME NOT NULL,
    PaymentMode NVARCHAR(50) NOT NULL,
    Notes NVARCHAR(500) NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CreatedBy UNIQUEIDENTIFIER NOT NULL,
    FOREIGN KEY (DealerId) REFERENCES Users(Id),
    FOREIGN KEY (LoadingId) REFERENCES LoadingDetails(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

CREATE INDEX IX_DealerPayments_DealerId ON DealerPayments(DealerId);
CREATE INDEX IX_DealerPayments_LoadingId ON DealerPayments(LoadingId);
CREATE INDEX IX_DealerPayments_PaymentDate ON DealerPayments(PaymentDate);
```

### 1.5 Amali Payments Table

```sql
CREATE TABLE AmaliPayments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AmaliId UNIQUEIDENTIFIER NOT NULL,
    LoadingId UNIQUEIDENTIFIER NOT NULL,
    TotalBags INT NOT NULL,
    RatePerBag DECIMAL(18, 2) NOT NULL,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    PaidAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    BalanceAmount DECIMAL(18, 2) NOT NULL,
    PaymentDate DATETIME NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CreatedBy UNIQUEIDENTIFIER NOT NULL,
    FOREIGN KEY (AmaliId) REFERENCES Users(Id),
    FOREIGN KEY (LoadingId) REFERENCES LoadingDetails(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

CREATE INDEX IX_AmaliPayments_AmaliId ON AmaliPayments(AmaliId);
CREATE INDEX IX_AmaliPayments_LoadingId ON AmaliPayments(LoadingId);
CREATE INDEX IX_AmaliPayments_PaymentDate ON AmaliPayments(PaymentDate);
```

### 1.6 Commission Tracking Table

```sql
CREATE TABLE CommissionTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LoadingId UNIQUEIDENTIFIER NOT NULL,
    PaddyEntryId UNIQUEIDENTIFIER NOT NULL,
    TotalBags INT NOT NULL,
    CommissionPerBag DECIMAL(18, 2) NOT NULL,
    TotalCommission DECIMAL(18, 2) NOT NULL,
    TransactionDate DATETIME DEFAULT GETDATE(),
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (LoadingId) REFERENCES LoadingDetails(Id),
    FOREIGN KEY (PaddyEntryId) REFERENCES PaddyEntryDetails(Id)
);

CREATE INDEX IX_CommissionTransactions_LoadingId ON CommissionTransactions(LoadingId);
CREATE INDEX IX_CommissionTransactions_PaddyEntryId ON CommissionTransactions(PaddyEntryId);
CREATE INDEX IX_CommissionTransactions_TransactionDate ON CommissionTransactions(TransactionDate);
```

### 1.7 Update PaddyEntryDetails Table

```sql
-- Add commission tracking fields to existing PaddyEntryDetails table
ALTER TABLE PaddyEntryDetails ADD FarmerPricePerBag DECIMAL(18, 2) NULL;
ALTER TABLE PaddyEntryDetails ADD DealerPricePerBag DECIMAL(18, 2) NULL;
ALTER TABLE PaddyEntryDetails ADD CommissionPerBag DECIMAL(18, 2) NULL;
ALTER TABLE PaddyEntryDetails ADD TotalCommission DECIMAL(18, 2) NULL;

-- Update existing records to set FarmerPricePerBag from BagAmount
UPDATE PaddyEntryDetails
SET FarmerPricePerBag = BagAmount
WHERE FarmerPricePerBag IS NULL;

-- Calculate commission for existing records
UPDATE PaddyEntryDetails
SET CommissionPerBag = ISNULL(DealerPricePerBag, 0) - ISNULL(FarmerPricePerBag, 0),
    TotalCommission = (ISNULL(DealerPricePerBag, 0) - ISNULL(FarmerPricePerBag, 0)) * Bags
WHERE CommissionPerBag IS NULL;
```

---

## 2. Entity Models

### 2.1 Lorry Model

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagement.Models
{
    [Table("Lorries")]
    public class Lorry
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string LorryNumber { get; set; }

        [Required]
        [StringLength(100)]
        public string DriverName { get; set; }

        [Required]
        [StringLength(20)]
        public string DriverPhone { get; set; }

        public Guid? DealerId { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "active";

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime UpdatedDate { get; set; } = DateTime.Now;

        [ForeignKey("DealerId")]
        public virtual User Dealer { get; set; }
    }
}
```

### 2.2 FarmerPayment Model

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagement.Models
{
    [Table("FarmerPayments")]
    public class FarmerPayment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid FarmerId { get; set; }

        [Required]
        public Guid PaddyEntryId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal PaidAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal BalanceAmount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [Required]
        public Guid CreatedBy { get; set; }

        [ForeignKey("FarmerId")]
        public virtual User Farmer { get; set; }

        [ForeignKey("PaddyEntryId")]
        public virtual PaddyEntryDetail PaddyEntry { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User Creator { get; set; }
    }
}
```

### 2.3 DealerPayment Model

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagement.Models
{
    [Table("DealerPayments")]
    public class DealerPayment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid DealerId { get; set; }

        [Required]
        public Guid LoadingId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal ReceivedAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal BalanceAmount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentMode { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [Required]
        public Guid CreatedBy { get; set; }

        [ForeignKey("DealerId")]
        public virtual User Dealer { get; set; }

        [ForeignKey("LoadingId")]
        public virtual LoadingDetail Loading { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User Creator { get; set; }
    }
}
```

### 2.4 AmaliPayment Model

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagement.Models
{
    [Table("AmaliPayments")]
    public class AmaliPayment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid AmaliId { get; set; }

        [Required]
        public Guid LoadingId { get; set; }

        [Required]
        public int TotalBags { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal RatePerBag { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal PaidAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal BalanceAmount { get; set; }

        public DateTime? PaymentDate { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [Required]
        public Guid CreatedBy { get; set; }

        [ForeignKey("AmaliId")]
        public virtual User Amali { get; set; }

        [ForeignKey("LoadingId")]
        public virtual LoadingDetail Loading { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual User Creator { get; set; }
    }
}
```

### 2.5 CommissionTransaction Model

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagement.Models
{
    [Table("CommissionTransactions")]
    public class CommissionTransaction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid LoadingId { get; set; }

        [Required]
        public Guid PaddyEntryId { get; set; }

        [Required]
        public int TotalBags { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal CommissionPerBag { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalCommission { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.Now;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [ForeignKey("LoadingId")]
        public virtual LoadingDetail Loading { get; set; }

        [ForeignKey("PaddyEntryId")]
        public virtual PaddyEntryDetail PaddyEntry { get; set; }
    }
}
```

### 2.6 Updated PaddyEntryDetail Model

```csharp
// Add these properties to existing PaddyEntryDetail model
[Column(TypeName = "decimal(18, 2)")]
public decimal? FarmerPricePerBag { get; set; }

[Column(TypeName = "decimal(18, 2)")]
public decimal? DealerPricePerBag { get; set; }

[Column(TypeName = "decimal(18, 2)")]
public decimal? CommissionPerBag { get; set; }

[Column(TypeName = "decimal(18, 2)")]
public decimal? TotalCommission { get; set; }
```

---

## 3. API Controllers

### 3.1 LorryController

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using PaddyManagement.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PaddyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LorryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LorryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Lorry
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lorry>>> GetAllLorries()
        {
            try
            {
                var lorries = await _context.Lorries
                    .Include(l => l.Dealer)
                    .OrderBy(l => l.LorryNumber)
                    .ToListAsync();

                return Ok(lorries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching lorries", error = ex.Message });
            }
        }

        // GET: api/Lorry/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Lorry>> GetLorryById(Guid id)
        {
            try
            {
                var lorry = await _context.Lorries
                    .Include(l => l.Dealer)
                    .FirstOrDefaultAsync(l => l.Id == id);

                if (lorry == null)
                {
                    return NotFound(new { message = "Lorry not found" });
                }

                return Ok(lorry);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching lorry", error = ex.Message });
            }
        }

        // GET: api/Lorry/stats
        [HttpGet("stats")]
        public async Task<ActionResult<IEnumerable<object>>> GetLorryStats()
        {
            try
            {
                var stats = await _context.LoadingDetails
                    .Where(ld => ld.LorryId != null)
                    .GroupBy(ld => new { ld.LorryId })
                    .Select(g => new
                    {
                        lorryId = g.Key.LorryId,
                        totalTrips = g.Count(),
                        totalWeight = g.Sum(ld => ld.TotalLoadWeight ?? 0),
                        totalBags = g.Sum(ld => ld.TotalNoOfBags ?? 0),
                        lastTripDate = g.Max(ld => ld.LoadedDate)
                    })
                    .ToListAsync();

                var lorryStats = new List<object>();

                foreach (var stat in stats)
                {
                    var lorry = await _context.Lorries.FindAsync(stat.lorryId);
                    if (lorry != null)
                    {
                        lorryStats.Add(new
                        {
                            lorryId = stat.lorryId.ToString(),
                            lorryNumber = lorry.LorryNumber,
                            driverName = lorry.DriverName,
                            driverPhone = lorry.DriverPhone,
                            totalTrips = stat.totalTrips,
                            totalWeight = stat.totalWeight,
                            totalBags = stat.totalBags,
                            lastTripDate = stat.lastTripDate
                        });
                    }
                }

                return Ok(lorryStats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching lorry statistics", error = ex.Message });
            }
        }

        // POST: api/Lorry
        [HttpPost]
        public async Task<ActionResult<Lorry>> CreateLorry([FromBody] Lorry lorry)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(lorry.LorryNumber))
                {
                    return BadRequest(new { message = "Lorry number is required" });
                }

                var existingLorry = await _context.Lorries
                    .FirstOrDefaultAsync(l => l.LorryNumber == lorry.LorryNumber);

                if (existingLorry != null)
                {
                    return Conflict(new { message = "Lorry number already exists" });
                }

                lorry.Id = Guid.NewGuid();
                lorry.CreatedDate = DateTime.Now;
                lorry.UpdatedDate = DateTime.Now;

                _context.Lorries.Add(lorry);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetLorryById), new { id = lorry.Id }, lorry);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating lorry", error = ex.Message });
            }
        }

        // PUT: api/Lorry/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<Lorry>> UpdateLorry(Guid id, [FromBody] Lorry lorry)
        {
            try
            {
                var existingLorry = await _context.Lorries.FindAsync(id);
                if (existingLorry == null)
                {
                    return NotFound(new { message = "Lorry not found" });
                }

                existingLorry.LorryNumber = lorry.LorryNumber;
                existingLorry.DriverName = lorry.DriverName;
                existingLorry.DriverPhone = lorry.DriverPhone;
                existingLorry.DealerId = lorry.DealerId;
                existingLorry.Status = lorry.Status;
                existingLorry.UpdatedDate = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(existingLorry);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating lorry", error = ex.Message });
            }
        }

        // DELETE: api/Lorry/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteLorry(Guid id)
        {
            try
            {
                var lorry = await _context.Lorries.FindAsync(id);
                if (lorry == null)
                {
                    return NotFound(new { message = "Lorry not found" });
                }

                var hasLoadings = await _context.LoadingDetails
                    .AnyAsync(ld => ld.LorryId == id);

                if (hasLoadings)
                {
                    return BadRequest(new { message = "Cannot delete lorry with existing loading entries" });
                }

                _context.Lorries.Remove(lorry);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting lorry", error = ex.Message });
            }
        }
    }
}
```

### 3.2 FarmerPaymentController

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using PaddyManagement.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PaddyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FarmerPaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FarmerPaymentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/FarmerPayment/ledger
        [HttpGet("ledger")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllFarmerLedgers()
        {
            try
            {
                var farmerIds = await _context.PaddyEntryDetails
                    .Select(p => p.RythuId)
                    .Distinct()
                    .ToListAsync();

                var ledgers = new List<object>();

                foreach (var farmerId in farmerIds)
                {
                    var farmerIdGuid = Guid.Parse(farmerId);
                    var farmer = await _context.Users.FindAsync(farmerIdGuid);

                    if (farmer == null) continue;

                    var paddyEntries = await _context.PaddyEntryDetails
                        .Where(p => p.RythuId == farmerId)
                        .ToListAsync();

                    var totalBags = paddyEntries.Sum(p => p.Bags);
                    var totalAmount = paddyEntries.Sum(p => p.Bags * (p.FarmerPricePerBag ?? p.BagAmount));

                    var payments = await _context.FarmerPayments
                        .Where(fp => fp.FarmerId == farmerIdGuid)
                        .ToListAsync();

                    var totalPaid = payments.Sum(p => p.PaidAmount);
                    var pendingBalance = totalAmount - totalPaid;

                    ledgers.Add(new
                    {
                        farmerId = farmerId,
                        farmerName = farmer.Name,
                        farmerPhone = farmer.PhoneNumber,
                        totalBags = totalBags,
                        totalAmount = totalAmount,
                        totalPaid = totalPaid,
                        pendingBalance = pendingBalance,
                        payments = payments.OrderByDescending(p => p.PaymentDate)
                    });
                }

                return Ok(ledgers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching farmer ledgers", error = ex.Message });
            }
        }

        // GET: api/FarmerPayment/ledger/{farmerId}
        [HttpGet("ledger/{farmerId}")]
        public async Task<ActionResult<object>> GetFarmerLedger(Guid farmerId)
        {
            try
            {
                var farmer = await _context.Users.FindAsync(farmerId);
                if (farmer == null)
                {
                    return NotFound(new { message = "Farmer not found" });
                }

                var paddyEntries = await _context.PaddyEntryDetails
                    .Where(p => p.RythuId == farmerId.ToString())
                    .Include(p => p.Loading)
                    .ToListAsync();

                var totalBags = paddyEntries.Sum(p => p.Bags);
                var totalAmount = paddyEntries.Sum(p => p.Bags * (p.FarmerPricePerBag ?? p.BagAmount));

                var payments = await _context.FarmerPayments
                    .Where(fp => fp.FarmerId == farmerId)
                    .OrderByDescending(fp => fp.PaymentDate)
                    .ToListAsync();

                var totalPaid = payments.Sum(p => p.PaidAmount);
                var pendingBalance = totalAmount - totalPaid;

                return Ok(new
                {
                    farmerId = farmerId,
                    farmerName = farmer.Name,
                    farmerPhone = farmer.PhoneNumber,
                    totalBags = totalBags,
                    totalAmount = totalAmount,
                    totalPaid = totalPaid,
                    pendingBalance = pendingBalance,
                    paddyEntries = paddyEntries.Select(p => new
                    {
                        id = p.Id,
                        loadingId = p.LoadingId,
                        bags = p.Bags,
                        kgsPerBag = p.KgsPerBag,
                        totalWeight = p.TotalWeight,
                        bagAmount = p.FarmerPricePerBag ?? p.BagAmount,
                        totalAmount = p.Bags * (p.FarmerPricePerBag ?? p.BagAmount),
                        loadedDate = p.LoadedDate
                    }),
                    payments = payments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching farmer ledger", error = ex.Message });
            }
        }

        // POST: api/FarmerPayment
        [HttpPost]
        public async Task<ActionResult<FarmerPayment>> CreatePayment([FromBody] FarmerPayment payment)
        {
            try
            {
                payment.Id = Guid.NewGuid();
                payment.CreatedDate = DateTime.Now;
                payment.BalanceAmount = payment.TotalAmount - payment.PaidAmount;

                _context.FarmerPayments.Add(payment);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetFarmerLedger),
                    new { farmerId = payment.FarmerId }, payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating payment", error = ex.Message });
            }
        }

        // GET: api/FarmerPayment/history/{farmerId}
        [HttpGet("history/{farmerId}")]
        public async Task<ActionResult<IEnumerable<FarmerPayment>>> GetPaymentHistory(Guid farmerId)
        {
            try
            {
                var payments = await _context.FarmerPayments
                    .Where(fp => fp.FarmerId == farmerId)
                    .Include(fp => fp.Farmer)
                    .Include(fp => fp.PaddyEntry)
                    .OrderByDescending(fp => fp.PaymentDate)
                    .ToListAsync();

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching payment history", error = ex.Message });
            }
        }
    }
}
```

### 3.3 DealerPaymentController

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using PaddyManagement.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PaddyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DealerPaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DealerPaymentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DealerPayment/ledger
        [HttpGet("ledger")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllDealerLedgers()
        {
            try
            {
                var dealerIds = await _context.PaddyEntryDetails
                    .Select(p => p.DealerId)
                    .Distinct()
                    .ToListAsync();

                var ledgers = new List<object>();

                foreach (var dealerId in dealerIds)
                {
                    var dealerIdGuid = Guid.Parse(dealerId);
                    var dealer = await _context.Users.FindAsync(dealerIdGuid);

                    if (dealer == null) continue;

                    var paddyEntries = await _context.PaddyEntryDetails
                        .Where(p => p.DealerId == dealerId)
                        .ToListAsync();

                    var totalBags = paddyEntries.Sum(p => p.Bags);
                    var totalAmount = paddyEntries.Sum(p => p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0));

                    var payments = await _context.DealerPayments
                        .Where(dp => dp.DealerId == dealerIdGuid)
                        .ToListAsync();

                    var totalReceived = payments.Sum(p => p.ReceivedAmount);
                    var pendingAmount = totalAmount - totalReceived;

                    ledgers.Add(new
                    {
                        dealerId = dealerId,
                        dealerName = dealer.Name,
                        dealerPhone = dealer.PhoneNumber,
                        totalBags = totalBags,
                        totalAmount = totalAmount,
                        totalReceived = totalReceived,
                        pendingAmount = pendingAmount,
                        payments = payments.OrderByDescending(p => p.PaymentDate)
                    });
                }

                return Ok(ledgers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching dealer ledgers", error = ex.Message });
            }
        }

        // GET: api/DealerPayment/ledger/{dealerId}
        [HttpGet("ledger/{dealerId}")]
        public async Task<ActionResult<object>> GetDealerLedger(Guid dealerId)
        {
            try
            {
                var dealer = await _context.Users.FindAsync(dealerId);
                if (dealer == null)
                {
                    return NotFound(new { message = "Dealer not found" });
                }

                var paddyEntries = await _context.PaddyEntryDetails
                    .Where(p => p.DealerId == dealerId.ToString())
                    .Include(p => p.Loading)
                    .ToListAsync();

                var totalBags = paddyEntries.Sum(p => p.Bags);
                var totalAmount = paddyEntries.Sum(p => p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0));

                var payments = await _context.DealerPayments
                    .Where(dp => dp.DealerId == dealerId)
                    .OrderByDescending(dp => dp.PaymentDate)
                    .ToListAsync();

                var totalReceived = payments.Sum(p => p.ReceivedAmount);
                var pendingAmount = totalAmount - totalReceived;

                return Ok(new
                {
                    dealerId = dealerId,
                    dealerName = dealer.Name,
                    dealerPhone = dealer.PhoneNumber,
                    totalBags = totalBags,
                    totalAmount = totalAmount,
                    totalReceived = totalReceived,
                    pendingAmount = pendingAmount,
                    paddyEntries = paddyEntries.Select(p => new
                    {
                        id = p.Id,
                        loadingId = p.LoadingId,
                        bags = p.Bags,
                        kgsPerBag = p.KgsPerBag,
                        totalWeight = p.TotalWeight,
                        dealerBagAmount = p.DealerPricePerBag ?? p.DealerBagAmount ?? 0,
                        totalAmount = p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0),
                        loadedDate = p.LoadedDate
                    }),
                    payments = payments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching dealer ledger", error = ex.Message });
            }
        }

        // POST: api/DealerPayment
        [HttpPost]
        public async Task<ActionResult<DealerPayment>> CreatePayment([FromBody] DealerPayment payment)
        {
            try
            {
                payment.Id = Guid.NewGuid();
                payment.CreatedDate = DateTime.Now;
                payment.BalanceAmount = payment.TotalAmount - payment.ReceivedAmount;

                _context.DealerPayments.Add(payment);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetDealerLedger),
                    new { dealerId = payment.DealerId }, payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating payment", error = ex.Message });
            }
        }

        // GET: api/DealerPayment/history/{dealerId}
        [HttpGet("history/{dealerId}")]
        public async Task<ActionResult<IEnumerable<DealerPayment>>> GetPaymentHistory(Guid dealerId)
        {
            try
            {
                var payments = await _context.DealerPayments
                    .Where(dp => dp.DealerId == dealerId)
                    .Include(dp => dp.Dealer)
                    .Include(dp => dp.Loading)
                    .OrderByDescending(dp => dp.PaymentDate)
                    .ToListAsync();

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching payment history", error = ex.Message });
            }
        }
    }
}
```

### 3.4 AmaliPaymentController

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using PaddyManagement.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PaddyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AmaliPaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AmaliPaymentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/AmaliPayment/ledger
        [HttpGet("ledger")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllAmaliLedgers()
        {
            try
            {
                var amaliIds = await _context.LoadingDetails
                    .Where(ld => ld.AmaliId != null)
                    .Select(ld => ld.AmaliId)
                    .Distinct()
                    .ToListAsync();

                var ledgers = new List<object>();

                foreach (var amaliId in amaliIds)
                {
                    var amaliIdGuid = Guid.Parse(amaliId);
                    var amali = await _context.Users.FindAsync(amaliIdGuid);

                    if (amali == null) continue;

                    var loadings = await _context.LoadingDetails
                        .Where(ld => ld.AmaliId == amaliId)
                        .ToListAsync();

                    var totalBags = loadings.Sum(l => l.TotalNoOfBags ?? 0);
                    var ratePerBag = 5.0m; // Default rate, should be configurable
                    var totalPayable = totalBags * ratePerBag;

                    var payments = await _context.AmaliPayments
                        .Where(ap => ap.AmaliId == amaliIdGuid)
                        .ToListAsync();

                    var totalPaid = payments.Sum(p => p.PaidAmount);
                    var pendingAmount = totalPayable - totalPaid;

                    ledgers.Add(new
                    {
                        amaliId = amaliId,
                        amaliName = amali.Name,
                        amaliPhone = amali.PhoneNumber,
                        totalBags = totalBags,
                        ratePerBag = ratePerBag,
                        totalPayable = totalPayable,
                        totalPaid = totalPaid,
                        pendingAmount = pendingAmount,
                        payments = payments.OrderByDescending(p => p.PaymentDate)
                    });
                }

                return Ok(ledgers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching amali ledgers", error = ex.Message });
            }
        }

        // GET: api/AmaliPayment/ledger/{amaliId}
        [HttpGet("ledger/{amaliId}")]
        public async Task<ActionResult<object>> GetAmaliLedger(Guid amaliId)
        {
            try
            {
                var amali = await _context.Users.FindAsync(amaliId);
                if (amali == null)
                {
                    return NotFound(new { message = "Amali not found" });
                }

                var loadings = await _context.LoadingDetails
                    .Where(ld => ld.AmaliId == amaliId.ToString())
                    .ToListAsync();

                var totalBags = loadings.Sum(l => l.TotalNoOfBags ?? 0);
                var ratePerBag = 5.0m;
                var totalPayable = totalBags * ratePerBag;

                var payments = await _context.AmaliPayments
                    .Where(ap => ap.AmaliId == amaliId)
                    .OrderByDescending(ap => ap.PaymentDate)
                    .ToListAsync();

                var totalPaid = payments.Sum(p => p.PaidAmount);
                var pendingAmount = totalPayable - totalPaid;

                return Ok(new
                {
                    amaliId = amaliId,
                    amaliName = amali.Name,
                    amaliPhone = amali.PhoneNumber,
                    totalBags = totalBags,
                    ratePerBag = ratePerBag,
                    totalPayable = totalPayable,
                    totalPaid = totalPaid,
                    pendingAmount = pendingAmount,
                    loadings = loadings.Select(l => new
                    {
                        id = l.Id,
                        loadedDate = l.LoadedDate,
                        totalBags = l.TotalNoOfBags ?? 0,
                        totalWeight = l.TotalLoadWeight ?? 0,
                        amount = (l.TotalNoOfBags ?? 0) * ratePerBag
                    }),
                    payments = payments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching amali ledger", error = ex.Message });
            }
        }

        // POST: api/AmaliPayment
        [HttpPost]
        public async Task<ActionResult<AmaliPayment>> CreatePayment([FromBody] AmaliPayment payment)
        {
            try
            {
                payment.Id = Guid.NewGuid();
                payment.CreatedDate = DateTime.Now;
                payment.BalanceAmount = payment.TotalAmount - payment.PaidAmount;

                _context.AmaliPayments.Add(payment);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAmaliLedger),
                    new { amaliId = payment.AmaliId }, payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating payment", error = ex.Message });
            }
        }
    }
}
```

### 3.5 CommissionController

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using PaddyManagement.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PaddyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommissionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommissionController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Commission/summary
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetCommissionSummary()
        {
            try
            {
                var today = DateTime.Today;
                var firstDayOfMonth = new DateTime(today.Year, today.Month, 1);

                var allEntries = await _context.PaddyEntryDetails
                    .Where(p => p.CommissionPerBag != null && p.TotalCommission != null)
                    .ToListAsync();

                var todayEntries = allEntries
                    .Where(p => p.LoadedDate.Date == today)
                    .ToList();

                var monthEntries = allEntries
                    .Where(p => p.LoadedDate >= firstDayOfMonth)
                    .ToList();

                var todayCommission = todayEntries.Sum(p => p.TotalCommission ?? 0);
                var todayBags = todayEntries.Sum(p => p.Bags);

                var monthlyCommission = monthEntries.Sum(p => p.TotalCommission ?? 0);
                var monthlyBags = monthEntries.Sum(p => p.Bags);

                var totalCommission = allEntries.Sum(p => p.TotalCommission ?? 0);
                var totalBags = allEntries.Sum(p => p.Bags);

                var transactions = await _context.CommissionTransactions
                    .Include(ct => ct.PaddyEntry)
                    .Include(ct => ct.Loading)
                    .OrderByDescending(ct => ct.TransactionDate)
                    .Take(50)
                    .ToListAsync();

                return Ok(new
                {
                    todayCommission = todayCommission,
                    monthlyCommission = monthlyCommission,
                    totalCommission = totalCommission,
                    todayBags = todayBags,
                    monthlyBags = monthlyBags,
                    totalBags = totalBags,
                    transactions = transactions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching commission summary", error = ex.Message });
            }
        }

        // GET: api/Commission/transactions
        [HttpGet("transactions")]
        public async Task<ActionResult<IEnumerable<CommissionTransaction>>> GetAllTransactions()
        {
            try
            {
                var transactions = await _context.CommissionTransactions
                    .Include(ct => ct.PaddyEntry)
                    .Include(ct => ct.Loading)
                    .OrderByDescending(ct => ct.TransactionDate)
                    .ToListAsync();

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching transactions", error = ex.Message });
            }
        }

        // GET: api/Commission/report
        [HttpGet("report")]
        public async Task<ActionResult<object>> GetCommissionReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var query = _context.PaddyEntryDetails
                    .Where(p => p.CommissionPerBag != null && p.TotalCommission != null);

                if (startDate.HasValue)
                {
                    query = query.Where(p => p.LoadedDate >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(p => p.LoadedDate <= endDate.Value);
                }

                var entries = await query
                    .Include(p => p.Loading)
                    .OrderByDescending(p => p.LoadedDate)
                    .ToListAsync();

                var totalBags = entries.Sum(p => p.Bags);
                var totalCommission = entries.Sum(p => p.TotalCommission ?? 0);
                var averageCommissionPerBag = totalBags > 0 ? totalCommission / totalBags : 0;

                var dailyBreakdown = entries
                    .GroupBy(p => p.LoadedDate.Date)
                    .Select(g => new
                    {
                        date = g.Key,
                        bags = g.Sum(p => p.Bags),
                        commission = g.Sum(p => p.TotalCommission ?? 0)
                    })
                    .OrderByDescending(d => d.date)
                    .ToList();

                return Ok(new
                {
                    startDate = startDate,
                    endDate = endDate,
                    totalBags = totalBags,
                    totalCommission = totalCommission,
                    averageCommissionPerBag = averageCommissionPerBag,
                    dailyBreakdown = dailyBreakdown,
                    entries = entries.Select(p => new
                    {
                        id = p.Id,
                        loadedDate = p.LoadedDate,
                        bags = p.Bags,
                        farmerPricePerBag = p.FarmerPricePerBag,
                        dealerPricePerBag = p.DealerPricePerBag,
                        commissionPerBag = p.CommissionPerBag,
                        totalCommission = p.TotalCommission
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating commission report", error = ex.Message });
            }
        }
    }
}
```

### 3.6 ReportsController

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PaddyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Reports/daily
        [HttpGet("daily")]
        public async Task<ActionResult<object>> GetDailyReport([FromQuery] DateTime date)
        {
            try
            {
                var targetDate = date.Date;

                var loadings = await _context.LoadingDetails
                    .Where(ld => ld.LoadedDate.Date == targetDate)
                    .Include(ld => ld.Dealer)
                    .Include(ld => ld.Amali)
                    .ToListAsync();

                var paddyEntries = await _context.PaddyEntryDetails
                    .Where(p => p.LoadedDate.Date == targetDate)
                    .Include(p => p.Farmer)
                    .Include(p => p.Dealer)
                    .Include(p => p.Loading)
                    .ToListAsync();

                var totalBags = paddyEntries.Sum(p => p.Bags);
                var totalWeight = paddyEntries.Sum(p => p.TotalWeight ?? 0);
                var totalFarmerAmount = paddyEntries.Sum(p => p.Bags * (p.FarmerPricePerBag ?? p.BagAmount));
                var totalDealerAmount = paddyEntries.Sum(p => p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0));
                var totalCommission = paddyEntries.Sum(p => p.TotalCommission ?? 0);

                return Ok(new
                {
                    date = targetDate,
                    totalLoadings = loadings.Count,
                    totalBags = totalBags,
                    totalWeight = totalWeight,
                    totalFarmerAmount = totalFarmerAmount,
                    totalDealerAmount = totalDealerAmount,
                    totalCommission = totalCommission,
                    loadings = loadings.Select(l => new
                    {
                        id = l.Id,
                        lorryNumber = l.LorryNumber,
                        dealerName = l.Dealer?.Name,
                        amaliName = l.Amali?.Name,
                        totalBags = l.TotalNoOfBags ?? 0,
                        totalWeight = l.TotalLoadWeight ?? 0
                    }),
                    paddyEntries = paddyEntries.Select(p => new
                    {
                        id = p.Id,
                        lorryNumber = p.LorryNumber,
                        farmerName = p.Farmer?.Name,
                        dealerName = p.Dealer?.Name,
                        bags = p.Bags,
                        weight = p.TotalWeight,
                        farmerAmount = p.Bags * (p.FarmerPricePerBag ?? p.BagAmount),
                        dealerAmount = p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0),
                        commission = p.TotalCommission ?? 0
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating daily report", error = ex.Message });
            }
        }

        // GET: api/Reports/monthly
        [HttpGet("monthly")]
        public async Task<ActionResult<object>> GetMonthlyReport([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);

                var paddyEntries = await _context.PaddyEntryDetails
                    .Where(p => p.LoadedDate >= startDate && p.LoadedDate <= endDate)
                    .Include(p => p.Farmer)
                    .Include(p => p.Dealer)
                    .ToListAsync();

                var totalBags = paddyEntries.Sum(p => p.Bags);
                var totalWeight = paddyEntries.Sum(p => p.TotalWeight ?? 0);
                var totalFarmerPayment = paddyEntries.Sum(p => p.Bags * (p.FarmerPricePerBag ?? p.BagAmount));
                var totalDealerCollection = paddyEntries.Sum(p => p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0));
                var totalCommission = paddyEntries.Sum(p => p.TotalCommission ?? 0);

                var farmerPayments = await _context.FarmerPayments
                    .Where(fp => fp.PaymentDate >= startDate && fp.PaymentDate <= endDate)
                    .SumAsync(fp => fp.PaidAmount);

                var dealerPayments = await _context.DealerPayments
                    .Where(dp => dp.PaymentDate >= startDate && dp.PaymentDate <= endDate)
                    .SumAsync(dp => dp.ReceivedAmount);

                var amaliPayments = await _context.AmaliPayments
                    .Where(ap => ap.PaymentDate >= startDate && ap.PaymentDate <= endDate)
                    .SumAsync(ap => ap.PaidAmount);

                var dailyBreakdown = paddyEntries
                    .GroupBy(p => p.LoadedDate.Date)
                    .Select(g => new
                    {
                        date = g.Key,
                        bags = g.Sum(p => p.Bags),
                        weight = g.Sum(p => p.TotalWeight ?? 0),
                        farmerAmount = g.Sum(p => p.Bags * (p.FarmerPricePerBag ?? p.BagAmount)),
                        dealerAmount = g.Sum(p => p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0)),
                        commission = g.Sum(p => p.TotalCommission ?? 0)
                    })
                    .OrderBy(d => d.date)
                    .ToList();

                return Ok(new
                {
                    year = year,
                    month = month,
                    totalBags = totalBags,
                    totalWeight = totalWeight,
                    totalFarmerPayment = totalFarmerPayment,
                    totalDealerCollection = totalDealerCollection,
                    totalCommission = totalCommission,
                    farmerPaymentsMade = farmerPayments,
                    dealerPaymentsReceived = dealerPayments,
                    amaliPaymentsMade = amaliPayments,
                    dailyBreakdown = dailyBreakdown
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating monthly report", error = ex.Message });
            }
        }

        // GET: api/Reports/financial
        [HttpGet("financial")]
        public async Task<ActionResult<object>> GetFinancialReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddMonths(-1);
                var end = endDate ?? DateTime.Today;

                var paddyEntries = await _context.PaddyEntryDetails
                    .Where(p => p.LoadedDate >= start && p.LoadedDate <= end)
                    .ToListAsync();

                var totalCommission = paddyEntries.Sum(p => p.TotalCommission ?? 0);

                var amaliPayments = await _context.AmaliPayments
                    .Where(ap => ap.CreatedDate >= start && ap.CreatedDate <= end)
                    .SumAsync(ap => ap.PaidAmount);

                var netProfit = totalCommission - amaliPayments;

                var farmerPayable = paddyEntries.Sum(p => p.Bags * (p.FarmerPricePerBag ?? p.BagAmount));
                var farmerPaid = await _context.FarmerPayments
                    .Where(fp => fp.PaymentDate >= start && fp.PaymentDate <= end)
                    .SumAsync(fp => fp.PaidAmount);
                var farmerPending = farmerPayable - farmerPaid;

                var dealerReceivable = paddyEntries.Sum(p => p.Bags * (p.DealerPricePerBag ?? p.DealerBagAmount ?? 0));
                var dealerReceived = await _context.DealerPayments
                    .Where(dp => dp.PaymentDate >= start && dp.PaymentDate <= end)
                    .SumAsync(dp => dp.ReceivedAmount);
                var dealerPending = dealerReceivable - dealerReceived;

                return Ok(new
                {
                    startDate = start,
                    endDate = end,
                    totalCommission = totalCommission,
                    amaliPayments = amaliPayments,
                    netProfit = netProfit,
                    farmerPayable = farmerPayable,
                    farmerPaid = farmerPaid,
                    farmerPending = farmerPending,
                    dealerReceivable = dealerReceivable,
                    dealerReceived = dealerReceived,
                    dealerPending = dealerPending
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating financial report", error = ex.Message });
            }
        }
    }
}
```

---

## 4. Service Layer

### 4.1 Update PaddyService

```csharp
// Add commission calculation to CreatePaddyEntry method
public async Task<PaddyEntryDetail> CreatePaddyEntry(PaddyEntryDetail paddyEntry)
{
    using (var transaction = await _context.Database.BeginTransactionAsync())
    {
        try
        {
            // Calculate commission if prices are provided
            if (paddyEntry.FarmerPricePerBag.HasValue && paddyEntry.DealerPricePerBag.HasValue)
            {
                paddyEntry.CommissionPerBag = paddyEntry.DealerPricePerBag.Value - paddyEntry.FarmerPricePerBag.Value;
                paddyEntry.TotalCommission = paddyEntry.CommissionPerBag * paddyEntry.Bags;

                // Create commission transaction
                var commissionTransaction = new CommissionTransaction
                {
                    LoadingId = paddyEntry.LoadingId,
                    PaddyEntryId = paddyEntry.Id,
                    TotalBags = paddyEntry.Bags,
                    CommissionPerBag = paddyEntry.CommissionPerBag.Value,
                    TotalCommission = paddyEntry.TotalCommission.Value,
                    TransactionDate = paddyEntry.LoadedDate
                };

                _context.CommissionTransactions.Add(commissionTransaction);
            }

            _context.PaddyEntryDetails.Add(paddyEntry);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return paddyEntry;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

---

## 5. API Endpoints Reference

### 5.1 Lorry Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Lorry` | Get all lorries |
| GET | `/api/Lorry/{id}` | Get lorry by ID |
| GET | `/api/Lorry/stats` | Get lorry statistics |
| POST | `/api/Lorry` | Create new lorry |
| PUT | `/api/Lorry/{id}` | Update lorry |
| DELETE | `/api/Lorry/{id}` | Delete lorry |

### 5.2 Farmer Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/FarmerPayment/ledger` | Get all farmer ledgers |
| GET | `/api/FarmerPayment/ledger/{farmerId}` | Get farmer ledger by ID |
| GET | `/api/FarmerPayment/history/{farmerId}` | Get payment history |
| POST | `/api/FarmerPayment` | Create payment |

### 5.3 Dealer Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/DealerPayment/ledger` | Get all dealer ledgers |
| GET | `/api/DealerPayment/ledger/{dealerId}` | Get dealer ledger by ID |
| GET | `/api/DealerPayment/history/{dealerId}` | Get payment history |
| POST | `/api/DealerPayment` | Create payment |

### 5.4 Amali Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/AmaliPayment/ledger` | Get all amali ledgers |
| GET | `/api/AmaliPayment/ledger/{amaliId}` | Get amali ledger by ID |
| POST | `/api/AmaliPayment` | Create payment |

### 5.5 Commission Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Commission/summary` | Get commission summary |
| GET | `/api/Commission/transactions` | Get all transactions |
| GET | `/api/Commission/report?startDate=&endDate=` | Get commission report |

### 5.6 Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Reports/daily?date=` | Get daily report |
| GET | `/api/Reports/monthly?year=&month=` | Get monthly report |
| GET | `/api/Reports/financial?startDate=&endDate=` | Get financial report |

---

## 6. Validation Rules

### 6.1 Business Rules

1. **Bags Validation**
   - Must be greater than 0
   - Must be an integer

2. **Weight Validation**
   - Must be greater than 0
   - KgsPerBag must be positive

3. **Price Validation**
   - FarmerPricePerBag must be greater than 0
   - DealerPricePerBag must be greater than 0
   - DealerPricePerBag must be >= FarmerPricePerBag

4. **Payment Validation**
   - PaidAmount must not exceed TotalAmount
   - BalanceAmount = TotalAmount - PaidAmount
   - Payment date cannot be in the future

5. **Lorry Validation**
   - Lorry number must be unique
   - Cannot delete lorry with existing loading entries
   - Phone number format validation

### 6.2 Implementation Example

```csharp
public class PaddyEntryValidator
{
    public static ValidationResult Validate(PaddyEntryDetail entry)
    {
        var errors = new List<string>();

        if (entry.Bags <= 0)
            errors.Add("Bags must be greater than 0");

        if (entry.KgsPerBag <= 0)
            errors.Add("Weight per bag must be greater than 0");

        if (entry.FarmerPricePerBag.HasValue && entry.FarmerPricePerBag <= 0)
            errors.Add("Farmer price per bag must be greater than 0");

        if (entry.DealerPricePerBag.HasValue && entry.DealerPricePerBag <= 0)
            errors.Add("Dealer price per bag must be greater than 0");

        if (entry.FarmerPricePerBag.HasValue && entry.DealerPricePerBag.HasValue)
        {
            if (entry.DealerPricePerBag < entry.FarmerPricePerBag)
                errors.Add("Dealer price must be greater than or equal to farmer price");
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }
}
```

---

## 7. Database Indexes

Create the following indexes for optimal performance:

```sql
-- Performance indexes
CREATE INDEX IX_PaddyEntryDetails_LoadedDate ON PaddyEntryDetails(LoadedDate);
CREATE INDEX IX_PaddyEntryDetails_RythuId ON PaddyEntryDetails(RythuId);
CREATE INDEX IX_PaddyEntryDetails_DealerId ON PaddyEntryDetails(DealerId);
CREATE INDEX IX_LoadingDetails_LoadedDate ON LoadingDetails(LoadedDate);
CREATE INDEX IX_FarmerPayments_PaymentDate_FarmerId ON FarmerPayments(PaymentDate, FarmerId);
CREATE INDEX IX_DealerPayments_PaymentDate_DealerId ON DealerPayments(PaymentDate, DealerId);
CREATE INDEX IX_CommissionTransactions_TransactionDate ON CommissionTransactions(TransactionDate);
```

---

## 8. Error Handling

All API endpoints should return consistent error responses:

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
    public List<string> Errors { get; set; }
}

// Usage example
return StatusCode(500, new ApiResponse<object>
{
    Success = false,
    Message = "An error occurred",
    Errors = new List<string> { ex.Message }
});
```

---

## 9. Security Considerations

1. **Authentication**: All endpoints should require authentication
2. **Authorization**: Implement role-based access control
3. **Input Validation**: Sanitize all user inputs
4. **SQL Injection**: Use parameterized queries (Entity Framework handles this)
5. **CORS**: Configure appropriate CORS policies

---

## 10. Testing Checklist

- [ ] Create lorry and verify in database
- [ ] Create paddy entry with commission calculation
- [ ] Record farmer payment and verify ledger
- [ ] Record dealer payment and verify ledger
- [ ] Record amali payment and verify ledger
- [ ] Generate daily report
- [ ] Generate monthly report
- [ ] Generate financial report
- [ ] Verify commission calculations
- [ ] Test validation rules
- [ ] Test error handling
- [ ] Load test with multiple concurrent requests

---

## Summary

This implementation guide provides all the necessary backend changes to support the enhanced Paddy Management System. The frontend expects these exact API endpoints and response formats. Ensure all validations are implemented and comprehensive error handling is in place before deploying to production.
