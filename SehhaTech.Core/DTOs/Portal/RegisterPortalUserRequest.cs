using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Portal;

public class RegisterPortalUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    [Required]
    [RegularExpression(@"^(01[0125][0-9]{8})$", ErrorMessage = "Invalid Egyptian phone number")]
    public string Phone { get; set; } = null!;

    [EmailAddress]
    public string? Email { get; set; }

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = null!;
}