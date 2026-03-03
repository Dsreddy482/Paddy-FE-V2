# .NET Backend Implementation Guide: Reports Module

## Overview
This document outlines the implementation of a comprehensive Reports module in the .NET backend that provides detailed analytics and reporting capabilities across all major business operations including Paddy purchases, Loading operations, Inventory management, Paddy Fields, Financial data, and User activities.

## Database Schema

### Existing Tables Used
The Reports module leverages existing database tables:
- `paddy_entries` - Paddy purchase records
- `loading_entries` - Loading/unloading operations
- `inventory_items` - Inventory stock and pricing
- `inventory_allocations` - Inventory allocation history
- `paddy_fields` - Field management data
- `transactions` - Financial transactions
- `users` - User information
- `amali_payments` - Payment records

No new database tables are required as reports aggregate data from existing tables.

## API Endpoints

### 1. Paddy Purchase Report
```
GET /api/reports/paddy
```

**Query Parameters:**
- `startDate` (optional, DateTime): Filter by start date
- `endDate` (optional, DateTime): Filter by end date
- `status` (optional, string): Filter by status (pending/completed)
- `dealer` (optional, string): Filter by dealer name
- `format` (optional, string): Response format (json/pdf) - default: json

**Response Model:**
```csharp
public class PaddyReportResponse
{
    public PaddyReportSummary Summary { get; set; }
    public List<PaddyReportItem> Items { get; set; }
}

public class PaddyReportSummary
{
    public int UniqueLorries { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalEntries { get; set; }
    public Dictionary<string, decimal> ByDealer { get; set; }
    public Dictionary<string, decimal> ByVariety { get; set; }
}

public class PaddyReportItem
{
    public DateTime Date { get; set; }
    public string LorryNumber { get; set; }
    public string Dealer { get; set; }
    public string Variety { get; set; }
    public decimal NetWeight { get; set; }
    public decimal Rate { get; set; }
    public decimal FinalAmount { get; set; }
    public string Status { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("paddy")]
public async Task<ActionResult<PaddyReportResponse>> GetPaddyReport(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? status,
    [FromQuery] string? dealer,
    [FromQuery] string format = "json")
{
    var query = _context.PaddyEntries.AsQueryable();

    // Apply filters
    if (startDate.HasValue)
        query = query.Where(p => p.Date >= startDate.Value);

    if (endDate.HasValue)
        query = query.Where(p => p.Date <= endDate.Value);

    if (!string.IsNullOrEmpty(status))
        query = query.Where(p => p.Status.ToLower() == status.ToLower());

    if (!string.IsNullOrEmpty(dealer))
        query = query.Where(p => p.Dealer == dealer);

    var entries = await query.ToListAsync();

    var summary = new PaddyReportSummary
    {
        UniqueLorries = entries.Select(e => e.LorryNumber).Distinct().Count(),
        TotalWeight = entries.Sum(e => e.NetWeight),
        TotalAmount = entries.Sum(e => e.FinalAmount),
        TotalEntries = entries.Count,
        ByDealer = entries.GroupBy(e => e.Dealer)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.FinalAmount)),
        ByVariety = entries.GroupBy(e => e.Variety)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.NetWeight))
    };

    var items = entries.Select(e => new PaddyReportItem
    {
        Date = e.Date,
        LorryNumber = e.LorryNumber,
        Dealer = e.Dealer,
        Variety = e.Variety,
        NetWeight = e.NetWeight,
        Rate = e.Rate,
        FinalAmount = e.FinalAmount,
        Status = e.Status
    }).ToList();

    var response = new PaddyReportResponse
    {
        Summary = summary,
        Items = items
    };

    if (format.ToLower() == "pdf")
        return GeneratePaddyPdf(response);

    return Ok(response);
}
```

### 2. Loading & Unloading Report
```
GET /api/reports/loading
```

**Query Parameters:**
- `startDate` (optional, DateTime): Filter by start date
- `endDate` (optional, DateTime): Filter by end date
- `type` (optional, string): Filter by type (loading/unloading)
- `vehicleType` (optional, string): Filter by vehicle type
- `format` (optional, string): Response format (json/pdf) - default: json

**Response Model:**
```csharp
public class LoadingReportResponse
{
    public LoadingReportSummary Summary { get; set; }
    public List<LoadingReportItem> Items { get; set; }
}

public class LoadingReportSummary
{
    public int TotalOperations { get; set; }
    public int TotalLabor { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalWeight { get; set; }
    public int LoadingCount { get; set; }
    public int UnloadingCount { get; set; }
    public Dictionary<string, int> ByVehicleType { get; set; }
}

public class LoadingReportItem
{
    public DateTime Date { get; set; }
    public string Type { get; set; }
    public string VehicleNumber { get; set; }
    public string VehicleType { get; set; }
    public decimal Weight { get; set; }
    public int LaborCount { get; set; }
    public decimal LaborCost { get; set; }
    public string Notes { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("loading")]
public async Task<ActionResult<LoadingReportResponse>> GetLoadingReport(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? type,
    [FromQuery] string? vehicleType,
    [FromQuery] string format = "json")
{
    var query = _context.LoadingEntries.AsQueryable();

    // Apply filters
    if (startDate.HasValue)
        query = query.Where(l => l.Date >= startDate.Value);

    if (endDate.HasValue)
        query = query.Where(l => l.Date <= endDate.Value);

    if (!string.IsNullOrEmpty(type))
        query = query.Where(l => l.Type.ToLower() == type.ToLower());

    if (!string.IsNullOrEmpty(vehicleType))
        query = query.Where(l => l.VehicleType == vehicleType);

    var entries = await query.ToListAsync();

    var summary = new LoadingReportSummary
    {
        TotalOperations = entries.Count,
        TotalLabor = entries.Sum(e => e.LaborCount),
        TotalCost = entries.Sum(e => e.LaborCost),
        TotalWeight = entries.Sum(e => e.Weight),
        LoadingCount = entries.Count(e => e.Type.ToLower() == "loading"),
        UnloadingCount = entries.Count(e => e.Type.ToLower() == "unloading"),
        ByVehicleType = entries.GroupBy(e => e.VehicleType)
            .ToDictionary(g => g.Key, g => g.Count())
    };

    var items = entries.Select(e => new LoadingReportItem
    {
        Date = e.Date,
        Type = e.Type,
        VehicleNumber = e.VehicleNumber,
        VehicleType = e.VehicleType,
        Weight = e.Weight,
        LaborCount = e.LaborCount,
        LaborCost = e.LaborCost,
        Notes = e.Notes
    }).ToList();

    var response = new LoadingReportResponse
    {
        Summary = summary,
        Items = items
    };

    if (format.ToLower() == "pdf")
        return GenerateLoadingPdf(response);

    return Ok(response);
}
```

### 3. Inventory Report
```
GET /api/reports/inventory
```

**Query Parameters:**
- `category` (optional, string): Filter by category
- `stockLevel` (optional, string): Filter by stock level (all/low/out)
- `search` (optional, string): Search by item name
- `format` (optional, string): Response format (json/pdf) - default: json

**Response Model:**
```csharp
public class InventoryReportResponse
{
    public InventoryReportSummary Summary { get; set; }
    public List<InventoryReportItem> Items { get; set; }
}

public class InventoryReportSummary
{
    public int TotalItems { get; set; }
    public decimal TotalStock { get; set; }
    public decimal TotalInvestment { get; set; }
    public decimal TotalValue { get; set; }
    public int LowStockItems { get; set; }
    public int OutOfStockItems { get; set; }
    public decimal PotentialProfit { get; set; }
    public Dictionary<string, int> ByCategory { get; set; }
}

public class InventoryReportItem
{
    public string ItemName { get; set; }
    public string Category { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal MinimumStock { get; set; }
    public string Unit { get; set; }
    public decimal TotalInvestment { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal TotalValue { get; set; }
    public string Status { get; set; }
    public string Location { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("inventory")]
public async Task<ActionResult<InventoryReportResponse>> GetInventoryReport(
    [FromQuery] string? category,
    [FromQuery] string? stockLevel,
    [FromQuery] string? search,
    [FromQuery] string format = "json")
{
    var query = _context.InventoryItems.AsQueryable();

    // Apply filters
    if (!string.IsNullOrEmpty(category))
        query = query.Where(i => i.Category == category);

    if (!string.IsNullOrEmpty(search))
        query = query.Where(i => i.ItemName.Contains(search));

    if (stockLevel == "low")
        query = query.Where(i => i.CurrentStock <= i.MinimumStock);
    else if (stockLevel == "out")
        query = query.Where(i => i.CurrentStock == 0);

    var items = await query.ToListAsync();

    var summary = new InventoryReportSummary
    {
        TotalItems = items.Count,
        TotalStock = items.Sum(i => i.CurrentStock),
        TotalInvestment = items.Sum(i => i.TotalInvestment ?? 0),
        TotalValue = items.Sum(i => i.CurrentStock * (i.SellingPrice ?? 0)),
        LowStockItems = items.Count(i => i.CurrentStock <= i.MinimumStock && i.CurrentStock > 0),
        OutOfStockItems = items.Count(i => i.CurrentStock == 0),
        PotentialProfit = items.Sum(i => (i.CurrentStock * (i.SellingPrice ?? 0)) - (i.TotalInvestment ?? 0)),
        ByCategory = items.GroupBy(i => i.Category)
            .ToDictionary(g => g.Key, g => g.Count())
    };

    var reportItems = items.Select(i => new InventoryReportItem
    {
        ItemName = i.ItemName,
        Category = i.Category,
        CurrentStock = i.CurrentStock,
        MinimumStock = i.MinimumStock,
        Unit = i.Unit,
        TotalInvestment = i.TotalInvestment ?? 0,
        SellingPrice = i.SellingPrice ?? 0,
        TotalValue = i.CurrentStock * (i.SellingPrice ?? 0),
        Status = i.CurrentStock == 0 ? "Out of Stock" :
                 i.CurrentStock <= i.MinimumStock ? "Low Stock" : "In Stock",
        Location = i.Location
    }).ToList();

    var response = new InventoryReportResponse
    {
        Summary = summary,
        Items = reportItems
    };

    if (format.ToLower() == "pdf")
        return GenerateInventoryPdf(response);

    return Ok(response);
}
```

### 4. Paddy Fields Report
```
GET /api/reports/fields
```

**Query Parameters:**
- `location` (optional, string): Filter by location
- `soilType` (optional, string): Filter by soil type
- `status` (optional, string): Filter by status (active/inactive)
- `format` (optional, string): Response format (json/pdf) - default: json

**Response Model:**
```csharp
public class PaddyFieldsReportResponse
{
    public PaddyFieldsReportSummary Summary { get; set; }
    public List<PaddyFieldsReportItem> Items { get; set; }
}

public class PaddyFieldsReportSummary
{
    public int TotalFields { get; set; }
    public decimal TotalArea { get; set; }
    public int ActiveFields { get; set; }
    public int InactiveFields { get; set; }
    public Dictionary<string, int> ByLocation { get; set; }
    public Dictionary<string, decimal> BySoilType { get; set; }
}

public class PaddyFieldsReportItem
{
    public string FieldName { get; set; }
    public string Location { get; set; }
    public decimal Area { get; set; }
    public string SoilType { get; set; }
    public string OwnerName { get; set; }
    public string Status { get; set; }
    public DateTime? LastHarvestDate { get; set; }
    public string Notes { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("fields")]
public async Task<ActionResult<PaddyFieldsReportResponse>> GetFieldsReport(
    [FromQuery] string? location,
    [FromQuery] string? soilType,
    [FromQuery] string? status,
    [FromQuery] string format = "json")
{
    var query = _context.PaddyFields.AsQueryable();

    // Apply filters
    if (!string.IsNullOrEmpty(location))
        query = query.Where(f => f.Location == location);

    if (!string.IsNullOrEmpty(soilType))
        query = query.Where(f => f.SoilType == soilType);

    if (!string.IsNullOrEmpty(status))
        query = query.Where(f => f.Status.ToLower() == status.ToLower());

    var fields = await query.ToListAsync();

    var summary = new PaddyFieldsReportSummary
    {
        TotalFields = fields.Count,
        TotalArea = fields.Sum(f => f.Area),
        ActiveFields = fields.Count(f => f.Status.ToLower() == "active"),
        InactiveFields = fields.Count(f => f.Status.ToLower() == "inactive"),
        ByLocation = fields.GroupBy(f => f.Location)
            .ToDictionary(g => g.Key, g => g.Count()),
        BySoilType = fields.GroupBy(f => f.SoilType)
            .ToDictionary(g => g.Key, g => g.Sum(f => f.Area))
    };

    var items = fields.Select(f => new PaddyFieldsReportItem
    {
        FieldName = f.FieldName,
        Location = f.Location,
        Area = f.Area,
        SoilType = f.SoilType,
        OwnerName = f.OwnerName,
        Status = f.Status,
        LastHarvestDate = f.LastHarvestDate,
        Notes = f.Notes
    }).ToList();

    var response = new PaddyFieldsReportResponse
    {
        Summary = summary,
        Items = items
    };

    if (format.ToLower() == "pdf")
        return GenerateFieldsPdf(response);

    return Ok(response);
}
```

### 5. Financial Report
```
GET /api/reports/financial
```

**Query Parameters:**
- `startDate` (optional, DateTime): Filter by start date
- `endDate` (optional, DateTime): Filter by end date
- `transactionType` (optional, string): Filter by type (credit/debit)
- `category` (optional, string): Filter by category
- `format` (optional, string): Response format (json/pdf) - default: json

**Response Model:**
```csharp
public class FinancialReportResponse
{
    public FinancialReportSummary Summary { get; set; }
    public List<FinancialReportItem> Items { get; set; }
}

public class FinancialReportSummary
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public int TotalTransactions { get; set; }
    public decimal PaddyRevenue { get; set; }
    public decimal InventoryRevenue { get; set; }
    public decimal LoadingExpenses { get; set; }
    public decimal InventoryInvestment { get; set; }
    public Dictionary<string, decimal> RevenueByMonth { get; set; }
    public Dictionary<string, decimal> ExpensesByCategory { get; set; }
}

public class FinancialReportItem
{
    public DateTime Date { get; set; }
    public string Description { get; set; }
    public string Type { get; set; }
    public string Category { get; set; }
    public decimal Amount { get; set; }
    public string ReferenceNumber { get; set; }
    public string Notes { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("financial")]
public async Task<ActionResult<FinancialReportResponse>> GetFinancialReport(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? transactionType,
    [FromQuery] string? category,
    [FromQuery] string format = "json")
{
    var query = _context.Transactions.AsQueryable();

    // Apply filters
    if (startDate.HasValue)
        query = query.Where(t => t.Date >= startDate.Value);

    if (endDate.HasValue)
        query = query.Where(t => t.Date <= endDate.Value);

    if (!string.IsNullOrEmpty(transactionType))
        query = query.Where(t => t.Type.ToLower() == transactionType.ToLower());

    if (!string.IsNullOrEmpty(category))
        query = query.Where(t => t.Category == category);

    var transactions = await query.ToListAsync();

    var totalRevenue = transactions.Where(t => t.Type.ToLower() == "credit").Sum(t => t.Amount);
    var totalExpenses = transactions.Where(t => t.Type.ToLower() == "debit").Sum(t => t.Amount);

    var summary = new FinancialReportSummary
    {
        TotalRevenue = totalRevenue,
        TotalExpenses = totalExpenses,
        NetProfit = totalRevenue - totalExpenses,
        TotalTransactions = transactions.Count,
        PaddyRevenue = transactions.Where(t => t.Category == "Paddy Sales").Sum(t => t.Amount),
        InventoryRevenue = transactions.Where(t => t.Category == "Inventory Sales").Sum(t => t.Amount),
        LoadingExpenses = transactions.Where(t => t.Category == "Loading").Sum(t => t.Amount),
        InventoryInvestment = transactions.Where(t => t.Category == "Inventory Purchase").Sum(t => t.Amount),
        RevenueByMonth = transactions.Where(t => t.Type.ToLower() == "credit")
            .GroupBy(t => t.Date.ToString("yyyy-MM"))
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount)),
        ExpensesByCategory = transactions.Where(t => t.Type.ToLower() == "debit")
            .GroupBy(t => t.Category)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount))
    };

    var items = transactions.Select(t => new FinancialReportItem
    {
        Date = t.Date,
        Description = t.Description,
        Type = t.Type,
        Category = t.Category,
        Amount = t.Amount,
        ReferenceNumber = t.ReferenceNumber,
        Notes = t.Notes
    }).ToList();

    var response = new FinancialReportResponse
    {
        Summary = summary,
        Items = items
    };

    if (format.ToLower() == "pdf")
        return GenerateFinancialPdf(response);

    return Ok(response);
}
```

### 6. User Activity Report
```
GET /api/reports/user-activity
```

**Query Parameters:**
- `startDate` (optional, DateTime): Filter by start date
- `endDate` (optional, DateTime): Filter by end date
- `userId` (optional, Guid): Filter by specific user
- `search` (optional, string): Search by user name
- `format` (optional, string): Response format (json/pdf) - default: json

**Response Model:**
```csharp
public class UserActivityReportResponse
{
    public UserActivityReportSummary Summary { get; set; }
    public List<UserActivityReportItem> Items { get; set; }
}

public class UserActivityReportSummary
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public decimal TotalTransactions { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public decimal TotalOutstanding { get; set; }
    public int UsersWithOutstanding { get; set; }
}

public class UserActivityReportItem
{
    public Guid UserId { get; set; }
    public string UserName { get; set; }
    public string Phone { get; set; }
    public string Village { get; set; }
    public int TransactionCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public DateTime? LastTransactionDate { get; set; }
    public DateTime? LastPaymentDate { get; set; }
}
```

**Implementation:**
```csharp
[HttpGet("user-activity")]
public async Task<ActionResult<UserActivityReportResponse>> GetUserActivityReport(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] Guid? userId,
    [FromQuery] string? search,
    [FromQuery] string format = "json")
{
    var usersQuery = _context.Users.AsQueryable();
    var transactionsQuery = _context.Transactions.AsQueryable();
    var paymentsQuery = _context.AmaliPayments.AsQueryable();

    // Apply filters
    if (userId.HasValue)
        usersQuery = usersQuery.Where(u => u.Id == userId.Value);

    if (!string.IsNullOrEmpty(search))
        usersQuery = usersQuery.Where(u => u.Name.Contains(search));

    if (startDate.HasValue)
        transactionsQuery = transactionsQuery.Where(t => t.Date >= startDate.Value);

    if (endDate.HasValue)
        transactionsQuery = transactionsQuery.Where(t => t.Date <= endDate.Value);

    var users = await usersQuery.ToListAsync();
    var transactions = await transactionsQuery.ToListAsync();
    var payments = await paymentsQuery.ToListAsync();

    var items = users.Select(u =>
    {
        var userTransactions = transactions.Where(t => t.UserId == u.Id).ToList();
        var userPayments = payments.Where(p => p.UserId == u.Id).ToList();

        var totalAmount = userTransactions.Sum(t => t.Amount);
        var paidAmount = userPayments.Sum(p => p.Amount);
        var outstanding = totalAmount - paidAmount;

        return new UserActivityReportItem
        {
            UserId = u.Id,
            UserName = u.Name,
            Phone = u.Phone,
            Village = u.Village,
            TransactionCount = userTransactions.Count,
            TotalAmount = totalAmount,
            PaidAmount = paidAmount,
            OutstandingAmount = outstanding,
            LastTransactionDate = userTransactions.Any() ? userTransactions.Max(t => t.Date) : null,
            LastPaymentDate = userPayments.Any() ? userPayments.Max(p => p.PaymentDate) : null
        };
    }).ToList();

    var summary = new UserActivityReportSummary
    {
        TotalUsers = items.Count,
        ActiveUsers = items.Count(i => i.TransactionCount > 0),
        TotalTransactions = items.Sum(i => i.TransactionCount),
        TotalPaidAmount = items.Sum(i => i.PaidAmount),
        TotalOutstanding = items.Sum(i => i.OutstandingAmount),
        UsersWithOutstanding = items.Count(i => i.OutstandingAmount > 0)
    };

    var response = new UserActivityReportResponse
    {
        Summary = summary,
        Items = items
    };

    if (format.ToLower() == "pdf")
        return GenerateUserActivityPdf(response);

    return Ok(response);
}
```

## PDF Generation Service

Create a dedicated service for PDF generation:

```csharp
public interface IPdfGeneratorService
{
    byte[] GeneratePaddyReport(PaddyReportResponse data);
    byte[] GenerateLoadingReport(LoadingReportResponse data);
    byte[] GenerateInventoryReport(InventoryReportResponse data);
    byte[] GenerateFieldsReport(PaddyFieldsReportResponse data);
    byte[] GenerateFinancialReport(FinancialReportResponse data);
    byte[] GenerateUserActivityReport(UserActivityReportResponse data);
}

public class PdfGeneratorService : IPdfGeneratorService
{
    public byte[] GeneratePaddyReport(PaddyReportResponse data)
    {
        // Use iTextSharp, QuestPDF, or similar library
        // Generate PDF with header, summary, and detailed table
        // Return byte array of PDF
    }

    public byte[] GenerateLoadingReport(LoadingReportResponse data)
    {
        // Similar implementation
    }

    public byte[] GenerateInventoryReport(InventoryReportResponse data)
    {
        // Similar implementation
    }

    public byte[] GenerateFieldsReport(PaddyFieldsReportResponse data)
    {
        // Similar implementation
    }

    public byte[] GenerateFinancialReport(FinancialReportResponse data)
    {
        // Similar implementation
    }

    public byte[] GenerateUserActivityReport(UserActivityReportResponse data)
    {
        // Similar implementation
    }
}
```

## Controller Structure

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPdfGeneratorService _pdfGenerator;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        ApplicationDbContext context,
        IPdfGeneratorService pdfGenerator,
        ILogger<ReportsController> logger)
    {
        _context = context;
        _pdfGenerator = pdfGenerator;
        _logger = logger;
    }

    // All report endpoints implementation
    // ...

    private FileContentResult GeneratePaddyPdf(PaddyReportResponse data)
    {
        var pdfBytes = _pdfGenerator.GeneratePaddyReport(data);
        return File(pdfBytes, "application/pdf", $"paddy-report-{DateTime.Now:yyyy-MM-dd}.pdf");
    }

    // Similar methods for other reports
}
```

## Dependency Injection Setup

In `Program.cs` or `Startup.cs`:

```csharp
services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
```

## Required NuGet Packages

```xml
<!-- For PDF Generation -->
<PackageReference Include="QuestPDF" Version="2023.12.0" />
<!-- OR -->
<PackageReference Include="iTextSharp.LGPLv2.Core" Version="3.4.10" />

<!-- For Excel Export (optional) -->
<PackageReference Include="EPPlus" Version="7.0.0" />
```

## Security Considerations

1. **Authorization**: All report endpoints require authentication
2. **Data Access**: Users should only access data they're authorized to view
3. **Rate Limiting**: Implement rate limiting for report generation to prevent abuse
4. **Caching**: Consider caching frequently requested reports
5. **Async Operations**: Use async/await for database queries to prevent blocking

## Performance Optimization

1. **Pagination**: Implement pagination for large datasets
2. **Indexing**: Ensure proper database indexes on date and filter columns
3. **Caching**: Cache report data for common queries
4. **Background Jobs**: For very large reports, consider using background job processing
5. **Projection**: Use `.Select()` to only fetch required fields

## Testing

```csharp
[Fact]
public async Task GetPaddyReport_WithDateRange_ReturnsFilteredData()
{
    // Arrange
    var startDate = DateTime.Now.AddDays(-30);
    var endDate = DateTime.Now;

    // Act
    var result = await _controller.GetPaddyReport(startDate, endDate, null, null);

    // Assert
    Assert.NotNull(result.Value);
    Assert.All(result.Value.Items, item =>
        Assert.InRange(item.Date, startDate, endDate));
}
```

## Implementation Checklist

- [ ] Create ReportsController with all 6 endpoints
- [ ] Implement response models for each report type
- [ ] Create PDF generator service
- [ ] Add proper error handling and logging
- [ ] Implement authorization checks
- [ ] Add input validation
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Add API documentation (Swagger)
- [ ] Implement caching strategy
- [ ] Add performance monitoring
- [ ] Configure CORS if needed

## API Documentation Example (Swagger)

```csharp
/// <summary>
/// Generate Paddy Purchase Report
/// </summary>
/// <param name="startDate">Filter by start date</param>
/// <param name="endDate">Filter by end date</param>
/// <param name="status">Filter by status (pending/completed)</param>
/// <param name="dealer">Filter by dealer name</param>
/// <param name="format">Response format (json/pdf)</param>
/// <returns>Paddy purchase report data</returns>
[HttpGet("paddy")]
[ProducesResponseType(typeof(PaddyReportResponse), 200)]
[ProducesResponseType(404)]
public async Task<ActionResult<PaddyReportResponse>> GetPaddyReport(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? status,
    [FromQuery] string? dealer,
    [FromQuery] string format = "json")
{
    // Implementation
}
```

## Error Handling

```csharp
try
{
    var result = await _context.PaddyEntries.ToListAsync();
    return Ok(result);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error generating paddy report");
    return StatusCode(500, new { message = "An error occurred while generating the report" });
}
```

## Conclusion

This implementation provides a comprehensive reporting system that:
- Aggregates data from multiple sources
- Supports flexible filtering and searching
- Generates both JSON and PDF outputs
- Maintains good performance through proper indexing and caching
- Follows security best practices
- Is maintainable and testable

The frontend already has the UI components ready to consume these endpoints and display the data in a user-friendly format.
