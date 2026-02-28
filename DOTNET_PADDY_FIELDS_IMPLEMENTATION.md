# .NET Backend Implementation - Paddy Fields Feature

## Overview
This document provides a complete implementation guide for the Paddy Fields feature in .NET, including database schema, models, repositories, services, and API endpoints.

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

### Paddy Fields Table

The table already exists in your Supabase database. Here's the schema:

```sql
CREATE TABLE IF NOT EXISTS paddy_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  location TEXT NOT NULL,
  area NUMERIC NOT NULL CHECK (area > 0),
  unit TEXT NOT NULL CHECK (unit IN ('acres', 'hectares', 'guntas')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE paddy_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read paddy fields"
  ON paddy_fields FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert paddy fields"
  ON paddy_fields FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update paddy fields"
  ON paddy_fields FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete paddy fields"
  ON paddy_fields FOR DELETE
  TO authenticated
  USING (true);
```

---

## Model Implementation

### PaddyField.cs

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaddyManagementAPI.Models
{
    /// <summary>
    /// Represents a paddy field in the system
    /// </summary>
    [Table("paddy_fields")]
    public class PaddyField
    {
        /// <summary>
        /// Unique identifier for the paddy field
        /// </summary>
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Name of the paddy field
        /// </summary>
        [Required(ErrorMessage = "Field name is required")]
        [StringLength(200, ErrorMessage = "Field name cannot exceed 200 characters")]
        [Column("field_name")]
        public string FieldName { get; set; } = string.Empty;

        /// <summary>
        /// Location of the paddy field
        /// </summary>
        [Required(ErrorMessage = "Location is required")]
        [StringLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
        [Column("location")]
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Area of the paddy field
        /// </summary>
        [Required(ErrorMessage = "Area is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Area must be greater than 0")]
        [Column("area")]
        public decimal Area { get; set; }

        /// <summary>
        /// Unit of measurement (acres, hectares, guntas)
        /// </summary>
        [Required(ErrorMessage = "Unit is required")]
        [Column("unit")]
        public string Unit { get; set; } = "acres";

        /// <summary>
        /// Status of the paddy field (active, inactive)
        /// </summary>
        [Required(ErrorMessage = "Status is required")]
        [Column("status")]
        public string Status { get; set; } = "active";

        /// <summary>
        /// Timestamp when the field was created
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when the field was last updated
        /// </summary>
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Validates if the unit is one of the allowed values
        /// </summary>
        public bool IsValidUnit()
        {
            var allowedUnits = new[] { "acres", "hectares", "guntas" };
            return allowedUnits.Contains(Unit.ToLower());
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

---

## DTOs (Data Transfer Objects)

### PaddyFieldDto.cs

```csharp
namespace PaddyManagementAPI.DTOs.PaddyField
{
    /// <summary>
    /// DTO for returning paddy field data
    /// </summary>
    public class PaddyFieldDto
    {
        public string Id { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
```

### CreatePaddyFieldDto.cs

```csharp
using System.ComponentModel.DataAnnotations;

namespace PaddyManagementAPI.DTOs.PaddyField
{
    /// <summary>
    /// DTO for creating a new paddy field
    /// </summary>
    public class CreatePaddyFieldDto
    {
        [Required(ErrorMessage = "Field name is required")]
        [StringLength(200, ErrorMessage = "Field name cannot exceed 200 characters")]
        public string FieldName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Location is required")]
        [StringLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
        public string Location { get; set; } = string.Empty;

        [Required(ErrorMessage = "Area is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Area must be greater than 0")]
        public decimal Area { get; set; }

        [Required(ErrorMessage = "Unit is required")]
        [RegularExpression("^(acres|hectares|guntas)$", ErrorMessage = "Unit must be 'acres', 'hectares', or 'guntas'")]
        public string Unit { get; set; } = "acres";

        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(active|inactive)$", ErrorMessage = "Status must be 'active' or 'inactive'")]
        public string Status { get; set; } = "active";
    }
}
```

### UpdatePaddyFieldDto.cs

```csharp
using System.ComponentModel.DataAnnotations;

namespace PaddyManagementAPI.DTOs.PaddyField
{
    /// <summary>
    /// DTO for updating an existing paddy field
    /// </summary>
    public class UpdatePaddyFieldDto
    {
        [Required(ErrorMessage = "Field name is required")]
        [StringLength(200, ErrorMessage = "Field name cannot exceed 200 characters")]
        public string FieldName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Location is required")]
        [StringLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
        public string Location { get; set; } = string.Empty;

        [Required(ErrorMessage = "Area is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Area must be greater than 0")]
        public decimal Area { get; set; }

        [Required(ErrorMessage = "Unit is required")]
        [RegularExpression("^(acres|hectares|guntas)$", ErrorMessage = "Unit must be 'acres', 'hectares', or 'guntas'")]
        public string Unit { get; set; } = string.Empty;

        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(active|inactive)$", ErrorMessage = "Status must be 'active' or 'inactive'")]
        public string Status { get; set; } = string.Empty;
    }
}
```

---

## Repository Layer

### IPaddyFieldRepository.cs

```csharp
using PaddyManagementAPI.Models;

namespace PaddyManagementAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interface for paddy field repository operations
    /// </summary>
    public interface IPaddyFieldRepository
    {
        /// <summary>
        /// Gets a paddy field by ID
        /// </summary>
        Task<PaddyField?> GetByIdAsync(Guid id);

        /// <summary>
        /// Gets all paddy fields
        /// </summary>
        Task<IEnumerable<PaddyField>> GetAllAsync();

        /// <summary>
        /// Creates a new paddy field
        /// </summary>
        Task<PaddyField> CreateAsync(PaddyField field);

        /// <summary>
        /// Updates an existing paddy field
        /// </summary>
        Task<PaddyField> UpdateAsync(PaddyField field);

        /// <summary>
        /// Deletes a paddy field by ID
        /// </summary>
        Task<bool> DeleteAsync(Guid id);

        /// <summary>
        /// Gets paddy fields by status (active/inactive)
        /// </summary>
        Task<IEnumerable<PaddyField>> GetByStatusAsync(string status);

        /// <summary>
        /// Gets paddy fields by unit (acres/hectares/guntas)
        /// </summary>
        Task<IEnumerable<PaddyField>> GetByUnitAsync(string unit);

        /// <summary>
        /// Searches paddy fields by name or location
        /// </summary>
        Task<IEnumerable<PaddyField>> SearchAsync(string searchTerm);

        /// <summary>
        /// Checks if a paddy field with the same name exists
        /// </summary>
        Task<bool> ExistsByNameAsync(string fieldName, Guid? excludeId = null);
    }
}
```

### PaddyFieldRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using PaddyManagementAPI.Data;
using PaddyManagementAPI.Models;
using PaddyManagementAPI.Repositories.Interfaces;

namespace PaddyManagementAPI.Repositories.Implementations
{
    /// <summary>
    /// Repository implementation for paddy field operations
    /// </summary>
    public class PaddyFieldRepository : IPaddyFieldRepository
    {
        private readonly ApplicationDbContext _context;

        public PaddyFieldRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaddyField?> GetByIdAsync(Guid id)
        {
            return await _context.PaddyFields.FindAsync(id);
        }

        public async Task<IEnumerable<PaddyField>> GetAllAsync()
        {
            return await _context.PaddyFields
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<PaddyField> CreateAsync(PaddyField field)
        {
            field.CreatedAt = DateTime.UtcNow;
            field.UpdatedAt = DateTime.UtcNow;

            _context.PaddyFields.Add(field);
            await _context.SaveChangesAsync();

            return field;
        }

        public async Task<PaddyField> UpdateAsync(PaddyField field)
        {
            field.UpdatedAt = DateTime.UtcNow;

            _context.PaddyFields.Update(field);
            await _context.SaveChangesAsync();

            return field;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var field = await GetByIdAsync(id);
            if (field == null)
                return false;

            _context.PaddyFields.Remove(field);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<PaddyField>> GetByStatusAsync(string status)
        {
            return await _context.PaddyFields
                .Where(f => f.Status.ToLower() == status.ToLower())
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PaddyField>> GetByUnitAsync(string unit)
        {
            return await _context.PaddyFields
                .Where(f => f.Unit.ToLower() == unit.ToLower())
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PaddyField>> SearchAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetAllAsync();

            var lowerSearchTerm = searchTerm.ToLower();

            return await _context.PaddyFields
                .Where(f => f.FieldName.ToLower().Contains(lowerSearchTerm) ||
                           f.Location.ToLower().Contains(lowerSearchTerm))
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ExistsByNameAsync(string fieldName, Guid? excludeId = null)
        {
            var query = _context.PaddyFields
                .Where(f => f.FieldName.ToLower() == fieldName.ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(f => f.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }
    }
}
```

---

## Service Layer

### IPaddyFieldService.cs

```csharp
using PaddyManagementAPI.DTOs.PaddyField;

namespace PaddyManagementAPI.Services.Interfaces
{
    /// <summary>
    /// Interface for paddy field business logic
    /// </summary>
    public interface IPaddyFieldService
    {
        Task<PaddyFieldDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<PaddyFieldDto>> GetAllAsync();
        Task<PaddyFieldDto> CreateAsync(CreatePaddyFieldDto dto);
        Task<PaddyFieldDto> UpdateAsync(Guid id, UpdatePaddyFieldDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<PaddyFieldDto>> GetByStatusAsync(string status);
        Task<IEnumerable<PaddyFieldDto>> SearchAsync(string searchTerm);
    }
}
```

### PaddyFieldService.cs

```csharp
using PaddyManagementAPI.DTOs.PaddyField;
using PaddyManagementAPI.Models;
using PaddyManagementAPI.Repositories.Interfaces;
using PaddyManagementAPI.Services.Interfaces;

namespace PaddyManagementAPI.Services.Implementations
{
    /// <summary>
    /// Service implementation for paddy field business logic
    /// </summary>
    public class PaddyFieldService : IPaddyFieldService
    {
        private readonly IPaddyFieldRepository _repository;

        public PaddyFieldService(IPaddyFieldRepository repository)
        {
            _repository = repository;
        }

        public async Task<PaddyFieldDto?> GetByIdAsync(Guid id)
        {
            var field = await _repository.GetByIdAsync(id);
            return field == null ? null : MapToDto(field);
        }

        public async Task<IEnumerable<PaddyFieldDto>> GetAllAsync()
        {
            var fields = await _repository.GetAllAsync();
            return fields.Select(MapToDto);
        }

        public async Task<PaddyFieldDto> CreateAsync(CreatePaddyFieldDto dto)
        {
            // Check for duplicate field name
            if (await _repository.ExistsByNameAsync(dto.FieldName))
            {
                throw new InvalidOperationException($"A field with the name '{dto.FieldName}' already exists");
            }

            var field = new PaddyField
            {
                FieldName = dto.FieldName,
                Location = dto.Location,
                Area = dto.Area,
                Unit = dto.Unit.ToLower(),
                Status = dto.Status.ToLower()
            };

            // Validate unit and status
            if (!field.IsValidUnit())
            {
                throw new ArgumentException("Invalid unit. Must be 'acres', 'hectares', or 'guntas'");
            }

            if (!field.IsValidStatus())
            {
                throw new ArgumentException("Invalid status. Must be 'active' or 'inactive'");
            }

            var created = await _repository.CreateAsync(field);
            return MapToDto(created);
        }

        public async Task<PaddyFieldDto> UpdateAsync(Guid id, UpdatePaddyFieldDto dto)
        {
            var field = await _repository.GetByIdAsync(id);
            if (field == null)
            {
                throw new KeyNotFoundException($"Paddy field with ID {id} not found");
            }

            // Check for duplicate field name (excluding current field)
            if (await _repository.ExistsByNameAsync(dto.FieldName, id))
            {
                throw new InvalidOperationException($"A field with the name '{dto.FieldName}' already exists");
            }

            field.FieldName = dto.FieldName;
            field.Location = dto.Location;
            field.Area = dto.Area;
            field.Unit = dto.Unit.ToLower();
            field.Status = dto.Status.ToLower();

            // Validate unit and status
            if (!field.IsValidUnit())
            {
                throw new ArgumentException("Invalid unit. Must be 'acres', 'hectares', or 'guntas'");
            }

            if (!field.IsValidStatus())
            {
                throw new ArgumentException("Invalid status. Must be 'active' or 'inactive'");
            }

            var updated = await _repository.UpdateAsync(field);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var exists = await _repository.GetByIdAsync(id);
            if (exists == null)
            {
                throw new KeyNotFoundException($"Paddy field with ID {id} not found");
            }

            return await _repository.DeleteAsync(id);
        }

        public async Task<IEnumerable<PaddyFieldDto>> GetByStatusAsync(string status)
        {
            var fields = await _repository.GetByStatusAsync(status);
            return fields.Select(MapToDto);
        }

        public async Task<IEnumerable<PaddyFieldDto>> SearchAsync(string searchTerm)
        {
            var fields = await _repository.SearchAsync(searchTerm);
            return fields.Select(MapToDto);
        }

        private static PaddyFieldDto MapToDto(PaddyField field)
        {
            return new PaddyFieldDto
            {
                Id = field.Id.ToString(),
                FieldName = field.FieldName,
                Location = field.Location,
                Area = field.Area,
                Unit = field.Unit,
                Status = field.Status,
                CreatedAt = field.CreatedAt,
                UpdatedAt = field.UpdatedAt
            };
        }
    }
}
```

---

## Controller

### PaddyFieldsController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaddyManagementAPI.DTOs.PaddyField;
using PaddyManagementAPI.Services.Interfaces;

namespace PaddyManagementAPI.Controllers
{
    /// <summary>
    /// API controller for managing paddy fields
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaddyFieldsController : ControllerBase
    {
        private readonly IPaddyFieldService _service;
        private readonly ILogger<PaddyFieldsController> _logger;

        public PaddyFieldsController(
            IPaddyFieldService service,
            ILogger<PaddyFieldsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all paddy fields
        /// </summary>
        /// <returns>List of all paddy fields</returns>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PaddyFieldDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PaddyFieldDto>>> GetAll()
        {
            try
            {
                var fields = await _service.GetAllAsync();
                return Ok(fields);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all paddy fields");
                return StatusCode(500, new { message = "An error occurred while retrieving paddy fields" });
            }
        }

        /// <summary>
        /// Get a specific paddy field by ID
        /// </summary>
        /// <param name="id">The paddy field ID</param>
        /// <returns>The paddy field if found</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PaddyFieldDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PaddyFieldDto>> GetById(Guid id)
        {
            try
            {
                var field = await _service.GetByIdAsync(id);
                if (field == null)
                {
                    return NotFound(new { message = $"Paddy field with ID {id} not found" });
                }

                return Ok(field);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving paddy field {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the paddy field" });
            }
        }

        /// <summary>
        /// Create a new paddy field
        /// </summary>
        /// <param name="dto">The paddy field data</param>
        /// <returns>The created paddy field</returns>
        [HttpPost]
        [ProducesResponseType(typeof(PaddyFieldDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PaddyFieldDto>> Create([FromBody] CreatePaddyFieldDto dto)
        {
            try
            {
                var created = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
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
                _logger.LogError(ex, "Error creating paddy field");
                return StatusCode(500, new { message = "An error occurred while creating the paddy field" });
            }
        }

        /// <summary>
        /// Update an existing paddy field
        /// </summary>
        /// <param name="id">The paddy field ID</param>
        /// <param name="dto">The updated paddy field data</param>
        /// <returns>The updated paddy field</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(PaddyFieldDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PaddyFieldDto>> Update(Guid id, [FromBody] UpdatePaddyFieldDto dto)
        {
            try
            {
                var updated = await _service.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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
                _logger.LogError(ex, "Error updating paddy field {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the paddy field" });
            }
        }

        /// <summary>
        /// Delete a paddy field
        /// </summary>
        /// <param name="id">The paddy field ID</param>
        /// <returns>No content if successful</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                await _service.DeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting paddy field {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the paddy field" });
            }
        }

        /// <summary>
        /// Get paddy fields by status
        /// </summary>
        /// <param name="status">The status (active/inactive)</param>
        /// <returns>List of paddy fields with the specified status</returns>
        [HttpGet("status/{status}")]
        [ProducesResponseType(typeof(IEnumerable<PaddyFieldDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PaddyFieldDto>>> GetByStatus(string status)
        {
            try
            {
                var fields = await _service.GetByStatusAsync(status);
                return Ok(fields);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving paddy fields by status {Status}", status);
                return StatusCode(500, new { message = "An error occurred while retrieving paddy fields" });
            }
        }

        /// <summary>
        /// Search paddy fields by name or location
        /// </summary>
        /// <param name="q">The search term</param>
        /// <returns>List of matching paddy fields</returns>
        [HttpGet("search")]
        [ProducesResponseType(typeof(IEnumerable<PaddyFieldDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PaddyFieldDto>>> Search([FromQuery] string q)
        {
            try
            {
                var fields = await _service.SearchAsync(q);
                return Ok(fields);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching paddy fields with term {SearchTerm}", q);
                return StatusCode(500, new { message = "An error occurred while searching paddy fields" });
            }
        }
    }
}
```

---

## API Endpoints

### Base URL
```
https://your-api.azurewebsites.net/api/paddyfields
```

### Endpoints

#### 1. Get All Paddy Fields
```http
GET /api/paddyfields
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fieldName": "North Field",
    "location": "Village A, District B",
    "area": 5.5,
    "unit": "acres",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### 2. Get Paddy Field by ID
```http
GET /api/paddyfields/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fieldName": "North Field",
  "location": "Village A, District B",
  "area": 5.5,
  "unit": "acres",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 3. Create Paddy Field
```http
POST /api/paddyfields
Authorization: Bearer {token}
Content-Type: application/json

{
  "fieldName": "South Field",
  "location": "Village C, District D",
  "area": 3.2,
  "unit": "acres",
  "status": "active"
}
```

**Response:** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "fieldName": "South Field",
  "location": "Village C, District D",
  "area": 3.2,
  "unit": "acres",
  "status": "active",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### 4. Update Paddy Field
```http
PUT /api/paddyfields/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "fieldName": "South Field Updated",
  "location": "Village C, District D",
  "area": 3.5,
  "unit": "acres",
  "status": "active"
}
```

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "fieldName": "South Field Updated",
  "location": "Village C, District D",
  "area": 3.5,
  "unit": "acres",
  "status": "active",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

#### 5. Delete Paddy Field
```http
DELETE /api/paddyfields/{id}
Authorization: Bearer {token}
```

**Response:** `204 No Content`

#### 6. Get Paddy Fields by Status
```http
GET /api/paddyfields/status/active
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fieldName": "North Field",
    "location": "Village A, District B",
    "area": 5.5,
    "unit": "acres",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### 7. Search Paddy Fields
```http
GET /api/paddyfields/search?q=North
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fieldName": "North Field",
    "location": "Village A, District B",
    "area": 5.5,
    "unit": "acres",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Testing

### Unit Test Example (Using xUnit and Moq)

```csharp
using Moq;
using PaddyManagementAPI.DTOs.PaddyField;
using PaddyManagementAPI.Models;
using PaddyManagementAPI.Repositories.Interfaces;
using PaddyManagementAPI.Services.Implementations;
using Xunit;

namespace PaddyManagementAPI.Tests.Services
{
    public class PaddyFieldServiceTests
    {
        private readonly Mock<IPaddyFieldRepository> _repositoryMock;
        private readonly PaddyFieldService _service;

        public PaddyFieldServiceTests()
        {
            _repositoryMock = new Mock<IPaddyFieldRepository>();
            _service = new PaddyFieldService(_repositoryMock.Object);
        }

        [Fact]
        public async Task CreateAsync_ValidData_ReturnsCreatedField()
        {
            // Arrange
            var dto = new CreatePaddyFieldDto
            {
                FieldName = "Test Field",
                Location = "Test Location",
                Area = 5.5m,
                Unit = "acres",
                Status = "active"
            };

            _repositoryMock.Setup(r => r.ExistsByNameAsync(It.IsAny<string>(), null))
                .ReturnsAsync(false);

            _repositoryMock.Setup(r => r.CreateAsync(It.IsAny<PaddyField>()))
                .ReturnsAsync((PaddyField f) => f);

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(dto.FieldName, result.FieldName);
            Assert.Equal(dto.Location, result.Location);
            Assert.Equal(dto.Area, result.Area);
        }

        [Fact]
        public async Task CreateAsync_DuplicateName_ThrowsException()
        {
            // Arrange
            var dto = new CreatePaddyFieldDto
            {
                FieldName = "Duplicate Field",
                Location = "Test Location",
                Area = 5.5m,
                Unit = "acres",
                Status = "active"
            };

            _repositoryMock.Setup(r => r.ExistsByNameAsync(dto.FieldName, null))
                .ReturnsAsync(true);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateAsync(dto));
        }
    }
}
```

### Integration Test with Postman

**Collection: Paddy Fields API**

1. **Login First**
```json
POST {{baseUrl}}/api/auth/login
{
  "phoneNumber": "1234567890",
  "password": "password123"
}

// Save token to environment variable
pm.environment.set("authToken", pm.response.json().token);
```

2. **Create Paddy Field**
```json
POST {{baseUrl}}/api/paddyfields
Headers:
  Authorization: Bearer {{authToken}}

Body:
{
  "fieldName": "Test Field",
  "location": "Test Location",
  "area": 5.5,
  "unit": "acres",
  "status": "active"
}
```

3. **Get All Paddy Fields**
```json
GET {{baseUrl}}/api/paddyfields
Headers:
  Authorization: Bearer {{authToken}}
```

---

## Configuration

### Add to Program.cs

```csharp
// Register repository
builder.Services.AddScoped<IPaddyFieldRepository, PaddyFieldRepository>();

// Register service
builder.Services.AddScoped<IPaddyFieldService, PaddyFieldService>();
```

### Database Context Configuration

In `ApplicationDbContext.cs`:

```csharp
public DbSet<PaddyField> PaddyFields { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<PaddyField>(entity =>
    {
        entity.ToTable("paddy_fields");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Area).HasPrecision(10, 2);
        entity.Property(e => e.FieldName).HasMaxLength(200);
        entity.Property(e => e.Location).HasMaxLength(500);
    });
}
```

---

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description here"
}
```

HTTP Status Codes:
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

---

## Summary

This implementation provides:
1. Complete CRUD operations for paddy fields
2. Input validation and error handling
3. Search and filter capabilities
4. Proper separation of concerns (Repository, Service, Controller)
5. JWT authentication
6. RESTful API design
7. Comprehensive documentation
8. Unit test examples

All code follows .NET best practices and is production-ready.
