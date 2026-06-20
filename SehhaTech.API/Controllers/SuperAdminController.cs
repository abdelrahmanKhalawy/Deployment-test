
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.Models;
using SehhaTech.Infrastructure.Data;
using SehhaTech.Core.DTOs.Auth;


namespace SehhaTech.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
   [Authorize(Roles="SuperAdmin")]
    public class SuperAdminController:ControllerBase
    {
        private readonly AppDbContext _context;
        public SuperAdminController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {

            var totalClinics = await _context.Tenants.CountAsync();
            var activeClinics = await _context.Tenants.CountAsync(t => t.IsActive);
            var totalDoctors = await _context.Doctors.CountAsync();
            var todayAppointments = await _context.Appointments.CountAsync(a => a.AppointmentDate.Date == DateTime.Today);

            var recentClinics = await _context.Tenants.OrderByDescending(t => t.CreatedAt).Take(5).Select(t => new
            {
                t.Id,
                t.Name,
                t.Email,
                t.IsActive,
                t.CreatedAt
            }).ToListAsync();

            var growth = await _context.Tenants.
                GroupBy(t => new
            {
                t.CreatedAt.Year,
                t.CreatedAt.Month
            })
               .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Count = g.Count()
                }).ToListAsync();


            var status = await _context.Appointments.GroupBy(a => a.Status).Select(g => new
            {
                Status= g.Key,
                Count = g.Count()
            }).ToListAsync();



            return Ok(new
            {
                TotalClinics = totalClinics,
                ActiveClinics = activeClinics,
                TotalDoctors = totalDoctors,
                TodayAppointments = todayAppointments,
                ClinicsGrowthChart = growth,
                AppointmentStatusDistribution = status,
                RecentClinics = recentClinics

            });
        }

        [HttpGet("tenants")]
        public async Task<IActionResult>GetAllTenants()
        {
            var tenants = await _context.Tenants.Select(t => new
            {
                t.Id,
                t.Name,
                t.Phone,
                t.Email,
                t.IsActive,
                t.CreatedAt
            })
                .ToListAsync();
            return Ok(tenants);

        }
        [HttpGet("tenants/{id}")]
        public async Task<IActionResult>GetTenantById(int id)
        {
            var tenant = await _context.Tenants.Where(t => t.Id == id).Select(t=>new
            {
                t.Id ,
                t.Name ,
                t.Phone,
                t.Email,
                t.Address,
                t.IsActive,
                t.CreatedAt

            }).FirstOrDefaultAsync();
            if (tenant == null)
                return NotFound("Clinic not found");
            return Ok(tenant);
        }

        [HttpPut("tenants/{id}/toggle")]
        public async Task<IActionResult> ToggleTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
                return NotFound("Clinic not found");
            tenant.IsActive = !tenant.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new
            {
                Message = "Clinic status updated",
                tenant.Id,
                tenant.IsActive
            });
       

        
        }
        [HttpDelete("tenants/{id}")]
        public async Task<IActionResult> DeleteTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
                return NotFound(new
                {
                    success = false,
                    message = "Clinic not found"
                });

            var doctors = _context.Doctors.Where(d => d.TenantId == id);
            var patients = _context.Patients.Where(p => p.TenantId == id);
            var appointments = _context.Appointments.Where(a => a.TenantId == id);

            _context.Doctors.RemoveRange(doctors);
            _context.Patients.RemoveRange(patients);
            _context.Appointments.RemoveRange(appointments);

            _context.Tenants.Remove(tenant);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Clinic Deleted Successfully"
            });
        }
        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            var clinicsGrowth = await _context.Tenants
               .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
        .Select(g => new
        {
            Year = g.Key.Year,
            Month = g.Key.Month,
            Count = g.Count()
        })
        .OrderBy(x => x.Year)
        .ThenBy(x => x.Month)
        .ToListAsync();
            var appointmentStatus = await _context.Appointments.GroupBy(a => a.Status).Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            }).ToListAsync();
            var leaderboard = await _context.Tenants
             .Select(t => new
             {
                 t.Name,
                 Doctors = _context.Doctors.Count(d => d.TenantId == t.Id),
                 Patients = _context.Patients.Count(p => p.TenantId == t.Id)

             }).OrderByDescending(x => x.Patients).Take(5).ToListAsync();
            return Ok(new
            {
                ClinicsGrowthTrend = clinicsGrowth,
                AppointmentStatusDistribution = appointmentStatus,
                PerformanceLeaderboard = leaderboard
            });
        }

        [HttpGet("settings/profile")]
        public  async Task <IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var userIdInt = int.Parse(userId);
            var user= await _context.Users.Where(u=>u.Id == userIdInt).Select(u=>new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Role
            }).FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new
                {
                    success = false,
                    message = "User not found"
                });
            return Ok(new
            {
                success = true,
                data = user
            });
           

        }
        
            [HttpPut("settings/changepassword")]
            public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
            {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

            var userIdInt = int.Parse(userId);

            var user = await _context.Users.FindAsync(userIdInt);

                if (user == null)
                    return NotFound(new
                    {
                        success = false,
                        message = "User not found"
                    });

                if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                    return BadRequest(new
                    {
                        success = false,
                        message = "Old password is wrong"
                    });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Password changed successfully"
                });
            }
        }
    }
