using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Portal;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = null!;
}