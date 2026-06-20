using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SehhaTech.Infrastructure.Data;
using SehhaTech.Core.Models;
using SehhaTech.Core.DTOs.Reception;

namespace SehhaTech.API.Controllers;

[Authorize(Roles = "Reception")]
[ApiController]
[Route("api/[controller]")]

public class ReceptionController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReceptionController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ COMPLETED: Dashboard now returns today's queue + available doctors
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var queue = await _context.Appointments
            .Where(a =>
                a.TenantId == tenantId &&
                a.AppointmentDate >= today &&
                a.AppointmentDate < tomorrow &&
                a.Status != AppointmentStatus.Cancelled &&
                a.Status != AppointmentStatus.Completed &&
                a.Status != AppointmentStatus.NoShow)
            .OrderBy(a => a.AppointmentDate)
            .Select(a => new
            {
                appointmentId = a.Id,
                patient = new
                {
                    id = a.PatientId,
                    fullName = a.Patient != null ? a.Patient.FullName : null,
                    phone = a.Patient != null ? a.Patient.Phone : null,
                    email = a.Patient != null ? a.Patient.Email : null
                },
                doctor = new
                {
                    id = a.DoctorId,
                    specialization = a.Doctor != null ? a.Doctor.Specialization : null,
                    isActive = a.Doctor != null ? a.Doctor.IsActive : false
                },
                appointmentDate = a.AppointmentDate,
                appointmentTime = a.AppointmentDate.ToString("HH:mm"),
                duration = a.Duration,
                status = a.Status.ToString(),
                notes = a.Notes,
                waitingMinutes = a.Status == AppointmentStatus.CheckedIn
                    ? (int)Math.Max(0, (DateTime.Now - a.AppointmentDate).TotalMinutes)
                    : 0
            })
            .ToListAsync();

        var availableDoctors = await _context.Doctors
            .Where(d => d.TenantId == tenantId && d.IsActive)
            .OrderBy(d => d.Specialization)
            .Select(d => new
            {
                id = d.Id,
                specialization = d.Specialization,
                bio = d.Bio,
                profileImageUrl = d.ProfileImageUrl,
                isActive = d.IsActive,
                user = d.User == null ? null : new
                {
                    id = d.User.Id,
                    fullName = d.User.FullName,
                    email = d.User.Email,
                    profileImageUrl = d.User.ProfileImageUrl
                }
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = "Reception dashboard retrieved successfully",
            date = today.ToString("yyyy-MM-dd"),
            queue = new
            {
                count = queue.Count,
                data = queue
            },
            availableDoctors = new
            {
                count = availableDoctors.Count,
                data = availableDoctors
            }
        });
    }

    [HttpGet("patients")]
    public async Task<IActionResult> GetPatients(string? search = null)
    {
        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var query = _context.Patients
            .Where(p => p.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                p.FullName.Contains(search) ||
                p.Phone.Contains(search));

        var patients = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.FullName,
                p.Phone,
                p.Email,
                p.Gender,
                p.DateOfBirth,
                p.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = "Patients retrieved successfully",
            count = patients.Count,
            data = patients
        });
    }

    [HttpGet("patients/{id}")]
    public async Task<IActionResult> GetPatientById(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid patient id"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var patient = await _context.Patients
            .Where(p => p.Id == id && p.TenantId == tenantId)
            .Select(p => new
            {
                p.Id,
                p.FullName,
                p.Phone,
                p.Email,
                p.Gender,
                p.DateOfBirth,
                p.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (patient == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Patient not found"
            });
        }

        return Ok(new
        {
            success = true,
            message = "Patient retrieved successfully",
            data = patient
        });
    }

    [HttpPost("patients")]
    public async Task<IActionResult> AddPatient(CreatePatientRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Validation failed",
                errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    )
            });
        }

        if (request.DateOfBirth.Date >= DateTime.Today)
        {
            return BadRequest(new
            {
                success = false,
                message = "Date of birth must be in the past"
            });
        }

        if (request.DateOfBirth.Date < DateTime.Today.AddYears(-120))
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid date of birth"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var phone = request.Phone.Trim();
        var email = request.Email.Trim().ToLower();
        var gender = request.Gender.Trim();

        var phoneExists = await _context.Patients
            .AnyAsync(p => p.TenantId == tenantId && p.Phone == phone);

        if (phoneExists)
        {
            return Conflict(new
            {
                success = false,
                message = "A patient with this phone number already exists"
            });
        }

        var emailExists = await _context.Patients
            .AnyAsync(p => p.TenantId == tenantId && p.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                success = false,
                message = "A patient with this email already exists"
            });
        }

        var patient = new Patient
        {
            FullName = request.FullName.Trim(),
            Phone = phone,
            Email = email,
            DateOfBirth = request.DateOfBirth.Date,
            Gender = gender,
            TenantId = tenantId
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPatientById), new { id = patient.Id }, new
        {
            success = true,
            message = "Patient added successfully",
            data = new
            {
                patient.Id,
                patient.FullName,
                patient.Phone,
                patient.Email,
                patient.Gender,
                patient.DateOfBirth,
                patient.CreatedAt
            }
        });
    }

    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments(
        DateTime? from,
        DateTime? to,
        int page = 1,
        int pageSize = 10)
    {
        if (page <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Page must be greater than 0"
            });
        }

        if (pageSize <= 0 || pageSize > 100)
        {
            return BadRequest(new
            {
                success = false,
                message = "PageSize must be between 1 and 100"
            });
        }

        if (from.HasValue && to.HasValue && from.Value.Date > to.Value.Date)
        {
            return BadRequest(new
            {
                success = false,
                message = "From date cannot be after To date"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var query = _context.Appointments
            .Where(a => a.TenantId == tenantId);

        if (from.HasValue)
        {
            query = query.Where(a => a.AppointmentDate >= from.Value.Date);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.AppointmentDate < to.Value.Date.AddDays(1));
        }

        var totalCount = await query.CountAsync();

        var appointments = await query
            .OrderBy(a => a.AppointmentDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.PatientId,
                PatientName = a.Patient != null ? a.Patient.FullName : null,
                a.DoctorId,
                DoctorSpecialization = a.Doctor != null ? a.Doctor.Specialization : null,
                a.AppointmentDate,
                a.Duration,
                Status = a.Status.ToString(),
                a.Notes,
                a.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = "Appointments retrieved successfully",
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            count = appointments.Count,
            data = appointments
        });
    }
    [HttpPost("appointments")]
    public async Task<IActionResult> BookAppointment(CreateAppointmentRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Request body is required"
            });
        }

        if (request.PatientId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Valid PatientId is required"
            });
        }

        if (request.DoctorId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Valid DoctorId is required"
            });
        }

        if (request.AppointmentDate == default)
        {
            return BadRequest(new
            {
                success = false,
                message = "Appointment date is required"
            });
        }

        if (request.AppointmentDate <= DateTime.Now)
        {
            return BadRequest(new
            {
                success = false,
                message = "Appointment date must be in the future"
            });
        }

        if (request.Duration <= TimeSpan.Zero)
        {
            return BadRequest(new
            {
                success = false,
                message = "Appointment duration is required"
            });
        }

        if (request.Duration.TotalMinutes < 10 || request.Duration.TotalMinutes > 180)
        {
            return BadRequest(new
            {
                success = false,
                message = "Appointment duration must be between 10 and 180 minutes"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var patientExists = await _context.Patients
            .AnyAsync(p => p.Id == request.PatientId && p.TenantId == tenantId);

        if (!patientExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Patient not found"
            });
        }

        var doctorExists = await _context.Doctors
            .AnyAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId && d.IsActive);

        if (!doctorExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Doctor not found or inactive"
            });
        }

        var appointmentStart = request.AppointmentDate;
        var appointmentEnd = request.AppointmentDate.Add(request.Duration);

        var hasConflict = await _context.Appointments
            .AnyAsync(a =>
                a.TenantId == tenantId &&
                a.DoctorId == request.DoctorId &&
                a.Status != AppointmentStatus.Cancelled &&
                appointmentStart < a.AppointmentDate.Add(a.Duration) &&
                appointmentEnd > a.AppointmentDate);

        if (hasConflict)
        {
            return Conflict(new
            {
                success = false,
                message = "Doctor already has an appointment during this time"
            });
        }

        var appointment = new Appointment
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AppointmentDate = request.AppointmentDate,
            Duration = request.Duration,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Status = AppointmentStatus.Scheduled
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        // ✅ Auto-create invoice for this appointment
        var invoice = new PaymentInvoice
        {
            TenantId = tenantId,
            PatientId = appointment.PatientId,
            AppointmentId = appointment.Id,
            InvoiceNumber = $"INV-{DateTime.Now:yyyyMMddHHmmss}-{appointment.Id}",
            ServiceName = "Appointment Visit",
            TotalAmount = 500,
            PaidAmount = 0,
            RemainingAmount = 500,
            Status = PaymentStatus.Unpaid,
            PaymentMethod = PaymentMethod.None,
            Notes = "Auto-created invoice for appointment"
        };

        _context.PaymentInvoices.Add(invoice);
        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            success = true,
            message = "Appointment booked successfully",
            data = new
            {
                appointment.Id,
                appointment.PatientId,
                appointment.DoctorId,
                appointment.AppointmentDate,
                appointment.Duration,
                status = appointment.Status.ToString(),
                appointment.Notes,
                appointment.CreatedAt,
                invoice = new
                {
                    invoice.Id,
                    invoice.InvoiceNumber,
                    invoice.ServiceName,
                    invoice.TotalAmount,
                    invoice.PaidAmount,
                    invoice.RemainingAmount,
                    status = invoice.Status.ToString(),
                    paymentMethod = invoice.PaymentMethod.ToString()
                }
            }
        });
    }

    [HttpPut("appointments/{id}/checkin")]
    public async Task<IActionResult> CheckInAppointment(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid appointment id"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);

        if (appointment == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Appointment not found"
            });
        }

        if (appointment.Status == AppointmentStatus.Cancelled)
        {
            return BadRequest(new
            {
                success = false,
                message = "Cannot check in a cancelled appointment"
            });
        }

        if (appointment.Status == AppointmentStatus.Completed)
        {
            return BadRequest(new
            {
                success = false,
                message = "Cannot check in a completed appointment"
            });
        }

        if (appointment.Status == AppointmentStatus.CheckedIn)
        {
            return Conflict(new
            {
                success = false,
                message = "Patient is already checked in"
            });
        }

        // ✅ BUG FIX: was AppointmentStatus.Confirmed
        appointment.Status = AppointmentStatus.CheckedIn;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Patient checked in successfully",
            data = new
            {
                appointment.Id,
                status = appointment.Status.ToString()
            }
        });
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetTodayQueue()
    {
        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var queue = await _context.Appointments
            .Where(a =>
                a.TenantId == tenantId &&
                a.AppointmentDate >= today &&
                a.AppointmentDate < tomorrow &&
                a.Status != AppointmentStatus.Cancelled &&
                a.Status != AppointmentStatus.Completed &&
                a.Status != AppointmentStatus.NoShow)
            .OrderBy(a => a.AppointmentDate)
            .Select(a => new
            {
                appointmentId = a.Id,
                patient = new
                {
                    id = a.PatientId,
                    fullName = a.Patient != null ? a.Patient.FullName : null,
                    phone = a.Patient != null ? a.Patient.Phone : null,
                    email = a.Patient != null ? a.Patient.Email : null
                },
                doctor = new
                {
                    id = a.DoctorId,
                    specialization = a.Doctor != null ? a.Doctor.Specialization : null,
                    isActive = a.Doctor != null ? a.Doctor.IsActive : false
                },
                appointmentDate = a.AppointmentDate,
                appointmentTime = a.AppointmentDate.ToString("HH:mm"),
                duration = a.Duration,
                status = a.Status.ToString(),
                notes = a.Notes,
                // ✅ BUG FIX: was AppointmentStatus.Confirmed
                waitingMinutes = a.Status == AppointmentStatus.CheckedIn
                    ? (int)Math.Max(0, (DateTime.Now - a.AppointmentDate).TotalMinutes)
                    : 0
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = queue.Any()
                ? "Today queue retrieved successfully"
                : "No patients in today's queue",
            date = today.ToString("yyyy-MM-dd"),
            count = queue.Count,
            data = queue
        });
    }

    [HttpGet("doctors/available")]
    public async Task<IActionResult> GetAvailableDoctors()
    {
        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var doctors = await _context.Doctors
            .Where(d => d.TenantId == tenantId && d.IsActive)
            .OrderBy(d => d.Specialization)
            .Select(d => new
            {
                id = d.Id,
                specialization = d.Specialization,
                bio = d.Bio,
                profileImageUrl = d.ProfileImageUrl,
                isActive = d.IsActive,
                user = d.User == null ? null : new
                {
                    id = d.User.Id,
                    fullName = d.User.FullName,
                    email = d.User.Email,
                    profileImageUrl = d.User.ProfileImageUrl
                }
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = doctors.Any()
                ? "Available doctors retrieved successfully"
                : "No available doctors found",
            count = doctors.Count,
            data = doctors
        });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
    DateTime? from,
    DateTime? to,
    string? status,
    string? search,
    int page = 1,
    int pageSize = 10)
    {
        if (page <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Page must be greater than 0"
            });
        }

        if (pageSize <= 0 || pageSize > 100)
        {
            return BadRequest(new
            {
                success = false,
                message = "PageSize must be between 1 and 100"
            });
        }

        if (from.HasValue && to.HasValue && from.Value.Date > to.Value.Date)
        {
            return BadRequest(new
            {
                success = false,
                message = "From date cannot be after To date"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var query = _context.PaymentInvoices
            .Where(x => x.TenantId == tenantId);

        if (from.HasValue)
        {
            query = query.Where(x => x.CreatedAt >= from.Value.Date);
        }

        if (to.HasValue)
        {
            query = query.Where(x => x.CreatedAt < to.Value.Date.AddDays(1));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<PaymentStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(x => x.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(x =>
                x.InvoiceNumber.Contains(search) ||
                x.ServiceName.Contains(search) ||
                (x.Patient != null &&
                    (x.Patient.FullName.Contains(search) ||
                     x.Patient.Phone.Contains(search))));
        }

        var totalCount = await query.CountAsync();

        var invoices = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                id = x.Id,
                invoiceNumber = x.InvoiceNumber,
                patientId = x.PatientId,
                patientName = x.Patient != null ? x.Patient.FullName : null,
                patientPhone = x.Patient != null ? x.Patient.Phone : null,
                appointmentId = x.AppointmentId,
                serviceName = x.ServiceName,
                amount = x.TotalAmount,
                totalAmount = x.TotalAmount,
                paidAmount = x.PaidAmount,
                remainingAmount = x.RemainingAmount,
                status = x.Status.ToString(),
                paymentMethod = x.PaymentMethod.ToString(),
                notes = x.Notes,
                createdAt = x.CreatedAt,
                paidAt = x.PaidAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = invoices.Any()
                ? "Payment invoices retrieved successfully"
                : "No payment invoices found",
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            count = invoices.Count,
            data = invoices
        });
    }

    [HttpGet("payments/{invoiceId}")]
    public async Task<IActionResult> GetPaymentById(int invoiceId)
    {
        if (invoiceId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid invoice id"
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var invoice = await _context.PaymentInvoices
            .Where(x => x.Id == invoiceId && x.TenantId == tenantId)
            .Select(x => new
            {
                id = x.Id,
                invoiceNumber = x.InvoiceNumber,
                patientId = x.PatientId,
                patientName = x.Patient != null ? x.Patient.FullName : null,
                patientPhone = x.Patient != null ? x.Patient.Phone : null,
                appointmentId = x.AppointmentId,
                serviceName = x.ServiceName,
                amount = x.TotalAmount,
                totalAmount = x.TotalAmount,
                paidAmount = x.PaidAmount,
                remainingAmount = x.RemainingAmount,
                status = x.Status.ToString(),
                paymentMethod = x.PaymentMethod.ToString(),
                notes = x.Notes,
                createdAt = x.CreatedAt,
                paidAt = x.PaidAt
            })
            .FirstOrDefaultAsync();

        if (invoice == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Payment invoice not found"
            });
        }

        return Ok(new
        {
            success = true,
            message = "Payment invoice retrieved successfully",
            data = invoice
        });
    }

    [HttpPost("payments")]
    public async Task<IActionResult> CreatePaymentInvoice(CreatePaymentInvoiceRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Validation failed",
                errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    )
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var patientExists = await _context.Patients
            .AnyAsync(p => p.Id == request.PatientId && p.TenantId == tenantId);

        if (!patientExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Patient not found"
            });
        }

        if (request.AppointmentId.HasValue)
        {
            var appointmentExists = await _context.Appointments
                .AnyAsync(a =>
                    a.Id == request.AppointmentId.Value &&
                    a.TenantId == tenantId &&
                    a.PatientId == request.PatientId);

            if (!appointmentExists)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Appointment not found for this patient"
                });
            }
        }

        if (request.PaidAmount < 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Paid amount cannot be negative"
            });
        }

        if (request.PaidAmount > request.TotalAmount)
        {
            return BadRequest(new
            {
                success = false,
                message = "Paid amount cannot be greater than total amount"
            });
        }

        var remainingAmount = request.TotalAmount - request.PaidAmount;

        var paymentStatus = remainingAmount == 0
            ? PaymentStatus.Paid
            : request.PaidAmount > 0
                ? PaymentStatus.Partial
                : PaymentStatus.Unpaid;

        var invoice = new PaymentInvoice
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            InvoiceNumber = $"INV-{DateTime.Now:yyyyMMddHHmmss}",
            ServiceName = request.ServiceName.Trim(),
            TotalAmount = request.TotalAmount,
            PaidAmount = request.PaidAmount,
            RemainingAmount = remainingAmount,
            Status = paymentStatus,
            PaymentMethod = request.PaidAmount > 0 ? PaymentMethod.Cash : PaymentMethod.None,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            PaidAt = paymentStatus == PaymentStatus.Paid ? DateTime.Now : null
        };

        _context.PaymentInvoices.Add(invoice);
        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            success = true,
            message = "Payment invoice created successfully",
            data = new
            {
                id = invoice.Id,
                invoiceNumber = invoice.InvoiceNumber,
                patientId = invoice.PatientId,
                appointmentId = invoice.AppointmentId,
                serviceName = invoice.ServiceName,
                amount = invoice.TotalAmount,
                totalAmount = invoice.TotalAmount,
                paidAmount = invoice.PaidAmount,
                remainingAmount = invoice.RemainingAmount,
                status = invoice.Status.ToString(),
                paymentMethod = invoice.PaymentMethod.ToString(),
                notes = invoice.Notes,
                createdAt = invoice.CreatedAt,
                paidAt = invoice.PaidAt
            }
        });
    }

    [HttpPost("payments/{invoiceId}/cash")]
    public async Task<IActionResult> PayInvoiceCash(int invoiceId, PayInvoiceRequest request)
    {
        return await PayInvoiceInternal(invoiceId, request, allowOnline: false);
    }

    [HttpPost("payments/{invoiceId}/pay")]
    public async Task<IActionResult> PayInvoiceOnline(int invoiceId, PayInvoiceRequest request)
    {
        return await PayInvoiceInternal(invoiceId, request, allowOnline: true);
    }

    private async Task<IActionResult> PayInvoiceInternal(
        int invoiceId,
        PayInvoiceRequest request,
        bool allowOnline)
    {
        if (invoiceId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid invoice id"
            });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Validation failed",
                errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    )
            });
        }

        var tenantId = (int)HttpContext.Items["TenantId"]!;

        var invoice = await _context.PaymentInvoices
            .FirstOrDefaultAsync(x => x.Id == invoiceId && x.TenantId == tenantId);

        if (invoice == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Payment invoice not found"
            });
        }

        if (invoice.Status == PaymentStatus.Paid)
        {
            return Conflict(new
            {
                success = false,
                message = "Invoice is already fully paid"
            });
        }

        if (request.Amount <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Payment amount must be greater than 0"
            });
        }

        if (request.Amount > invoice.RemainingAmount)
        {
            return BadRequest(new
            {
                success = false,
                message = "Payment amount cannot be greater than remaining amount"
            });
        }

        if (!allowOnline && request.Method == PaymentMethod.Online)
        {
            return BadRequest(new
            {
                success = false,
                message = "Use online payment endpoint for online payments"
            });
        }

        invoice.PaidAmount += request.Amount;
        invoice.RemainingAmount = invoice.TotalAmount - invoice.PaidAmount;
        invoice.PaymentMethod = request.Method;
        invoice.Notes = string.IsNullOrWhiteSpace(request.Notes)
            ? invoice.Notes
            : request.Notes.Trim();

        invoice.Status = invoice.RemainingAmount == 0
            ? PaymentStatus.Paid
            : PaymentStatus.Partial;

        if (invoice.Status == PaymentStatus.Paid)
        {
            invoice.PaidAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = invoice.Status == PaymentStatus.Paid
                ? "Invoice paid successfully"
                : "Partial payment saved successfully",
            data = new
            {
                id = invoice.Id,
                invoiceNumber = invoice.InvoiceNumber,
                amount = invoice.TotalAmount,
                totalAmount = invoice.TotalAmount,
                paidAmount = invoice.PaidAmount,
                remainingAmount = invoice.RemainingAmount,
                status = invoice.Status.ToString(),
                paymentMethod = invoice.PaymentMethod.ToString(),
                paidAt = invoice.PaidAt
            }
        });
    }
}