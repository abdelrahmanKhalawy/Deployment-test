using Microsoft.AspNetCore.Mvc;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Infrastructure.Services.Portal;
using PortalRefreshRequest = SehhaTech.Core.DTOs.Portal.RefreshTokenRequest;

namespace SehhaTech.PatientPortal.API.Controllers;

[ApiController]
[Route("api/portal/auth")]
public class PortalAuthController : ControllerBase
{
    private readonly PortalAuthService _authService;

    public PortalAuthController(PortalAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/portal/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterPortalUserRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, message) = await _authService.RegisterAsync(request, ip);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    // POST /api/portal/auth/verify-otp
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var (success, message, data) = await _authService.VerifyOtpAsync(request);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, data });
    }

    // POST /api/portal/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginPortalUserRequest request)
    {
        var (success, message, data) = await _authService.LoginAsync(request);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, data });
    }

    // POST /api/portal/auth/resend-otp
    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, message) = await _authService.ResendOtpAsync(request.Phone, request.Purpose, ip);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    // POST /api/portal/auth/refresh
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] PortalRefreshRequest request)
    {
        var (success, message, data) = await _authService.RefreshAsync(request.RefreshToken);

        if (!success)
            return Unauthorized(new { message });

        return Ok(new { message, data });
    }

    // POST /api/portal/auth/logout
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] PortalRefreshRequest request)
    {
        var (success, message) = await _authService.LogoutAsync(request.RefreshToken);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    // POST /api/portal/auth/resetpassword/request
    [HttpPost("resetpassword/request")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, message) = await _authService.RequestPasswordResetAsync(request.Phone, ip);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    // POST /api/portal/auth/resetpassword/confirm
    [HttpPost("resetpassword/confirm")]
    public async Task<IActionResult> ConfirmPasswordReset([FromBody] ResetPasswordRequest request)
    {
        var (success, message) = await _authService.ConfirmPasswordResetAsync(request);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }
}