using System.Security.Cryptography;
using System.Text;
using SehhaTech.Core.Models.Portal;
using SehhaTech.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SehhaTech.Infrastructure.Services.Portal;

public class OtpService
{
    private readonly AppDbContext _db;

    public OtpService(AppDbContext db)
    {
        _db = db;
    }

    public string GenerateCode()
    {
        // 6 أرقام random cryptographically secure
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        var number = BitConverter.ToUInt32(bytes, 0) % 1000000;
        return number.ToString("D6");
    }

    public string HashCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes).ToLower();
    }

    public async Task<OTPRecord> CreateOtpAsync(string phone, OTPPurpose purpose, string ipAddress)
    {
        var code = GenerateCode();
        var record = new OTPRecord
        {
            Phone = phone,
            CodeHash = HashCode(code),
            Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            IpAddress = ipAddress
        };

        _db.OTPRecords.Add(record);
        await _db.SaveChangesAsync();

        // بنرجع الـ plain code عشان نبعته في الـ SMS
        // مش بنحفظه في DB أبداً
        record.CodeHash = code; // مؤقتاً عشان نبعته للـ SMS service
        return record;
    }

    public async Task<bool> VerifyOtpAsync(string phone, string code, OTPPurpose purpose)
    {
        var record = await _db.OTPRecords
            .Where(o => o.Phone == phone
                     && o.Purpose == purpose
                     && !o.IsUsed
                     && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.Id)
            .FirstOrDefaultAsync();

        if (record == null) return false;

        // زيادة عدد المحاولات
        record.AttemptCount++;

        if (record.AttemptCount >= 5)
        {
            record.IsUsed = true;
            await _db.SaveChangesAsync();
            return false;
        }

        if (record.CodeHash != HashCode(code))
        {
            await _db.SaveChangesAsync();
            return false;
        }

        // صح — mark as used
        record.IsUsed = true;
        await _db.SaveChangesAsync();
        return true;
    }
}