namespace SehhaTech.Core.DTOs.Admin
{
    // ─── Dashboard ───────────────────────────────────────────────
    public class AdminDashboardDto
    {
        public int TotalDoctors { get; set; }
        public int TotalReceptionists { get; set; }
        public int TodayAppointments { get; set; }
        public List<UpcomingAppointmentDto> UpcomingAppointments { get; set; } = new();
        public List<RecentRegistrationDto> RecentRegistrations { get; set; } = new();
        public List<ActivityChartDto> ActivityChart { get; set; } = new();

    }

    public class UpcomingAppointmentDto
    {
        public int Id { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public DateTime ScheduledAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class RecentRegistrationDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ─── Doctor ──────────────────────────────────────────────────
    public class DoctorListItemDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class AddDoctorDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
    }

    // ─── Receptionist ────────────────────────────────────────────
    public class ReceptionistListItemDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class AddReceptionistDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
    }

    // ─── Settings ────────────────────────────────────────────────
    public class ClinicSettingsDto
    {
        public int TenantId { get; set; }
        public string ClinicName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime SubscriptionStart { get; set; }
        public DateTime SubscriptionEnd { get; set; }
        public bool IsSubscriptionActive { get; set; }
    }

    public class UpdateClinicSettingsDto
    {
        public string ClinicName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }

    public class ActivityChartDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}