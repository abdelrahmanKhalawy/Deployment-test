namespace SehhaTech.Core.Models.Portal;

public class PortalUser
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = null!;
    public bool IsPhoneVerified { get; set; }
    public bool IsEmailVerified { get; set; }
    public string? NationalId { get; set; }
    public VerificationLevel Level { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBlocked { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? BlockedUntil { get; set; }

    public ICollection<PatientBooking> Bookings { get; set; } = new List<PatientBooking>();
}

public enum VerificationLevel
{
    Unverified = 0,
    PhoneVerified = 1,
    FullyVerified = 2
}