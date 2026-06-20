using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Reception;

public class CreatePaymentInvoiceRequest
{
    [Required]
    public int PatientId { get; set; }

    public int? AppointmentId { get; set; }

    [Required]
    [StringLength(150)]
    public string ServiceName { get; set; } = string.Empty;

    [Required]
    [Range(1, 1000000)]
    public decimal TotalAmount { get; set; }

    [Range(0, 1000000)]
    public decimal PaidAmount { get; set; } = 0;

    [StringLength(500)]
    public string? Notes { get; set; }
}