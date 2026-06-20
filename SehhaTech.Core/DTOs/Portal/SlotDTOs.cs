namespace SehhaTech.Core.DTOs.Portal;

public class CreateSlotTemplateRequest
{
    public int DoctorId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; } // 15, 20, or 30
    public int MaxPatientsPerSlot { get; set; } = 1;
}

public class SlotTemplateResponse
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
    public int MaxPatientsPerSlot { get; set; }
    public bool IsActive { get; set; }
}

public class AvailableSlotResponse
{
    public DateTime Date { get; set; }
    public TimeSpan Time { get; set; }
    public bool IsAvailable { get; set; }
}