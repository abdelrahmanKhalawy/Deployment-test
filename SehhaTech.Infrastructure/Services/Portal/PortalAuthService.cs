using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Core.Interfaces;
using SehhaTech.Core.Models.Portal;
using SehhaTech.Infrastructure.Data;

namespace SehhaTech.Infrastructure.Services.Portal;

public class PortalAuthService
{
    private readonly AppDbContext _db;
    private readonly OtpService _otpService;
    private readonly ISmsService _smsService;
    private readonly PortalJwtService _jwtService;

    public PortalAuthService(
        AppDbContext db,
        OtpService otpService,
        ISmsService smsService,
        PortalJwtService jwtService)
    {
        _db = db;
        _otpService = otpService;
        _smsService = smsService;
        _jwtService = jwtService;
    }

    public async Task<(bool Success, string Message)> RegisterAsync(
        RegisterPortalUserRequest request, string ipAddress)
    {
        var exists = await _db.PortalUsers.AnyAsync(u => u.Phone == request.Phone);
        if (exists)
            return (false, "Phone number already registered.");

        var user = new PortalUser
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsPhoneVerified = false,
            Level = VerificationLevel.Unverified,
            CreatedAt = DateTime.UtcNow
        };

        _db.PortalUsers.Add(user);
        await _db.SaveChangesAsync();

        var otpRecord = await _otpService.CreateOtpAsync(request.Phone, OTPPurpose.Register, ipAddress);
        var smsSent = await _smsService.SendOtpAsync(request.Phone, otpRecord.CodeHash);

        // ✅ لو الإرسال فشل، نقول للمستخدم بصراحة بدل ما نكذب إن الرسالة راحت
        if (!smsSent)
            return (true, "Account created, but we couldn't send the OTP SMS right now. Please try Resend OTP.");

        return (true, "Registration successful. OTP sent to your phone.");
    }

    public async Task<(bool Success, string Message, PortalAuthResponse? Data)> VerifyOtpAsync(
        VerifyOtpRequest request)
    {
        var valid = await _otpService.VerifyOtpAsync(request.Phone, request.Code, request.Purpose);
        if (!valid)
            return (false, "Invalid or expired OTP.", null);

        var user = await _db.PortalUsers.FirstOrDefaultAsync(u => u.Phone == request.Phone);
        if (user == null)
            return (false, "User not found.", null);

        // ✅ الـ JWT يتطلع بس لو الـ purpose هو Register (أو أي حاجة غير ResetPassword)
        // عشان ResetPassword OTP لازم يودي المستخدم لخطوة "set new password"
        // مش يعمل login تلقائي - ده كان security hole
        if (request.Purpose == OTPPurpose.Register)
        {
            user.IsPhoneVerified = true;
            user.Level = VerificationLevel.PhoneVerified;
            await _db.SaveChangesAsync();

            var tokenPair = _jwtService.GenerateTokenPair(user);
            return (true, "OTP verified successfully.", tokenPair);
        }

        if (request.Purpose == OTPPurpose.ResetPassword)
        {
            // ✅ منرجعش JWT هنا - بس نأكد إن الـ OTP صح
            // الفرونت المفروض يودي المستخدم لصفحة "set new password"
            // مع الاحتفاظ بالـ phone+code عشان يبعتهم لـ /resetpassword/confirm
            return (true, "OTP verified. You may now reset your password.", null);
        }

        // أي purpose تاني (مش متوقع حالياً) - نتصرف بأمان من غير JWT
        return (true, "OTP verified successfully.", null);
    }

    public async Task<(bool Success, string Message, PortalAuthResponse? Data)> LoginAsync(
    LoginPortalUserRequest request)
    {
        var user = await _db.PortalUsers.FirstOrDefaultAsync(u => u.Phone == request.Phone);

        if (user == null)
            return (false, "Invalid phone or password.", null);

        if (user.IsBlocked && user.BlockedUntil > DateTime.UtcNow)
            return (false, $"Account locked. Try again after {user.BlockedUntil:HH:mm} UTC.", null);

        if (user.IsBlocked && user.BlockedUntil <= DateTime.UtcNow)
        {
            user.IsBlocked = false;
            user.FailedLoginAttempts = 0;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.IsBlocked = true;
                user.BlockedUntil = DateTime.UtcNow.AddMinutes(30);
            }
            await _db.SaveChangesAsync();
            return (false, "Invalid phone or password.", null);
        }

        if (!user.IsPhoneVerified)
            return (false, "Phone number not verified. Please verify your OTP first.", null);

        user.FailedLoginAttempts = 0;
        user.IsBlocked = false;
        await _db.SaveChangesAsync();

        var tokenPair = _jwtService.GenerateTokenPair(user);
        return (true, "Login successful.", tokenPair);
    }

    public async Task<(bool Success, string Message)> ResendOtpAsync(string phone, OTPPurpose purpose, string ipAddress)
    {
        var user = await _db.PortalUsers.FirstOrDefaultAsync(u => u.Phone == phone);
        if (user == null)
            return (false, "Phone number not found.");

        var otpRecord = await _otpService.CreateOtpAsync(phone, purpose, ipAddress);
        await _smsService.SendOtpAsync(phone, otpRecord.CodeHash);

        return (true, "OTP resent successfully.");
    }

    public async Task<(bool Success, string Message, PortalAuthResponse? Data)> RefreshAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .Include(r => r.PortalUser)
            .FirstOrDefaultAsync(r => r.Token == refreshToken && !r.IsRevoked);

        if (stored == null || stored.ExpiresAt < DateTime.UtcNow)
            return (false, "Invalid or expired refresh token.", null);

        stored.IsRevoked = true;
        await _db.SaveChangesAsync();

        var tokenPair = _jwtService.GenerateTokenPair(stored.PortalUser);
        return (true, "Token refreshed successfully.", tokenPair);
    }

    public async Task<(bool Success, string Message)> LogoutAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshToken && !r.IsRevoked);

        if (stored == null)
            return (false, "Invalid refresh token.");

        stored.IsRevoked = true;
        await _db.SaveChangesAsync();

        return (true, "Logged out successfully.");
    }

    public async Task<(bool Success, string Message)> RequestPasswordResetAsync(string phone, string ipAddress)
    {
        var user = await _db.PortalUsers.FirstOrDefaultAsync(u => u.Phone == phone);
        if (user == null)
            return (false, "Phone number not found.");

        var otpRecord = await _otpService.CreateOtpAsync(phone, OTPPurpose.ResetPassword, ipAddress);
        await _smsService.SendOtpAsync(phone, otpRecord.CodeHash);

        return (true, "OTP sent to your phone.");
    }

    public async Task<(bool Success, string Message)> ConfirmPasswordResetAsync(ResetPasswordRequest request)
    {
        var valid = await _otpService.VerifyOtpAsync(request.Phone, request.Code, OTPPurpose.ResetPassword);
        if (!valid)
            return (false, "Invalid or expired OTP.");

        var user = await _db.PortalUsers.FirstOrDefaultAsync(u => u.Phone == request.Phone);
        if (user == null)
            return (false, "User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        return (true, "Password reset successfully.");
    }
}