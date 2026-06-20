using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Core.Models;
using SehhaTech.Core.Models.Portal;
using SehhaTech.Infrastructure.Data;
using System.Data;

namespace SehhaTech.Infrastructure.Services.Portal;

public class BookingService
{
    private readonly AppDbContext _db;

    public BookingService(AppDbContext db)
    {
        _db = db;
    }

    // POST - إنشاء حجز جديد
    public async Task<(bool success, string message, BookingResponse? data)> BookSlotAsync(
        CreateBookingRequest request, int portalUserId)
    {
        // 1. Idempotency check
        var existing = await _db.PatientBookings
            .FirstOrDefaultAsync(b => b.IdempotencyKey == request.IdempotencyKey);
        if (existing != null)
            return (true, "Booking already exists.", await MapToResponseAsync(existing));

        // 2. تأكد إن الـ slot مش محجوز
        var conflict = await _db.PatientBookings.AnyAsync(b =>
            b.DoctorId == request.DoctorId &&
            b.TenantId == request.TenantId &&
            b.SlotDate.Date == request.SlotDate.Date &&
            b.SlotTime == request.SlotTime &&
            b.Status != BookingStatus.Cancelled);

        if (conflict)
            return (false, "This slot is already booked.", null);

        // 3. تأكد إن المريض مش عنده أكتر من حد معين من الحجوزات النشطة
        var user = await _db.PortalUsers.FindAsync(portalUserId);
        if (user == null)
            return (false, "User not found.", null);

        if (user.Level == VerificationLevel.Unverified)
            return (false, "Phone verification required before booking.", null);

        // ✅ شيلنا قيد "Maximum active bookings" المرتبط بـ Email Verification
        // لأن الـ email verification feature لسه مش متعمل في النظام، فمكنش منطقي
        // نطلب من المستخدم خطوة مش موجودة أصلاً عشان يكمل يحجز

        // 4. Begin transaction
        using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            // 5. Final conflict check inside transaction
            var finalConflict = await _db.PatientBookings.AnyAsync(b =>
                b.DoctorId == request.DoctorId &&
                b.TenantId == request.TenantId &&
                b.SlotDate.Date == request.SlotDate.Date &&
                b.SlotTime == request.SlotTime &&
                b.Status != BookingStatus.Cancelled);

            if (finalConflict)
            {
                await tx.RollbackAsync();
                return (false, "This slot was just booked by someone else.", null);
            }

            // 6. إنشاء الحجز
            var booking = new PatientBooking
            {
                IdempotencyKey = request.IdempotencyKey,
                PortalUserId = portalUserId,
                TenantId = request.TenantId,
                DoctorId = request.DoctorId,
                SlotDate = request.SlotDate.Date,
                SlotTime = request.SlotTime,
                Status = BookingStatus.Pending,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _db.PatientBookings.Add(booking);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            // 7. Integration Bridge
            await CreateAppointmentAsync(booking);

            return (true, "Booking confirmed successfully.", await MapToResponseAsync(booking));
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();
            return (false, "This slot is already booked.", null);
        }
    }

    // GET - كل حجوزات المريض
    public async Task<List<BookingResponse>> GetMyBookingsAsync(int portalUserId)
    {
        var bookings = await _db.PatientBookings
            .Where(b => b.PortalUserId == portalUserId)
            .OrderByDescending(b => b.SlotDate)
            .ToListAsync();

        var result = new List<BookingResponse>();
        foreach (var b in bookings)
            result.Add(await MapToResponseAsync(b));

        return result;
    }

    // GET - تفاصيل حجز معين
    public async Task<BookingResponse?> GetBookingByIdAsync(int bookingId, int portalUserId)
    {
        var booking = await _db.PatientBookings
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.PortalUserId == portalUserId);

        if (booking == null) return null;
        return await MapToResponseAsync(booking);
    }

    // PUT - إلغاء حجز
    public async Task<(bool success, string message)> CancelBookingAsync(
        int bookingId, int portalUserId, string? reason)
    {
        var booking = await _db.PatientBookings
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.PortalUserId == portalUserId);

        if (booking == null)
            return (false, "Booking not found.");

        if (booking.Status == BookingStatus.Cancelled)
            return (false, "Booking is already cancelled.");

        // قاعدة الـ 2 ساعات
        var appointmentTime = booking.SlotDate.Add(booking.SlotTime);
        var hoursUntil = (appointmentTime - DateTime.UtcNow).TotalHours;
        if (hoursUntil < 2)
            return (false, "Cannot cancel within 2 hours of appointment.");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancellationReason = reason;

        // إلغاء الـ Appointment المرتبط
        if (booking.LinkedAppointmentId.HasValue)
        {
            var appointment = await _db.Appointments
                .FindAsync(booking.LinkedAppointmentId.Value);
            if (appointment != null)
                appointment.Status = AppointmentStatus.Cancelled;
        }

        await _db.SaveChangesAsync();
        return (true, "Booking cancelled successfully.");
    }

    // Integration Bridge
    private async Task CreateAppointmentAsync(PatientBooking booking)
    {
        var portalUser = await _db.PortalUsers.FindAsync(booking.PortalUserId);
        if (portalUser == null) return;

        // إيجاد أو إنشاء Patient في الكلينيكا
        var patient = await _db.Patients.FirstOrDefaultAsync(p =>
            p.TenantId == booking.TenantId && p.Phone == portalUser.Phone);

        if (patient == null)
        {
            patient = new Patient
            {
                TenantId = booking.TenantId,
                FullName = portalUser.FullName,
                Phone = portalUser.Phone,
                Email = portalUser.Email,
                DateOfBirth = DateTime.UtcNow, // placeholder
                Gender = "Unknown",
                CreatedAt = DateTime.UtcNow
            };
            _db.Patients.Add(patient);
            await _db.SaveChangesAsync();
        }

        // إنشاء Appointment
        var appointment = new Appointment
        {
            TenantId = booking.TenantId,
            PatientId = patient.Id,
            DoctorId = booking.DoctorId,
            AppointmentDate = booking.SlotDate.Add(booking.SlotTime),
            Duration = TimeSpan.FromMinutes(30),
            Status = AppointmentStatus.Scheduled,
            Source = AppointmentSource.OnlinePortal,
            CreatedAt = DateTime.UtcNow
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync();

        // ربط الـ IDs
        booking.LinkedAppointmentId = appointment.Id;
        booking.LinkedPatientId = patient.Id;
        booking.Status = BookingStatus.Confirmed;
        await _db.SaveChangesAsync();
    }

    // Helper - تحويل Booking لـ Response
    private async Task<BookingResponse> MapToResponseAsync(PatientBooking booking)
    {
        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == booking.DoctorId);

        var clinic = await _db.Tenants
            .FirstOrDefaultAsync(t => t.Id == booking.TenantId);

        return new BookingResponse
        {
            Id = booking.Id,
            DoctorId = booking.DoctorId,
            DoctorName = doctor?.User?.FullName ?? "Unknown",
            TenantId = booking.TenantId,
            ClinicName = clinic?.Name ?? "Unknown",
            SlotDate = booking.SlotDate,
            SlotTime = booking.SlotTime,
            Status = booking.Status.ToString(),
            Notes = booking.Notes,
            CreatedAt = booking.CreatedAt
        };
    }
}