using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Portal;

public class LoginPortalUserRequest
{
    [Required]
    public string Phone { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}