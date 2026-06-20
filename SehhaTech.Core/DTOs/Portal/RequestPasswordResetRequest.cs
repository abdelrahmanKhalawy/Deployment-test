// RequestPasswordResetRequest.cs
using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Portal;

public class RequestPasswordResetRequest
{
    [Required]
    public string Phone { get; set; } = null!;
}