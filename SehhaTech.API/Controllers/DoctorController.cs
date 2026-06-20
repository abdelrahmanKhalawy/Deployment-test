using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.Models;
using SehhaTech.Infrastructure.Data;
using SehhaTech.Core.DTOs.Doctor;
namespace SehhaTech.API.Controllers;

[Authorize(Roles = "Doctor")]
[ApiController]
[Route("api/[controller]")]
public class DoctorController : ControllerBase
{
    private readonly AppDbContext _context;

    public DoctorController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    private async Task<Doctor?> GetCurrentDoctorAsync()
    {
        var tenantId = (int)HttpContext.Items["TenantId"]!;
        var userId = GetUserId();

        return await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d =>
                d.UserId == userId &&
                d.TenantId == tenantId);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor profile not found"
            });
        }

        return Ok(new
        {
            success = true,
            data = new
            {
                doctor.Id,
                doctor.Specialization,
                doctor.Bio,
                DoctorProfileImageUrl = doctor.ProfileImageUrl,
                doctor.IsActive,
                User = new
                {
                    Id = doctor.User?.Id,
                    FullName = doctor.User?.FullName,
                    Email = doctor.User?.Email,
                    UserProfileImageUrl = doctor.User?.ProfileImageUrl
                }
            }
        });
    }
    [HttpGet("appointments/today")]
    public async Task<IActionResult> GetTodayAppointments()
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var appointments = await _context.Appointments
            .Where(a =>
                a.DoctorId == doctor.Id &&
                a.TenantId == doctor.TenantId &&
                a.AppointmentDate >= today &&
                a.AppointmentDate < tomorrow)
            .OrderBy(a => a.AppointmentDate)
            .Select(a => new
            {
                a.Id,
                a.PatientId,
                PatientName = a.Patient != null ? a.Patient.FullName : null,
                a.AppointmentDate,
                a.Duration,
                Status = a.Status.ToString(),
                a.Notes
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            count = appointments.Count,
            data = appointments
        });
    }
    [HttpGet("appointments/upcoming")]
    public async Task<IActionResult> GetUpcomingAppointments()
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        var appointments = await _context.Appointments
            .Where(a =>
                a.DoctorId == doctor.Id &&
                a.TenantId == doctor.TenantId &&
                a.AppointmentDate > DateTime.Now)
            .OrderBy(a => a.AppointmentDate)
            .Select(a => new
            {
                a.Id,
                a.PatientId,
                PatientName = a.Patient != null ? a.Patient.FullName : null,
                a.AppointmentDate,
                a.Duration,
                Status = a.Status.ToString(),
                a.Notes
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            count = appointments.Count,
            data = appointments
        });
    }
    [HttpPut("appointments/{id}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(
    int id,
    UpdateAppointmentStatusRequest request)
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a =>
                a.Id == id &&
                a.DoctorId == doctor.Id &&
                a.TenantId == doctor.TenantId);

        if (appointment == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Appointment not found"
            });
        }
        if (appointment.Status == AppointmentStatus.Completed)
        {
            return BadRequest(new
            {
                success = false,
                message = "Completed appointments cannot be modified"
            });
        }
        if (request.Status != AppointmentStatus.Completed &&
            request.Status != AppointmentStatus.NoShow)
        {
            return BadRequest(new
            {
                success = false,
                message = "Doctor can only set status to Completed or NoShow"
            });
        }

        appointment.Status = request.Status;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Appointment status updated successfully",
            data = new
            {
                appointment.Id,
                Status = appointment.Status.ToString()
            }
        });
    }
    [HttpGet("patients")]
    public async Task<IActionResult> GetPatients()
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        var patientIds = await _context.Appointments
    .Where(a =>
        a.DoctorId == doctor.Id &&
        a.TenantId == doctor.TenantId)
    .Select(a => a.PatientId)
    .Distinct()
    .ToListAsync();

        var patients = await _context.Patients
            .Where(p =>
                patientIds.Contains(p.Id) &&
                p.TenantId == doctor.TenantId)
            .Select(p => new
            {
                p.Id,
                p.FullName,
                p.Phone,
                p.Email,
                p.Gender,
                p.DateOfBirth,
                p.ProfileImageUrl
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            count = patients.Count,
            data = patients
        });
    }
    [HttpGet("patients/{id}")]
    public async Task<IActionResult> GetPatientDetails(int id)
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.TenantId == doctor.TenantId);

        if (patient == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Patient not found"
            });
        }

        var history = await _context.Appointments
            .Where(a =>
                a.PatientId == id &&
                a.DoctorId == doctor.Id)
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new
            {
                a.Id,
                a.AppointmentDate,
                a.Duration,
                Status = a.Status.ToString(),
                a.Notes
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                patient.Id,
                patient.FullName,
                patient.Phone,
                patient.Email,
                patient.Gender,
                patient.DateOfBirth,
                patient.MedicalHistory,
                patient.ProfileImageUrl
            },
            appointmentHistory = history
        });
    }
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        // Today's appointments
        var todayAppointments = await _context.Appointments
            .Where(a =>
                a.DoctorId == doctor.Id &&
                a.TenantId == doctor.TenantId &&
                a.AppointmentDate >= today &&
                a.AppointmentDate < tomorrow)
            .OrderBy(a => a.AppointmentDate)
            .Select(a => new
            {
                a.Id,
                PatientName = a.Patient != null ? a.Patient.FullName : null,
                a.AppointmentDate,
                a.Duration,
                Status = a.Status.ToString()
            })
            .ToListAsync();

        // Next 3 upcoming appointments
        var upcomingAppointments = await _context.Appointments
            .Where(a =>
                a.DoctorId == doctor.Id &&
                a.TenantId == doctor.TenantId &&
                a.AppointmentDate > DateTime.Now)
            .OrderBy(a => a.AppointmentDate)
            .Take(3)
            .Select(a => new
            {
                a.Id,
                PatientName = a.Patient != null ? a.Patient.FullName : null,
                a.AppointmentDate,
                Status = a.Status.ToString()
            })
            .ToListAsync();

        // Last 3 recent patients
        var recentPatientIds = await _context.Appointments
            .Where(a =>
                a.DoctorId == doctor.Id &&
                a.TenantId == doctor.TenantId)
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => a.PatientId)
            .Distinct()
            .Take(3)
            .ToListAsync();

        var recentPatients = await _context.Patients
            .Where(p => recentPatientIds.Contains(p.Id))
            .Select(p => new
            {
                p.Id,
                p.FullName,
                p.Phone,
                p.ProfileImageUrl
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                appointmentsTodayCount = todayAppointments.Count,
                upcomingAppointments,
                dailyTimeline = todayAppointments,
                recentPatients
            }
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateDoctorProfileRequest request)
    {
        var doctor = await GetCurrentDoctorAsync();

        if (doctor == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found"
            });
        }

        if (request.Bio != null)
            doctor.Bio = request.Bio;

        if (request.ProfileImageUrl != null)
            doctor.ProfileImageUrl = request.ProfileImageUrl;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Profile updated successfully",
            data = new
            {
                doctor.Id,
                doctor.Bio,
                doctor.ProfileImageUrl
            }
        });
    }
}