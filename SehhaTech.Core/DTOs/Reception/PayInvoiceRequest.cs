using System.ComponentModel.DataAnnotations;
using SehhaTech.Core.Models;

namespace SehhaTech.Core.DTOs.Reception;

public class PayInvoiceRequest
{
    [Required]
    [Range(1, 1000000)]
    public decimal Amount { get; set; }

    [Required]
    public PaymentMethod Method { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}