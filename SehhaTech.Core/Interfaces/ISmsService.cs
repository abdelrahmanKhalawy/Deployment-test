namespace SehhaTech.Core.Interfaces;

public interface ISmsService
{
    Task<bool> SendOtpAsync(string phone, string code);
}