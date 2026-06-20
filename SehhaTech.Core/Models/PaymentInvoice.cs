namespace SehhaTech.Core.Models;

public enum PaymentStatus
{
    Unpaid = 0,
    Partial = 1,
    Paid = 2
}

public enum PaymentMethod
{
    None = 0,
    Cash = 1,
    Card = 2,
    Online = 3
}

public class PaymentInvoice
{
    public int Id { get; set; }

    public int TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string InvoiceNumber { get; set; } = string.Empty;

    public string ServiceName { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal RemainingAmount { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.None;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? PaidAt { get; set; }
}