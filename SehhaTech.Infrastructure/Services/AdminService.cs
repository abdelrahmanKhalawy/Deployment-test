using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.DTOs.Admin;
using SehhaTech.Core.Interfaces;
using SehhaTech.Infrastructure.Data;
using SehhaTech.Core.Models;

namespace SehhaTech.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _db;

        public AdminService(AppDbContext db)
        {
            _db = db;
        }

        // ─── Dashboard ───────────────────────────────────────────
        public async Task<AdminDashboardDto> GetDashboardAsync(int tenantId)
        {
            var today = DateTime.Today;

            var totalDoctors = await _db.Users
                .CountAsync(u => u.TenantId == tenantId && u.Role == UserRole.Doctor && u.IsActive);

            var totalReceptionists = await _db.Users
                .CountAsync(u => u.TenantId == tenantId && u.Role == UserRole.Reception && u.IsActive);

            var todayAppointments = await _db.Appointments
                .CountAsync(a => a.TenantId == tenantId && a.AppointmentDate.Date == today);

            var upcoming = await _db.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor).ThenInclude(d => d!.User)
                .Where(a => a.TenantId == tenantId
                         && a.AppointmentDate >= DateTime.Now
                         && a.Status == AppointmentStatus.Scheduled)
                .OrderBy(a => a.AppointmentDate)
                .Take(5)
                .Select(a => new UpcomingAppointmentDto
                {
                    Id = a.Id,
                    PatientName = a.Patient!.FullName,
                    DoctorName = a.Doctor!.User!.FullName,
                    ScheduledAt = a.AppointmentDate,
                    Status = a.Status.ToString()
                })
                .ToListAsync();

            var recentRegistrations = await _db.Users
                .Where(u => u.TenantId == tenantId && u.Role != UserRole.ClinicAdmin)
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new RecentRegistrationDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Role = u.Role.ToString(),
                    ProfileImageUrl = u.ProfileImageUrl,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            var rawChart = await _db.Appointments
                .Where(a => a.TenantId == tenantId &&
                            a.AppointmentDate >= DateTime.Today.AddDays(-7))
                .GroupBy(a => a.AppointmentDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var activityChart = rawChart.Select(x => new ActivityChartDto
            {
                Date = x.Date.ToString("yyyy-MM-dd"),
                Count = x.Count
            }).ToList();

            return new AdminDashboardDto
            {
                TotalDoctors = totalDoctors,
                TotalReceptionists = totalReceptionists,
                TodayAppointments = todayAppointments,
                UpcomingAppointments = upcoming,
                RecentRegistrations = recentRegistrations,
                ActivityChart = activityChart
            };
        }

        // ─── Doctors ─────────────────────────────────────────────
        public async Task<List<DoctorListItemDto>> GetDoctorsAsync(int tenantId)
        {
            return await _db.Doctors
                .Include(d => d.User)
                .Where(d => d.TenantId == tenantId)
                .Select(d => new DoctorListItemDto
                {
                    Id = d.Id,
                    FullName = d.User!.FullName,
                    Specialization = d.Specialization,
                    Email = d.User.Email,
                    ProfileImageUrl = d.ProfileImageUrl,
                    IsActive = d.IsActive
                })
                .ToListAsync();
        }

        public async Task<DoctorListItemDto> AddDoctorAsync(int tenantId, AddDoctorDto dto)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(dto.FullName))
                throw new ArgumentException("اسم الدكتور مطلوب");

            if (string.IsNullOrWhiteSpace(dto.Specialization))
                throw new ArgumentException("التخصص مطلوب");

            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new ArgumentException("البريد الإلكتروني مطلوب");

            var emailExists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                throw new InvalidOperationException("البريد الإلكتروني مستخدم بالفعل");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                ProfileImageUrl = dto.ProfileImageUrl,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("SehhaTech@123"),
                Role = UserRole.Doctor,
                TenantId = tenantId,
                MustResetPassword = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var doctor = new Doctor
            {
                UserId = user.Id,
                TenantId = tenantId,
                Specialization = dto.Specialization,
                ProfileImageUrl = dto.ProfileImageUrl,
                IsActive = true
            };

            _db.Doctors.Add(doctor);
            await _db.SaveChangesAsync();

            return new DoctorListItemDto
            {
                Id = doctor.Id,
                FullName = user.FullName,
                Specialization = doctor.Specialization,
                Email = user.Email,
                ProfileImageUrl = doctor.ProfileImageUrl,
                IsActive = doctor.IsActive
            };
        }

        public async Task DeleteDoctorAsync(int tenantId, int doctorId)
        {
            var doctor = await _db.Doctors
                .Include(d => d.User)
                .Include(d => d.Appointments)
                .FirstOrDefaultAsync(d => d.Id == doctorId && d.TenantId == tenantId)
                ?? throw new KeyNotFoundException("الدكتور مش موجود");

            // احذف الـ appointments الأول عشان مفيش FK error
            if (doctor.Appointments.Any())
                _db.Appointments.RemoveRange(doctor.Appointments);

            // بعدين احذف الـ Doctor
            _db.Doctors.Remove(doctor);

            // بعدين احذف الـ User
            if (doctor.User != null)
                _db.Users.Remove(doctor.User);

            await _db.SaveChangesAsync();
        }

        public async Task ToggleDoctorStatusAsync(int tenantId, int doctorId)
        {
            var doctor = await _db.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == doctorId && d.TenantId == tenantId)
                ?? throw new KeyNotFoundException("الدكتور مش موجود");

            doctor.IsActive = !doctor.IsActive;

            // sync الـ User كمان
            if (doctor.User != null)
                doctor.User.IsActive = doctor.IsActive;

            await _db.SaveChangesAsync();
        }

        // ─── Receptionists ───────────────────────────────────────
        public async Task<List<ReceptionistListItemDto>> GetReceptionistsAsync(int tenantId)
        {
            return await _db.Users
                .Where(u => u.TenantId == tenantId && u.Role == UserRole.Reception)
                .Select(u => new ReceptionistListItemDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    ProfileImageUrl = u.ProfileImageUrl,
                    IsActive = u.IsActive
                })
                .ToListAsync();
        }

        public async Task<ReceptionistListItemDto> AddReceptionistAsync(int tenantId, AddReceptionistDto dto)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(dto.FullName))
                throw new ArgumentException("اسم الموظف مطلوب");

            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new ArgumentException("البريد الإلكتروني مطلوب");

            var emailExists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                throw new InvalidOperationException("البريد الإلكتروني مستخدم بالفعل");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                ProfileImageUrl = dto.ProfileImageUrl,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("SehhaTech@123"),
                Role = UserRole.Reception,
                TenantId = tenantId,
                MustResetPassword = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return new ReceptionistListItemDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfileImageUrl = user.ProfileImageUrl,
                IsActive = user.IsActive
            };
        }

        public async Task DeleteReceptionistAsync(int tenantId, int receptionistId)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == receptionistId
                                       && u.TenantId == tenantId
                                       && u.Role == UserRole.Reception)
                ?? throw new KeyNotFoundException("الموظف مش موجود");

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }

        // ─── Settings ────────────────────────────────────────────
        public async Task<ClinicSettingsDto> GetSettingsAsync(int tenantId)
        {
            var tenant = await _db.Tenants
                .Include(t => t.Subscription)
                .FirstOrDefaultAsync(t => t.Id == tenantId)
                ?? throw new KeyNotFoundException("العيادة مش موجودة");

            return new ClinicSettingsDto
            {
                TenantId = tenant.Id,
                ClinicName = tenant.Name,
                Phone = tenant.Phone,
                Address = tenant.Address,
                SubscriptionStart = tenant.Subscription?.StartDate ?? DateTime.MinValue,
                SubscriptionEnd = tenant.Subscription?.EndDate ?? DateTime.MinValue,
                IsSubscriptionActive = tenant.Subscription?.Status == SubscriptionStatus.Active
            };
        }

        public async Task UpdateSettingsAsync(int tenantId, UpdateClinicSettingsDto dto)
        {
            var tenant = await _db.Tenants.FindAsync(tenantId)
                ?? throw new KeyNotFoundException("العيادة مش موجودة");

            // ✅ مش هنمسح القيم القديمة لو الـ dto فاضي
            if (!string.IsNullOrWhiteSpace(dto.ClinicName))
                tenant.Name = dto.ClinicName;

            if (!string.IsNullOrWhiteSpace(dto.Phone))
                tenant.Phone = dto.Phone;

            if (!string.IsNullOrWhiteSpace(dto.Address))
                tenant.Address = dto.Address;

            await _db.SaveChangesAsync();
        }
    }
}