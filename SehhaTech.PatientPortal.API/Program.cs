using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SehhaTech.Infrastructure.Data;
using SehhaTech.Infrastructure.Services.Portal;
using SehhaTech.Core.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Portal Services
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<PortalJwtService>();
builder.Services.AddScoped<PortalAuthService>();
builder.Services.AddScoped<ClinicSearchService>();
builder.Services.AddScoped<SlotService>();
builder.Services.AddScoped<BookingService>();

// JWT - Patient Portal (للمرضى)
var patientJwt = builder.Configuration.GetSection("PatientJWT");
var patientSecretKey = patientJwt["Secret"]!;

// ✅ JWT - النظام الأصلي (للموظفين/الدكاترة/صاحب العيادة) - نفس الـ JwtSettings المستخدمة في SehhaTech.API
var staffJwt = builder.Configuration.GetSection("JwtSettings");
var staffSecretKey = staffJwt["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    // الافتراضي يفضل الـ Patient scheme (هو الأكتر استخدام في هذا الـ API)
    options.DefaultAuthenticateScheme = "PatientScheme";
    options.DefaultChallengeScheme = "PatientScheme";
})
.AddJwtBearer("PatientScheme", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = patientJwt["Issuer"],
        ValidAudience = patientJwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(patientSecretKey))
    };
})
// ✅ Scheme ثانية بتتحقق من توكن النظام الأصلي (الموظفين/صاحب العيادة)
// بنستخدمها بس في admin/slots endpoints عشان نجيب TenantId من الـ claim بأمان
.AddJwtBearer("StaffScheme", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = staffJwt["Issuer"],
        ValidAudience = staffJwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(staffSecretKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();