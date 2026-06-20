using SehhaTech.Core.Models;

namespace SehhaTech.Core.Models.Portal;

public class SlotTemplate
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public int TenantId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
    public int MaxPatientsPerSlot { get; set; } = 1;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Doctor Doctor { get; set; } = null!;
}