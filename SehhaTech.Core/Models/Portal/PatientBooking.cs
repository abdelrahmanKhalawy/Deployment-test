namespace SehhaTech.Core.Models.Portal;

public class PatientBooking
{
    public int Id { get; set; }
    public Guid IdempotencyKey { get; set; }
    public int PortalUserId { get; set; }
    public int TenantId { get; set; }
    public int DoctorId { get; set; }
    public DateTime SlotDate { get; set; }
    public TimeSpan SlotTime { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public int? LinkedAppointmentId { get; set; }
    public int? LinkedPatientId { get; set; }

    public PortalUser PortalUser { get; set; } = null!;
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
    NoShow
}