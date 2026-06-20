using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Portal;

public class ResetPasswordRequest
{
    [Required]
    public string Phone { get; set; } = null!;

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = null!;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = null!;
}