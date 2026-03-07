# .NET Backend Implementation Guide: Core Pages

## Overview
This document provides detailed backend implementation specifications for the core application pages: Loading, User Management, Amali, All Paddy Details, and Dashboard. Each section includes API endpoints, request/response models, database queries, and business logic.

---

## Table of Contents
1. [Loading Page Implementation](#loading-page-implementation)
2. [User Management Page Implementation](#user-management-page-implementation)
3. [Amali Page Implementation](#amali-page-implementation)
4. [All Paddy Details Page Implementation](#all-paddy-details-page-implementation)
5. [Dashboard Page Implementation](#dashboard-page-implementation)

---

## Loading Page Implementation

### Overview
The Loading page manages loading/unloading operations and associated paddy entries. It supports filtering by dealer, amali, and date range, with expandable rows showing nested paddy details.

### Database Tables
- `loading_entries` - Main loading/unloading records
- `paddy_entries` - Paddy details linked to loading entries
- `users` - User information (dealers, amali, rythus)

### API Endpoints

#### 1. Get All Loading Entries
```
POST /Account/getLoadingDetails
```

**Request Body:**
```json
{}
```

**Response Model:**
```csharp
public class LoadingEntryDetails
{
    public int Id { get; set; }
    public DateTime LoadedDate { get; set; }
    public string LorryNumber { get; set; }
    public string DealerName { get; set; }
    public string AmaliName { get; set; }
    public int? TotalNoOfBags { get; set; }
    public decimal? TotalLoadWeight { get; set; }
    public string Status { get; set; }
    public bool PaymentDone { get; set; }
    public int DealerId { get; set; }
    public int AmaliId { get; set; }
    public int? SeasonId { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("getLoadingDetails")]
public async Task<ActionResult<List<LoadingEntryDetails>>> GetLoadingDetails()
{
    try
    {
        var loadingEntries = await _context.LoadingEntries
            .Include(l => l.Dealer)
            .Include(l => l.Amali)
            .Select(l => new LoadingEntryDetails
            {
                Id = l.Id,
                LoadedDate = l.LoadedDate,
                LorryNumber = l.LorryNumber,
                DealerName = l.Dealer.Name,
                AmaliName = l.Amali.Name,
                TotalNoOfBags = l.TotalNoOfBags,
                TotalLoadWeight = l.TotalLoadWeight,
                Status = l.Status,
                PaymentDone = l.PaymentDone,
                DealerId = l.DealerId,
                AmaliId = l.AmaliId,
                SeasonId = l.SeasonId
            })
            .OrderBy(l => l.Id)
            .ToListAsync();

        return Ok(loadingEntries);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching loading details");
        return StatusCode(500, new { message = "Failed to fetch loading details" });
    }
}
```

#### 2. Insert Loading Entry
```
POST /Account/insertLoadingDetails
```

**Request Model:**
```csharp
public class InsertLoadingRequest
{
    [Required]
    public DateTime LoadedDate { get; set; }

    [Required]
    public string LorryNumber { get; set; }

    [Required]
    public int DealerId { get; set; }

    [Required]
    public int AmaliId { get; set; }

    public string UserId { get; set; } = "0";
    public int SeasonId { get; set; } = 0;
}
```

**Implementation:**
```csharp
[HttpPost("insertLoadingDetails")]
public async Task<ActionResult<LoadingEntry>> InsertLoadingDetails([FromBody] InsertLoadingRequest request)
{
    try
    {
        var loadingEntry = new LoadingEntry
        {
            LoadedDate = request.LoadedDate,
            LorryNumber = request.LorryNumber,
            DealerId = request.DealerId,
            AmaliId = request.AmaliId,
            SeasonId = request.SeasonId,
            Status = "loading not started",
            PaymentDone = false,
            TotalNoOfBags = 0,
            TotalLoadWeight = 0,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = request.UserId
        };

        _context.LoadingEntries.Add(loadingEntry);
        await _context.SaveChangesAsync();

        return Ok(loadingEntry);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error inserting loading details");
        return StatusCode(500, new { message = "Failed to create loading entry" });
    }
}
```

#### 3. Update Loading Entry
```
POST /Account/updateLoadingDetails
```

**Request Model:**
```csharp
public class UpdateLoadingRequest
{
    [Required]
    public string UserId { get; set; }

    [Required]
    public int LoadingId { get; set; }

    [Required]
    public DateTime LoadedDate { get; set; }

    [Required]
    public string LorryNumber { get; set; }

    [Required]
    public int DealerId { get; set; }

    [Required]
    public int AmaliId { get; set; }

    public int SeasonId { get; set; }
    public decimal TotalLoadWeight { get; set; }
    public int TotalNoOfBags { get; set; }
    public string Status { get; set; }
    public bool PaymentDone { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("updateLoadingDetails")]
public async Task<ActionResult<LoadingEntry>> UpdateLoadingDetails([FromBody] UpdateLoadingRequest request)
{
    try
    {
        var loadingEntry = await _context.LoadingEntries
            .FirstOrDefaultAsync(l => l.Id == request.LoadingId);

        if (loadingEntry == null)
            return NotFound(new { message = "Loading entry not found" });

        loadingEntry.LoadedDate = request.LoadedDate;
        loadingEntry.LorryNumber = request.LorryNumber;
        loadingEntry.DealerId = request.DealerId;
        loadingEntry.AmaliId = request.AmaliId;
        loadingEntry.SeasonId = request.SeasonId;
        loadingEntry.TotalLoadWeight = request.TotalLoadWeight;
        loadingEntry.TotalNoOfBags = request.TotalNoOfBags;
        loadingEntry.Status = request.Status;
        loadingEntry.PaymentDone = request.PaymentDone;
        loadingEntry.UpdatedAt = DateTime.UtcNow;
        loadingEntry.UpdatedBy = request.UserId;

        await _context.SaveChangesAsync();

        return Ok(loadingEntry);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating loading details");
        return StatusCode(500, new { message = "Failed to update loading entry" });
    }
}
```

#### 4. Get Paddy by Loading ID
```
GET /Account/getPaddyByLoading?loadingId={loadingId}
```

**Response Model:**
```csharp
public class PaddyEntryDetails
{
    public string Id { get; set; }
    public string LorryNumber { get; set; }
    public int Bags { get; set; }
    public decimal KgPerBag { get; set; }
    public decimal BagAmount { get; set; }
    public decimal DealerBagAmount { get; set; }
    public string LoadedDate { get; set; }
    public decimal TotalWeight { get; set; }
    public string UserId { get; set; }
    public string DealerId { get; set; }
    public int LoadingId { get; set; }
    public string LoadType { get; set; }
    public string Status { get; set; }
    public string Rythu { get; set; }
    public string Dealer { get; set; }
    public string RythuPhone { get; set; }
    public decimal FinalAmount { get; set; }
    public decimal DealerFinalAmount { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("getPaddyByLoading")]
public async Task<ActionResult<List<PaddyEntryDetails>>> GetPaddyByLoading([FromQuery] int loadingId)
{
    try
    {
        var paddyEntries = await _context.PaddyEntries
            .Include(p => p.RythuUser)
            .Include(p => p.DealerUser)
            .Where(p => p.LoadingId == loadingId)
            .Select(p => new PaddyEntryDetails
            {
                Id = p.Id.ToString(),
                LorryNumber = p.LorryNumber,
                Bags = p.Bags,
                KgPerBag = p.KgPerBag,
                BagAmount = p.BagAmount,
                DealerBagAmount = p.DealerBagAmount,
                LoadedDate = p.LoadedDate.ToString("yyyy-MM-dd"),
                TotalWeight = p.TotalWeight,
                UserId = p.UserId.ToString(),
                DealerId = p.DealerId.ToString(),
                LoadingId = p.LoadingId,
                LoadType = p.LoadType,
                Status = p.Status,
                Rythu = p.RythuUser.Name,
                Dealer = p.DealerUser.Name,
                RythuPhone = p.RythuUser.PhoneNumber,
                FinalAmount = p.Bags * p.BagAmount,
                DealerFinalAmount = p.Bags * p.DealerBagAmount
            })
            .ToListAsync();

        return Ok(paddyEntries);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching paddy entries by loading ID");
        return StatusCode(500, new { message = "Failed to fetch paddy entries" });
    }
}
```

### Business Logic

1. **Auto-calculation of Totals:**
   - When paddy entries are added/updated, automatically recalculate `TotalNoOfBags` and `TotalLoadWeight` for the loading entry
   - Use database triggers or application-level logic

2. **Status Management:**
   - Default status: "loading not started"
   - Update to "in progress" when first paddy is added
   - Update to "completed" when all paddy entries are marked complete

3. **Payment Tracking:**
   - Track payment status at loading level
   - Update when amali payment is processed

---

## User Management Page Implementation

### Overview
The User Management page handles CRUD operations for users, with role-based filtering (vendors, rythus) and search functionality.

### API Endpoints

#### 1. Search Users
```
POST /Account/getSearchUser
```

**Request Model:**
```csharp
public class SearchUserRequest
{
    public string Search { get; set; }
}
```

**Response Model:**
```csharp
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public string Role { get; set; }
    public string Village { get; set; }
    public DateTime? CreatedAt { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("getSearchUser")]
public async Task<ActionResult<List<User>>> GetSearchUser([FromBody] SearchUserRequest request)
{
    try
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(request.Search) && request.Search.ToLower() != "all")
        {
            var searchTerm = request.Search.ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(searchTerm) ||
                u.Email.ToLower().Contains(searchTerm) ||
                u.PhoneNumber.Contains(searchTerm)
            );
        }

        var users = await query
            .Select(u => new User
            {
                Id = u.Id.ToString(),
                Name = u.Name,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                Village = u.Village,
                CreatedAt = u.CreatedAt
            })
            .OrderBy(u => u.Name)
            .ToListAsync();

        return Ok(users);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error searching users");
        return StatusCode(500, new { message = "Failed to search users" });
    }
}
```

#### 2. Search Users by Role
```
POST /Account/getSearchUserbyRole
```

**Request Model:**
```csharp
public class SearchUserByRoleRequest
{
    public string Search { get; set; } // Role name: "vendor", "rythu", "amali"
}
```

**Implementation:**
```csharp
[HttpPost("getSearchUserbyRole")]
public async Task<ActionResult<List<User>>> GetSearchUserByRole([FromBody] SearchUserByRoleRequest request)
{
    try
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(request.Search))
        {
            var roleName = request.Search.ToLower();
            query = query.Where(u => u.Role.ToLower() == roleName);
        }

        var users = await query
            .Select(u => new User
            {
                Id = u.Id.ToString(),
                Name = u.Name,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                Village = u.Village,
                CreatedAt = u.CreatedAt
            })
            .OrderBy(u => u.Name)
            .ToListAsync();

        return Ok(users);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error searching users by role");
        return StatusCode(500, new { message = "Failed to search users by role" });
    }
}
```

#### 3. Get User Details
```
GET /Account/getUserDetails?userId={userId}
```

**Response Model:**
```csharp
public class UserDetails
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public string Role { get; set; }
    public string Village { get; set; }
    public DateTime? CreatedAt { get; set; }

    // Transaction summary
    public int TotalTransactions { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("getUserDetails")]
public async Task<ActionResult<UserDetails>> GetUserDetails([FromQuery] string userId)
{
    try
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId);

        if (user == null)
            return NotFound(new { message = "User not found" });

        // Get transaction summary
        var paddyEntries = await _context.PaddyEntries
            .Where(p => p.UserId.ToString() == userId)
            .ToListAsync();

        var payments = await _context.AmaliPayments
            .Where(p => p.UserId.ToString() == userId)
            .ToListAsync();

        var totalAmount = paddyEntries.Sum(p => p.Bags * p.BagAmount);
        var paidAmount = payments.Sum(p => p.Amount);

        var userDetails = new UserDetails
        {
            Id = user.Id.ToString(),
            Name = user.Name,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            Village = user.Village,
            CreatedAt = user.CreatedAt,
            TotalTransactions = paddyEntries.Count,
            TotalAmount = totalAmount,
            PaidAmount = paidAmount,
            OutstandingAmount = totalAmount - paidAmount
        };

        return Ok(userDetails);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching user details");
        return StatusCode(500, new { message = "Failed to fetch user details" });
    }
}
```

#### 4. Update User
```
POST /Account/updateUser
```

**Request Model:**
```csharp
public class UpdateUserRequest
{
    [Required]
    public string Id { get; set; }

    [Required]
    public string FullName { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    public string Role { get; set; }

    public string Password { get; set; }

    [Phone]
    public string PhoneNumber { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("updateUser")]
public async Task<ActionResult<User>> UpdateUser([FromBody] UpdateUserRequest request)
{
    try
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id.ToString() == request.Id);

        if (user == null)
            return NotFound(new { message = "User not found" });

        user.Name = request.FullName;
        user.Email = request.Email;
        user.Role = request.Role;
        user.PhoneNumber = request.PhoneNumber;

        // Only update password if provided
        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new User
        {
            Id = user.Id.ToString(),
            Name = user.Name,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating user");
        return StatusCode(500, new { message = "Failed to update user" });
    }
}
```

---

## Amali Page Implementation

### Overview
The Amali page manages payment calculations and processing for loading labor (amali workers). It supports multi-select loading entries for batch payment processing.

### API Endpoints

#### 1. Calculate Amali Payment
```
POST /Account/calculateAmaliPayment
```

**Request Model:**
```csharp
public class CalculateAmaliPaymentRequest
{
    public List<int> LoadingIds { get; set; }
    public int AmaliId { get; set; }
}
```

**Response Model:**
```csharp
public class AmaliPaymentCalculation
{
    public int AmaliId { get; set; }
    public string AmaliName { get; set; }
    public int TotalLoadings { get; set; }
    public int TotalBags { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RatePerBag { get; set; }
    public decimal CalculatedAmount { get; set; }
    public List<LoadingPaymentDetail> LoadingDetails { get; set; }
}

public class LoadingPaymentDetail
{
    public int LoadingId { get; set; }
    public string LorryNumber { get; set; }
    public DateTime LoadedDate { get; set; }
    public int Bags { get; set; }
    public decimal Weight { get; set; }
    public decimal Amount { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("calculateAmaliPayment")]
public async Task<ActionResult<AmaliPaymentCalculation>> CalculateAmaliPayment(
    [FromBody] CalculateAmaliPaymentRequest request)
{
    try
    {
        var loadingEntries = await _context.LoadingEntries
            .Include(l => l.Amali)
            .Where(l => request.LoadingIds.Contains(l.Id))
            .ToListAsync();

        if (!loadingEntries.Any())
            return NotFound(new { message = "No loading entries found" });

        var amali = loadingEntries.First().Amali;
        var ratePerBag = 10m; // Default rate, should come from configuration or user input

        var calculation = new AmaliPaymentCalculation
        {
            AmaliId = request.AmaliId,
            AmaliName = amali.Name,
            TotalLoadings = loadingEntries.Count,
            TotalBags = loadingEntries.Sum(l => l.TotalNoOfBags ?? 0),
            TotalWeight = loadingEntries.Sum(l => l.TotalLoadWeight ?? 0),
            RatePerBag = ratePerBag,
            CalculatedAmount = loadingEntries.Sum(l => (l.TotalNoOfBags ?? 0) * ratePerBag),
            LoadingDetails = loadingEntries.Select(l => new LoadingPaymentDetail
            {
                LoadingId = l.Id,
                LorryNumber = l.LorryNumber,
                LoadedDate = l.LoadedDate,
                Bags = l.TotalNoOfBags ?? 0,
                Weight = l.TotalLoadWeight ?? 0,
                Amount = (l.TotalNoOfBags ?? 0) * ratePerBag
            }).ToList()
        };

        return Ok(calculation);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error calculating amali payment");
        return StatusCode(500, new { message = "Failed to calculate payment" });
    }
}
```

#### 2. Process Amali Payment
```
POST /Account/processAmaliPayment
```

**Request Model:**
```csharp
public class ProcessAmaliPaymentRequest
{
    public List<int> LoadingIds { get; set; }
    public int AmaliId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentMethod { get; set; }
    public string Notes { get; set; }
    public DateTime PaymentDate { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("processAmaliPayment")]
public async Task<ActionResult> ProcessAmaliPayment([FromBody] ProcessAmaliPaymentRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        // Create payment record
        var payment = new AmaliPayment
        {
            AmaliId = request.AmaliId,
            TotalAmount = request.TotalAmount,
            PaidAmount = request.PaidAmount,
            PaymentMethod = request.PaymentMethod,
            PaymentDate = request.PaymentDate,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.AmaliPayments.Add(payment);
        await _context.SaveChangesAsync();

        // Update loading entries payment status
        var loadingEntries = await _context.LoadingEntries
            .Where(l => request.LoadingIds.Contains(l.Id))
            .ToListAsync();

        foreach (var loading in loadingEntries)
        {
            loading.PaymentDone = true;
            loading.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { message = "Payment processed successfully", paymentId = payment.Id });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Error processing amali payment");
        return StatusCode(500, new { message = "Failed to process payment" });
    }
}
```

---

## All Paddy Details Page Implementation

### Overview
The All Paddy Details page provides a comprehensive view of all paddy entries with advanced filtering, bulk operations, and export capabilities.

### API Endpoints

#### 1. Get All Paddy Entries
```
GET /Account/getPaddyDetails?userId=0
```

**Response:** Returns list of `PaddyEntryDetails` (see Loading section)

**Implementation:**
```csharp
[HttpGet("getPaddyDetails")]
public async Task<ActionResult<List<PaddyEntryDetails>>> GetPaddyDetails([FromQuery] string userId)
{
    try
    {
        var query = _context.PaddyEntries
            .Include(p => p.RythuUser)
            .Include(p => p.DealerUser)
            .AsQueryable();

        // If userId is "0", return all entries
        if (userId != "0")
        {
            query = query.Where(p => p.UserId.ToString() == userId);
        }

        var paddyEntries = await query
            .Select(p => new PaddyEntryDetails
            {
                Id = p.Id.ToString(),
                LorryNumber = p.LorryNumber,
                Bags = p.Bags,
                KgPerBag = p.KgPerBag,
                BagAmount = p.BagAmount,
                DealerBagAmount = p.DealerBagAmount,
                LoadedDate = p.LoadedDate.ToString("yyyy-MM-dd"),
                TotalWeight = p.TotalWeight,
                UserId = p.UserId.ToString(),
                DealerId = p.DealerId.ToString(),
                LoadingId = p.LoadingId,
                LoadType = p.LoadType,
                Status = p.Status,
                Rythu = p.RythuUser.Name,
                Dealer = p.DealerUser.Name,
                RythuPhone = p.RythuUser.PhoneNumber,
                FinalAmount = p.Bags * p.BagAmount,
                DealerFinalAmount = p.Bags * p.DealerBagAmount
            })
            .OrderByDescending(p => p.LoadedDate)
            .ToListAsync();

        return Ok(paddyEntries);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching paddy details");
        return StatusCode(500, new { message = "Failed to fetch paddy details" });
    }
}
```

#### 2. Insert Paddy Entry
```
POST /Account/insertPaddy
```

**Request Model:**
```csharp
public class InsertPaddyRequest
{
    [Required]
    public string UserId { get; set; }

    [Required]
    public string LorryNumber { get; set; }

    [Required]
    public int Bags { get; set; }

    [Required]
    public decimal KgPerBag { get; set; }

    [Required]
    public decimal BagAmount { get; set; }

    [Required]
    public string LoadedDate { get; set; }

    [Required]
    public decimal TotalWeight { get; set; }

    [Required]
    public string DealerId { get; set; }

    public string RythuId { get; set; }

    [Required]
    public decimal DealerBagAmount { get; set; }

    [Required]
    public int LoadingId { get; set; }

    public string LoadType { get; set; } = "potha";
}
```

**Implementation:**
```csharp
[HttpPost("insertPaddy")]
public async Task<ActionResult<PaddyEntry>> InsertPaddy([FromBody] InsertPaddyRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var paddyEntry = new PaddyEntry
        {
            UserId = Guid.Parse(request.UserId),
            LorryNumber = request.LorryNumber,
            Bags = request.Bags,
            KgPerBag = request.KgPerBag,
            BagAmount = request.BagAmount,
            LoadedDate = DateTime.Parse(request.LoadedDate),
            TotalWeight = request.TotalWeight,
            DealerId = Guid.Parse(request.DealerId),
            RythuId = string.IsNullOrEmpty(request.RythuId) ? null : Guid.Parse(request.RythuId),
            DealerBagAmount = request.DealerBagAmount,
            LoadingId = request.LoadingId,
            LoadType = request.LoadType,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.PaddyEntries.Add(paddyEntry);
        await _context.SaveChangesAsync();

        // Update loading entry totals
        await UpdateLoadingTotals(request.LoadingId);

        await transaction.CommitAsync();

        return Ok(paddyEntry);
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Error inserting paddy entry");
        return StatusCode(500, new { message = "Failed to create paddy entry" });
    }
}

private async Task UpdateLoadingTotals(int loadingId)
{
    var loading = await _context.LoadingEntries
        .FirstOrDefaultAsync(l => l.Id == loadingId);

    if (loading != null)
    {
        var paddyEntries = await _context.PaddyEntries
            .Where(p => p.LoadingId == loadingId)
            .ToListAsync();

        loading.TotalNoOfBags = paddyEntries.Sum(p => p.Bags);
        loading.TotalLoadWeight = paddyEntries.Sum(p => p.TotalWeight);
        loading.Status = paddyEntries.Any() ? "in progress" : "loading not started";
        loading.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }
}
```

#### 3. Update Paddy Entry
```
POST /Account/updatePaddyDetails
```

**Request Model:**
```csharp
public class UpdatePaddyRequest
{
    [Required]
    public string Id { get; set; }

    [Required]
    public string UserId { get; set; }

    public string LorryNumber { get; set; }
    public int? Bags { get; set; }
    public decimal? KgPerBag { get; set; }
    public decimal? BagAmount { get; set; }
    public string LoadedDate { get; set; }
    public decimal? TotalWeight { get; set; }
    public string DealerId { get; set; }
    public decimal? DealerBagAmount { get; set; }
    public string LoadingId { get; set; }
    public string LoadType { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("updatePaddyDetails")]
public async Task<ActionResult<PaddyEntry>> UpdatePaddyDetails([FromBody] UpdatePaddyRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var paddyEntry = await _context.PaddyEntries
            .FirstOrDefaultAsync(p => p.Id.ToString() == request.Id);

        if (paddyEntry == null)
            return NotFound(new { message = "Paddy entry not found" });

        // Update fields if provided
        if (!string.IsNullOrEmpty(request.LorryNumber))
            paddyEntry.LorryNumber = request.LorryNumber;

        if (request.Bags.HasValue)
            paddyEntry.Bags = request.Bags.Value;

        if (request.KgPerBag.HasValue)
            paddyEntry.KgPerBag = request.KgPerBag.Value;

        if (request.BagAmount.HasValue)
            paddyEntry.BagAmount = request.BagAmount.Value;

        if (!string.IsNullOrEmpty(request.LoadedDate))
            paddyEntry.LoadedDate = DateTime.Parse(request.LoadedDate);

        if (request.TotalWeight.HasValue)
            paddyEntry.TotalWeight = request.TotalWeight.Value;

        if (!string.IsNullOrEmpty(request.DealerId))
            paddyEntry.DealerId = Guid.Parse(request.DealerId);

        if (request.DealerBagAmount.HasValue)
            paddyEntry.DealerBagAmount = request.DealerBagAmount.Value;

        if (!string.IsNullOrEmpty(request.LoadType))
            paddyEntry.LoadType = request.LoadType;

        paddyEntry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Update loading entry totals
        if (!string.IsNullOrEmpty(request.LoadingId))
        {
            await UpdateLoadingTotals(int.Parse(request.LoadingId));
        }

        await transaction.CommitAsync();

        return Ok(paddyEntry);
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Error updating paddy details");
        return StatusCode(500, new { message = "Failed to update paddy entry" });
    }
}
```

#### 4. Update Paddy Status
```
POST /Account/updatePaddy
```

**Request Model:**
```csharp
public class UpdatePaddyStatusRequest
{
    [Required]
    public string Id { get; set; }

    [Required]
    public string Status { get; set; } // "pending" or "completed"

    public string UserRole { get; set; }
}
```

**Implementation:**
```csharp
[HttpPost("updatePaddy")]
public async Task<ActionResult<PaddyEntry>> UpdatePaddy([FromBody] UpdatePaddyStatusRequest request)
{
    try
    {
        var paddyEntry = await _context.PaddyEntries
            .FirstOrDefaultAsync(p => p.Id.ToString() == request.Id);

        if (paddyEntry == null)
            return NotFound(new { message = "Paddy entry not found" });

        paddyEntry.Status = request.Status;
        paddyEntry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(paddyEntry);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating paddy status");
        return StatusCode(500, new { message = "Failed to update paddy status" });
    }
}
```

---

## Dashboard Page Implementation

### Overview
The Dashboard provides key metrics and statistics including lorry counts, amounts, completion rates, and vendor statistics.

### API Endpoints

#### 1. Get Dashboard Statistics
```
GET /Account/getDashboardStats
```

**Response Model:**
```csharp
public class DashboardStats
{
    public int TotalLorries { get; set; }
    public int CompletedLorries { get; set; }
    public int PendingLorries { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PendingAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal PaymentRate { get; set; }
    public List<VendorStat> VendorStats { get; set; }
}

public class VendorStat
{
    public string Name { get; set; }
    public int TotalLorries { get; set; }
    public decimal Amount { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("getDashboardStats")]
public async Task<ActionResult<DashboardStats>> GetDashboardStats()
{
    try
    {
        // Get all paddy entries
        var paddyEntries = await _context.PaddyEntries
            .Include(p => p.DealerUser)
            .ToListAsync();

        // Calculate unique lorry numbers
        var allLorries = paddyEntries.Select(p => p.LorryNumber).Distinct().ToList();
        var completedLorries = paddyEntries
            .Where(p => p.Status.ToLower() == "completed")
            .Select(p => p.LorryNumber)
            .Distinct()
            .ToList();
        var pendingLorries = paddyEntries
            .Where(p => p.Status.ToLower() == "pending")
            .Select(p => p.LorryNumber)
            .Distinct()
            .ToList();

        // Calculate amounts
        var totalAmount = paddyEntries.Sum(p => p.Bags * p.BagAmount);
        var receivedAmount = paddyEntries
            .Where(p => p.Status.ToLower() == "completed")
            .Sum(p => p.Bags * p.BagAmount);
        var pendingAmount = paddyEntries
            .Where(p => p.Status.ToLower() == "pending")
            .Sum(p => p.Bags * p.BagAmount);

        // Calculate vendor stats with unique lorry counts
        var vendorStats = paddyEntries
            .GroupBy(p => p.DealerUser.Name)
            .Select(g => new VendorStat
            {
                Name = g.Key,
                TotalLorries = g.Select(p => p.LorryNumber).Distinct().Count(),
                Amount = g.Sum(p => p.Bags * p.BagAmount)
            })
            .OrderByDescending(v => v.Amount)
            .ToList();

        var stats = new DashboardStats
        {
            TotalLorries = allLorries.Count,
            CompletedLorries = completedLorries.Count,
            PendingLorries = pendingLorries.Count,
            TotalAmount = totalAmount,
            ReceivedAmount = receivedAmount,
            PendingAmount = pendingAmount,
            CompletionRate = allLorries.Count > 0
                ? (decimal)completedLorries.Count / allLorries.Count * 100
                : 0,
            PaymentRate = totalAmount > 0
                ? receivedAmount / totalAmount * 100
                : 0,
            VendorStats = vendorStats
        };

        return Ok(stats);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching dashboard stats");
        return StatusCode(500, new { message = "Failed to fetch dashboard statistics" });
    }
}
```

---

## Database Models

### LoadingEntry Model
```csharp
public class LoadingEntry
{
    public int Id { get; set; }
    public DateTime LoadedDate { get; set; }
    public string LorryNumber { get; set; }
    public int DealerId { get; set; }
    public int AmaliId { get; set; }
    public int? SeasonId { get; set; }
    public int? TotalNoOfBags { get; set; }
    public decimal? TotalLoadWeight { get; set; }
    public string Status { get; set; }
    public bool PaymentDone { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string UpdatedBy { get; set; }

    // Navigation properties
    public virtual User Dealer { get; set; }
    public virtual User Amali { get; set; }
    public virtual ICollection<PaddyEntry> PaddyEntries { get; set; }
}
```

### PaddyEntry Model
```csharp
public class PaddyEntry
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string LorryNumber { get; set; }
    public int Bags { get; set; }
    public decimal KgPerBag { get; set; }
    public decimal BagAmount { get; set; }
    public decimal DealerBagAmount { get; set; }
    public DateTime LoadedDate { get; set; }
    public decimal TotalWeight { get; set; }
    public Guid DealerId { get; set; }
    public Guid? RythuId { get; set; }
    public int LoadingId { get; set; }
    public string LoadType { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual User RythuUser { get; set; }
    public virtual User DealerUser { get; set; }
    public virtual LoadingEntry Loading { get; set; }
}
```

### AmaliPayment Model
```csharp
public class AmaliPayment
{
    public int Id { get; set; }
    public int AmaliId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual User Amali { get; set; }
}
```

---

## Security Considerations

1. **Authentication:** All endpoints require JWT authentication
2. **Authorization:** Role-based access control for sensitive operations
3. **Input Validation:** Validate all user inputs using data annotations
4. **SQL Injection Prevention:** Use parameterized queries via Entity Framework
5. **Rate Limiting:** Implement rate limiting for API endpoints
6. **Audit Logging:** Log all CRUD operations with user information

---

## Performance Optimization

1. **Indexing:** Create indexes on frequently queried columns
   - `lorryNumber` in `loading_entries` and `paddy_entries`
   - `loadingId` in `paddy_entries`
   - `userId`, `dealerId` in `paddy_entries`
   - `status` in both tables

2. **Caching:** Implement caching for dashboard statistics and user lists

3. **Pagination:** Add pagination to list endpoints for large datasets

4. **Async Operations:** Use async/await for all database operations

---

## Testing Checklist

- [ ] Test all CRUD operations for loading entries
- [ ] Test all CRUD operations for paddy entries
- [ ] Verify loading totals auto-calculation
- [ ] Test user search and filtering
- [ ] Test amali payment calculation and processing
- [ ] Verify dashboard statistics accuracy
- [ ] Test concurrent updates with transaction handling
- [ ] Test error handling and validation
- [ ] Verify authorization on protected endpoints
- [ ] Load testing for dashboard statistics

---

## Conclusion

This implementation provides a complete backend solution for the core application pages with:
- Comprehensive API endpoints
- Proper data models
- Transaction management
- Error handling
- Security measures
- Performance optimization strategies

The frontend is already built and ready to consume these endpoints. Implement these endpoints in sequence, starting with the foundational user and loading management, then building up to the more complex features like amali payments and dashboard statistics.
