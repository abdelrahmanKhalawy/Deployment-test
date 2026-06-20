using System.ComponentModel.DataAnnotations;
using SehhaTech.Core.Models.Portal;

namespace SehhaTech.Core.DTOs.Portal;

public class ResendOtpRequest
{
    [Required]
    public string Phone { get; set; } = null!;

    [Required]
    public OTPPurpose Purpose { get; set; }
}