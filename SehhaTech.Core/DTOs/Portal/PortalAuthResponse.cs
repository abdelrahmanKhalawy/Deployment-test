namespace SehhaTech.Core.DTOs.Portal;

public class PortalAuthResponse
{
    public string AccessToken { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Level { get; set; } = null!;
}