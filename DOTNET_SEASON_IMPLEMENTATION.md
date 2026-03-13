# .NET Backend Implementation Guide - Season Management

## Overview
This document provides implementation details for adding Season Management functionality to the .NET backend API.

## Database Schema

### 1. Create Seasons Table

```sql
CREATE TABLE seasons (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    year INT NOT NULL,
    season_number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Season_Year_Number UNIQUE (year, season_number),
    CONSTRAINT CHK_Season_Dates CHECK (end_date > start_date),
    CONSTRAINT CHK_Season_Number CHECK (season_number BETWEEN 1 AND 4)
);

CREATE INDEX IX_Seasons_Active ON seasons(is_active) WHERE is_active = 1;
CREATE INDEX IX_Seasons_Year ON seasons(year);
```

### 2. Add Season Foreign Keys to Existing Tables

```sql
-- Add season_id to loadings table
ALTER TABLE loadings
ADD season_id UNIQUEIDENTIFIER NULL,
CONSTRAINT FK_Loadings_Season FOREIGN KEY (season_id) REFERENCES seasons(id);

CREATE INDEX IX_Loadings_Season ON loadings(season_id);

-- Add season_id to paddy table
ALTER TABLE paddy
ADD season_id UNIQUEIDENTIFIER NULL,
CONSTRAINT FK_Paddy_Season FOREIGN KEY (season_id) REFERENCES seasons(id);

CREATE INDEX IX_Paddy_Season ON paddy(season_id);
```

### 3. Create Trigger for Single Active Season

```sql
CREATE TRIGGER TR_Seasons_SingleActive
ON seasons
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- If a season is being set to active, deactivate all others
    IF EXISTS (SELECT 1 FROM inserted WHERE is_active = 1)
    BEGIN
        UPDATE seasons
        SET is_active = 0
        WHERE id NOT IN (SELECT id FROM inserted WHERE is_active = 1)
        AND is_active = 1;
    END
END;
```

## C# Models

### Season.cs

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagement.Models
{
    [Table("seasons")]
    public class Season
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("name")]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [Column("year")]
        public int Year { get; set; }

        [Required]
        [Column("season_number")]
        [Range(1, 4)]
        public int SeasonNumber { get; set; }

        [Required]
        [Column("start_date")]
        [DataType(DataType.Date)]
        public DateTime StartDate { get; set; }

        [Required]
        [Column("end_date")]
        [DataType(DataType.Date)]
        public DateTime EndDate { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
```

### DTOs

```csharp
using System;
using System.ComponentModel.DataAnnotations;

namespace PaddyManagement.DTOs
{
    public class CreateSeasonDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [Range(2000, 2100)]
        public int Year { get; set; }

        [Required]
        [Range(1, 4)]
        public int SeasonNumber { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = false;
    }

    public class UpdateSeasonDto
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [Range(2000, 2100)]
        public int? Year { get; set; }

        [Range(1, 4)]
        public int? SeasonNumber { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public bool? IsActive { get; set; }
    }

    public class SeasonResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Year { get; set; }
        public int SeasonNumber { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
```

## Repository Interface and Implementation

### ISeasonRepository.cs

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PaddyManagement.Models;

namespace PaddyManagement.Repositories
{
    public interface ISeasonRepository
    {
        Task<IEnumerable<Season>> GetAllAsync();
        Task<Season> GetByIdAsync(Guid id);
        Task<Season> GetActiveSeasonAsync();
        Task<IEnumerable<Season>> GetByYearAsync(int year);
        Task<Season> CreateAsync(Season season);
        Task<Season> UpdateAsync(Season season);
        Task<bool> DeleteAsync(Guid id);
        Task<Season> SetActiveAsync(Guid id);
        Task<bool> ExistsAsync(int year, int seasonNumber);
    }
}
```

### SeasonRepository.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaddyManagement.Data;
using PaddyManagement.Models;

namespace PaddyManagement.Repositories
{
    public class SeasonRepository : ISeasonRepository
    {
        private readonly ApplicationDbContext _context;

        public SeasonRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Season>> GetAllAsync()
        {
            return await _context.Seasons
                .OrderByDescending(s => s.Year)
                .ThenByDescending(s => s.SeasonNumber)
                .ToListAsync();
        }

        public async Task<Season> GetByIdAsync(Guid id)
        {
            return await _context.Seasons.FindAsync(id);
        }

        public async Task<Season> GetActiveSeasonAsync()
        {
            return await _context.Seasons
                .FirstOrDefaultAsync(s => s.IsActive);
        }

        public async Task<IEnumerable<Season>> GetByYearAsync(int year)
        {
            return await _context.Seasons
                .Where(s => s.Year == year)
                .OrderBy(s => s.SeasonNumber)
                .ToListAsync();
        }

        public async Task<Season> CreateAsync(Season season)
        {
            season.CreatedAt = DateTime.UtcNow;
            season.UpdatedAt = DateTime.UtcNow;

            // If this season is being set as active, deactivate others
            if (season.IsActive)
            {
                await DeactivateAllSeasonsAsync();
            }

            _context.Seasons.Add(season);
            await _context.SaveChangesAsync();
            return season;
        }

        public async Task<Season> UpdateAsync(Season season)
        {
            season.UpdatedAt = DateTime.UtcNow;

            // If this season is being set as active, deactivate others
            if (season.IsActive)
            {
                await DeactivateAllSeasonsAsync(season.Id);
            }

            _context.Seasons.Update(season);
            await _context.SaveChangesAsync();
            return season;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var season = await _context.Seasons.FindAsync(id);
            if (season == null) return false;

            // Check if season is used in loadings or paddy
            var hasLoadings = await _context.Loadings.AnyAsync(l => l.SeasonId == id);
            var hasPaddy = await _context.Paddy.AnyAsync(p => p.SeasonId == id);

            if (hasLoadings || hasPaddy)
            {
                throw new InvalidOperationException(
                    "Cannot delete season that has associated loadings or paddy records."
                );
            }

            _context.Seasons.Remove(season);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Season> SetActiveAsync(Guid id)
        {
            var season = await _context.Seasons.FindAsync(id);
            if (season == null) return null;

            await DeactivateAllSeasonsAsync(id);
            season.IsActive = true;
            season.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return season;
        }

        public async Task<bool> ExistsAsync(int year, int seasonNumber)
        {
            return await _context.Seasons
                .AnyAsync(s => s.Year == year && s.SeasonNumber == seasonNumber);
        }

        private async Task DeactivateAllSeasonsAsync(Guid? exceptId = null)
        {
            var seasonsToDeactivate = _context.Seasons.Where(s => s.IsActive);

            if (exceptId.HasValue)
            {
                seasonsToDeactivate = seasonsToDeactivate.Where(s => s.Id != exceptId.Value);
            }

            await seasonsToDeactivate.ForEachAsync(s => s.IsActive = false);
        }
    }
}
```

## Service Layer

### ISeasonService.cs

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PaddyManagement.DTOs;

namespace PaddyManagement.Services
{
    public interface ISeasonService
    {
        Task<IEnumerable<SeasonResponseDto>> GetAllSeasonsAsync();
        Task<SeasonResponseDto> GetSeasonByIdAsync(Guid id);
        Task<SeasonResponseDto> GetActiveSeasonAsync();
        Task<IEnumerable<SeasonResponseDto>> GetSeasonsByYearAsync(int year);
        Task<SeasonResponseDto> CreateSeasonAsync(CreateSeasonDto dto);
        Task<SeasonResponseDto> UpdateSeasonAsync(Guid id, UpdateSeasonDto dto);
        Task<bool> DeleteSeasonAsync(Guid id);
        Task<SeasonResponseDto> SetActiveSeasonAsync(Guid id);
    }
}
```

### SeasonService.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PaddyManagement.DTOs;
using PaddyManagement.Models;
using PaddyManagement.Repositories;

namespace PaddyManagement.Services
{
    public class SeasonService : ISeasonService
    {
        private readonly ISeasonRepository _repository;

        public SeasonService(ISeasonRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<SeasonResponseDto>> GetAllSeasonsAsync()
        {
            var seasons = await _repository.GetAllAsync();
            return seasons.Select(MapToDto);
        }

        public async Task<SeasonResponseDto> GetSeasonByIdAsync(Guid id)
        {
            var season = await _repository.GetByIdAsync(id);
            return season != null ? MapToDto(season) : null;
        }

        public async Task<SeasonResponseDto> GetActiveSeasonAsync()
        {
            var season = await _repository.GetActiveSeasonAsync();
            return season != null ? MapToDto(season) : null;
        }

        public async Task<IEnumerable<SeasonResponseDto>> GetSeasonsByYearAsync(int year)
        {
            var seasons = await _repository.GetByYearAsync(year);
            return seasons.Select(MapToDto);
        }

        public async Task<SeasonResponseDto> CreateSeasonAsync(CreateSeasonDto dto)
        {
            ValidateSeasonDates(dto.StartDate, dto.EndDate);

            // Check for duplicate
            if (await _repository.ExistsAsync(dto.Year, dto.SeasonNumber))
            {
                throw new InvalidOperationException(
                    $"Season {dto.SeasonNumber} for year {dto.Year} already exists."
                );
            }

            var season = new Season
            {
                Name = dto.Name,
                Year = dto.Year,
                SeasonNumber = dto.SeasonNumber,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = dto.IsActive
            };

            var created = await _repository.CreateAsync(season);
            return MapToDto(created);
        }

        public async Task<SeasonResponseDto> UpdateSeasonAsync(Guid id, UpdateSeasonDto dto)
        {
            var season = await _repository.GetByIdAsync(id);
            if (season == null)
            {
                throw new KeyNotFoundException($"Season with ID {id} not found.");
            }

            if (dto.Name != null) season.Name = dto.Name;
            if (dto.Year.HasValue) season.Year = dto.Year.Value;
            if (dto.SeasonNumber.HasValue) season.SeasonNumber = dto.SeasonNumber.Value;
            if (dto.StartDate.HasValue) season.StartDate = dto.StartDate.Value;
            if (dto.EndDate.HasValue) season.EndDate = dto.EndDate.Value;
            if (dto.IsActive.HasValue) season.IsActive = dto.IsActive.Value;

            ValidateSeasonDates(season.StartDate, season.EndDate);

            var updated = await _repository.UpdateAsync(season);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteSeasonAsync(Guid id)
        {
            return await _repository.DeleteAsync(id);
        }

        public async Task<SeasonResponseDto> SetActiveSeasonAsync(Guid id)
        {
            var season = await _repository.SetActiveAsync(id);
            if (season == null)
            {
                throw new KeyNotFoundException($"Season with ID {id} not found.");
            }
            return MapToDto(season);
        }

        private void ValidateSeasonDates(DateTime startDate, DateTime endDate)
        {
            if (endDate <= startDate)
            {
                throw new ArgumentException("End date must be after start date.");
            }
        }

        private SeasonResponseDto MapToDto(Season season)
        {
            return new SeasonResponseDto
            {
                Id = season.Id,
                Name = season.Name,
                Year = season.Year,
                SeasonNumber = season.SeasonNumber,
                StartDate = season.StartDate,
                EndDate = season.EndDate,
                IsActive = season.IsActive,
                CreatedAt = season.CreatedAt,
                UpdatedAt = season.UpdatedAt
            };
        }
    }
}
```

## API Controller

### SeasonsController.cs

```csharp
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaddyManagement.DTOs;
using PaddyManagement.Services;

namespace PaddyManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SeasonsController : ControllerBase
    {
        private readonly ISeasonService _seasonService;
        private readonly ILogger<SeasonsController> _logger;

        public SeasonsController(
            ISeasonService seasonService,
            ILogger<SeasonsController> logger)
        {
            _seasonService = seasonService;
            _logger = logger;
        }

        /// <summary>
        /// Get all seasons
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllSeasons()
        {
            try
            {
                var seasons = await _seasonService.GetAllSeasonsAsync();
                return Ok(seasons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all seasons");
                return StatusCode(500, "An error occurred while retrieving seasons");
            }
        }

        /// <summary>
        /// Get active season
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSeason()
        {
            try
            {
                var season = await _seasonService.GetActiveSeasonAsync();
                if (season == null)
                {
                    return NotFound("No active season found");
                }
                return Ok(season);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active season");
                return StatusCode(500, "An error occurred while retrieving the active season");
            }
        }

        /// <summary>
        /// Get season by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSeasonById(Guid id)
        {
            try
            {
                var season = await _seasonService.GetSeasonByIdAsync(id);
                if (season == null)
                {
                    return NotFound($"Season with ID {id} not found");
                }
                return Ok(season);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving season {SeasonId}", id);
                return StatusCode(500, "An error occurred while retrieving the season");
            }
        }

        /// <summary>
        /// Get seasons by year
        /// </summary>
        [HttpGet("year/{year}")]
        public async Task<IActionResult> GetSeasonsByYear(int year)
        {
            try
            {
                var seasons = await _seasonService.GetSeasonsByYearAsync(year);
                return Ok(seasons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving seasons for year {Year}", year);
                return StatusCode(500, "An error occurred while retrieving seasons");
            }
        }

        /// <summary>
        /// Create new season
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateSeason([FromBody] CreateSeasonDto dto)
        {
            try
            {
                var season = await _seasonService.CreateSeasonAsync(dto);
                return CreatedAtAction(nameof(GetSeasonById), new { id = season.Id }, season);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating season");
                return StatusCode(500, "An error occurred while creating the season");
            }
        }

        /// <summary>
        /// Update season
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSeason(Guid id, [FromBody] UpdateSeasonDto dto)
        {
            try
            {
                var season = await _seasonService.UpdateSeasonAsync(id, dto);
                return Ok(season);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating season {SeasonId}", id);
                return StatusCode(500, "An error occurred while updating the season");
            }
        }

        /// <summary>
        /// Set season as active
        /// </summary>
        [HttpPut("{id}/activate")]
        public async Task<IActionResult> SetActiveSeason(Guid id)
        {
            try
            {
                var season = await _seasonService.SetActiveSeasonAsync(id);
                return Ok(season);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating season {SeasonId}", id);
                return StatusCode(500, "An error occurred while activating the season");
            }
        }

        /// <summary>
        /// Delete season
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeason(Guid id)
        {
            try
            {
                var result = await _seasonService.DeleteSeasonAsync(id);
                if (!result)
                {
                    return NotFound($"Season with ID {id} not found");
                }
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting season {SeasonId}", id);
                return StatusCode(500, "An error occurred while deleting the season");
            }
        }
    }
}
```

## Dependency Injection Setup

### Program.cs or Startup.cs

```csharp
// Add to ConfigureServices or builder.Services
services.AddScoped<ISeasonRepository, SeasonRepository>();
services.AddScoped<ISeasonService, SeasonService>();
```

## DbContext Configuration

### ApplicationDbContext.cs

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<Season> Seasons { get; set; }
    public DbSet<Loading> Loadings { get; set; }
    public DbSet<Paddy> Paddy { get; set; }
    // ... other DbSets

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Season configuration
        modelBuilder.Entity<Season>(entity =>
        {
            entity.HasIndex(e => new { e.Year, e.SeasonNumber })
                  .IsUnique();

            entity.HasIndex(e => e.IsActive)
                  .HasFilter("[is_active] = 1");
        });

        // Loading configuration
        modelBuilder.Entity<Loading>(entity =>
        {
            entity.HasOne<Season>()
                  .WithMany()
                  .HasForeignKey(e => e.SeasonId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Paddy configuration
        modelBuilder.Entity<Paddy>(entity =>
        {
            entity.HasOne<Season>()
                  .WithMany()
                  .HasForeignKey(e => e.SeasonId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
```

## Update Existing Models

### Loading.cs

```csharp
[Column("season_id")]
public Guid? SeasonId { get; set; }

[ForeignKey("SeasonId")]
public virtual Season Season { get; set; }
```

### Paddy.cs

```csharp
[Column("season_id")]
public Guid? SeasonId { get; set; }

[ForeignKey("SeasonId")]
public virtual Season Season { get; set; }
```

## Testing Endpoints

### Example API Requests

```bash
# Get all seasons
GET /api/seasons

# Get active season
GET /api/seasons/active

# Get season by ID
GET /api/seasons/{id}

# Get seasons by year
GET /api/seasons/year/2024

# Create season
POST /api/seasons
{
  "name": "Yala 2024",
  "year": 2024,
  "seasonNumber": 1,
  "startDate": "2024-04-01",
  "endDate": "2024-09-30",
  "isActive": true
}

# Update season
PUT /api/seasons/{id}
{
  "name": "Updated Season Name",
  "isActive": false
}

# Activate season
PUT /api/seasons/{id}/activate

# Delete season
DELETE /api/seasons/{id}
```

## Business Rules

1. **Single Active Season**: Only one season can be active at a time. When a season is set to active, all others are automatically deactivated.

2. **Unique Season**: Each combination of year and season number must be unique.

3. **Date Validation**: End date must be after start date.

4. **Season Numbers**: Valid range is 1-4 (representing different cultivation seasons in a year).

5. **Delete Restriction**: Cannot delete a season that has associated loading or paddy records.

6. **Automatic Timestamps**: Created and updated timestamps are managed automatically.

## Migration Command

```bash
# Create migration
dotnet ef migrations add AddSeasonManagement

# Update database
dotnet ef database update
```

## Notes

- All endpoints require authentication via JWT Bearer token
- Foreign key relationships use `Restrict` delete behavior to prevent accidental data loss
- Proper error handling and logging implemented throughout
- DTOs used for request/response to separate concerns from domain models
- Repository pattern for data access abstraction
- Service layer for business logic
