using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Core.Models.Portal;
using SehhaTech.Infrastructure.Data;

namespace SehhaTech.Infrastructure.Services.Portal;

public class PortalJwtService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;

    public PortalJwtService(IConfiguration config, AppDbContext db)
    {
        _config = config;
        _db = db;
    }

    public PortalAuthResponse GenerateTokenPair(PortalUser user)
    {
        var jwt = _config.GetSection("PatientJWT");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("phone", user.Phone),
            new Claim("name", user.FullName),
            new Claim("role", "Patient"),
            new Claim("level", user.Level.ToString()),
            new Claim("phoneVerified", user.IsPhoneVerified.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwt["AccessTokenExpiryMinutes"]!)),
            signingCredentials: creds
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();

        // احفظ الـ refresh token في DB
        _db.RefreshTokens.Add(new PortalRefreshToken
        {
            Token = refreshToken,
            PortalUserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(jwt["RefreshTokenExpiryDays"]!)),
            IsRevoked = false
        });
        _db.SaveChanges();

        return new PortalAuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            FullName = user.FullName,
            Phone = user.Phone,
            Level = user.Level.ToString()
        };
    }

    private string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }
}