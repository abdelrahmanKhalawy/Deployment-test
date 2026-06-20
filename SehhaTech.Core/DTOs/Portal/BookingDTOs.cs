namespace SehhaTech.Core.DTOs.Portal;

public class CreateBookingRequest
{
    public int DoctorId { get; set; }
    public int TenantId { get; set; }
    public DateTime SlotDate { get; set; }
    public TimeSpan SlotTime { get; set; }
    public string? Notes { get; set; }
    public Guid IdempotencyKey { get; set; }
}

public class BookingResponse
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int TenantId { get; set; }
    public string ClinicName { get; set; } = string.Empty;
    public DateTime SlotDate { get; set; }
    public TimeSpan SlotTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CancelBookingRequest
{
    public string? CancellationReason { get; set; }
}