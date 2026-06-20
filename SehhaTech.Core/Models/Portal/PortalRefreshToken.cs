namespace SehhaTech.Core.Models.Portal;

public class PortalRefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = null!;
    public int PortalUserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PortalUser PortalUser { get; set; } = null!;
}