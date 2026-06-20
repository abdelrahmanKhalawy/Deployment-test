namespace SehhaTech.Core.Models.Portal;

public class OTPRecord
{
    public int Id { get; set; }
    public string Phone { get; set; } = null!;
    public string CodeHash { get; set; } = null!;
    public OTPPurpose Purpose { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public int AttemptCount { get; set; }
    public string IpAddress { get; set; } = null!;
}

public enum OTPPurpose
{
    Register,
    Login,
    ResetPassword,
    VerifyEmail
}