using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Infrastructure.Data;

namespace SehhaTech.Infrastructure.Services.Portal;

public class ClinicSearchService
{
    private readonly AppDbContext _db;

    public ClinicSearchService(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/portal/clinics
    public async Task<List<ClinicSummaryResponse>> SearchClinicsAsync(
        string? name, string? specialty, string? city)   // ✅ اسم الباراميتر زي الـ controller (specialty)
    {
        var query = _db.Tenants.AsQueryable();   // ✅ شلت .Where(t => t.IsActive) من هنا

        if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(t => t.Name.Contains(name));

        if (!string.IsNullOrWhiteSpace(specialty))
            query = query.Where(t => t.Specialization.Contains(specialty));

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(t => t.Address.Contains(city));

        return await query
            .OrderByDescending(t => t.IsActive)   // ✅ العيادات الـ Active تظهر فوق
            .ThenBy(t => t.Name)
            .Select(t => new ClinicSummaryResponse
            {
                Id = t.Id,
                Name = t.Name,
                Specialization = t.Specialization,
                Phone = t.Phone,
                Address = t.Address,
                IsActive = t.IsActive            // ✅ كان مش موجود! ده سبب ظهور "Inactive" في كل الكروت
            }).ToListAsync();
    }

    // GET /api/portal/clinics/{id}
    public async Task<ClinicProfileResponse?> GetClinicProfileAsync(int tenantId)
    {
        // ✅ شلت && t.IsActive من هنا كمان - عشان لو حد ضغط على عيادة inactive
        // الـ controller يقدر يرجع 404 برسالة واضحة بدل ما الـ service يكدب إنها "غير موجودة"
        var tenant = await _db.Tenants
            .Where(t => t.Id == tenantId)
            .FirstOrDefaultAsync();

        if (tenant == null) return null;

        var doctors = await _db.Doctors
            .Include(d => d.User)
            .Where(d => d.TenantId == tenantId && d.IsActive)
            .Select(d => new DoctorSummaryResponse
            {
                Id = d.Id,
                FullName = d.User!.FullName,
                Specialization = d.Specialization,
                ProfileImageUrl = d.ProfileImageUrl
            }).ToListAsync();

        return new ClinicProfileResponse
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Specialization = tenant.Specialization,
            Phone = tenant.Phone,
            Address = tenant.Address,
            Email = tenant.Email,
            IsActive = tenant.IsActive,          // ✅ كان مش موجود برضو هنا
            Doctors = doctors
        };
    }
}