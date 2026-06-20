using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Core.Models;
using SehhaTech.Core.Models.Portal;
using SehhaTech.Infrastructure.Data;

namespace SehhaTech.Infrastructure.Services.Portal;

public class SlotService
{
    private readonly AppDbContext _db;

    public SlotService(AppDbContext db)
    {
        _db = db;
    }

    // GET - كل slots بتاعة دكتور معين
    public async Task<List<SlotTemplateResponse>> GetDoctorSlotsAsync(int doctorId, int tenantId)
    {
        return await _db.SlotTemplates
            .Include(s => s.Doctor)
                .ThenInclude(d => d.User)
            .Where(s => s.DoctorId == doctorId && s.TenantId == tenantId && s.IsActive)
            .Select(s => new SlotTemplateResponse
            {
                Id = s.Id,
                DoctorId = s.DoctorId,
                DoctorName = s.Doctor.User.FullName,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                SlotDurationMinutes = s.SlotDurationMinutes,
                MaxPatientsPerSlot = s.MaxPatientsPerSlot,
                IsActive = s.IsActive
            }).ToListAsync();
    }

    // POST - إضافة slot template جديد
    public async Task<SlotTemplateResponse> CreateSlotTemplateAsync(
        CreateSlotTemplateRequest request, int tenantId)
    {
        // ✅ تأكد إن نفس الـ template (دكتور+يوم+وقت بداية/نهاية) مش متعمل قبل كده
        // ده بيمنع التكرار اللي ممكن يحصل من ضغطات متكررة أو طلبات اتبعتت أكتر من مرة بالغلط
        var duplicate = await _db.SlotTemplates.AnyAsync(s =>
            s.DoctorId == request.DoctorId &&
            s.TenantId == tenantId &&
            s.DayOfWeek == request.DayOfWeek &&
            s.StartTime == request.StartTime &&
            s.EndTime == request.EndTime);

        if (duplicate)
            throw new InvalidOperationException("A slot template with the same day and time range already exists for this doctor.");

        var slot = new SlotTemplate
        {
            DoctorId = request.DoctorId,
            TenantId = tenantId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotDurationMinutes = request.SlotDurationMinutes,
            MaxPatientsPerSlot = request.MaxPatientsPerSlot,
            IsActive = true
        };

        _db.SlotTemplates.Add(slot);
        await _db.SaveChangesAsync();

        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstAsync(d => d.Id == request.DoctorId);

        return new SlotTemplateResponse
        {
            Id = slot.Id,
            DoctorId = slot.DoctorId,
            DoctorName = doctor.User!.FullName,
            DayOfWeek = slot.DayOfWeek,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            SlotDurationMinutes = slot.SlotDurationMinutes,
            MaxPatientsPerSlot = slot.MaxPatientsPerSlot,
            IsActive = slot.IsActive
        };
    }

    // DELETE - حذف slot template
    public async Task<bool> DeleteSlotTemplateAsync(int slotId, int tenantId)
    {
        var slot = await _db.SlotTemplates
            .FirstOrDefaultAsync(s => s.Id == slotId && s.TenantId == tenantId);

        if (slot == null) return false;

        _db.SlotTemplates.Remove(slot);
        await _db.SaveChangesAsync();
        return true;
    }

    // GET - الـ available slots لدكتور في يوم معين
    public async Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int doctorId, int tenantId, DateTime date)
    {
        var dayOfWeek = date.DayOfWeek;

        // 1. جيب الـ templates بتاعة الدكتور في اليوم ده
        var templates = await _db.SlotTemplates
            .Where(s => s.DoctorId == doctorId
                     && s.TenantId == tenantId
                     && s.DayOfWeek == dayOfWeek
                     && s.IsActive)
            .ToListAsync();

        // 2. جيب حجوزات الـ Patient Portal الموجودة في اليوم ده
        var portalBookedTimes = await _db.PatientBookings
            .Where(b => b.DoctorId == doctorId
                     && b.TenantId == tenantId
                     && b.SlotDate.Date == date.Date
                     && b.Status != BookingStatus.Cancelled)
            .Select(b => b.SlotTime)
            .ToListAsync();

        // ✅ 3. جيب كمان الـ Appointments الحقيقية المتعملة يدوياً من النظام الأصلي (Reception/Staff)
        // ده أساسي - من غيره ممكن الدكتور يكون عنده موعد يدوي والـ Portal مايعرفش، فيحصل double-booking
        var dayStart = date.Date;
        var dayEnd = date.Date.AddDays(1);

        var manualAppointmentTimes = await _db.Appointments
            .Where(a => a.DoctorId == doctorId
                     && a.TenantId == tenantId
                     && a.AppointmentDate >= dayStart
                     && a.AppointmentDate < dayEnd
                     && a.Status != AppointmentStatus.Cancelled)
            .Select(a => a.AppointmentDate.TimeOfDay)
            .ToListAsync();

        // ✅ ندمج الاتنين في مصدر واحد للأوقات المحجوزة (Portal + Manual) - مفيش تكرار لأنهم Sets مختلفة منطقياً
        var allBookedTimes = portalBookedTimes
            .Concat(manualAppointmentTimes)
            .Distinct()
            .ToHashSet();

        var availableSlots = new List<AvailableSlotResponse>();

        foreach (var template in templates)
        {
            var current = template.StartTime;
            while (current + TimeSpan.FromMinutes(template.SlotDurationMinutes) <= template.EndTime)
            {
                availableSlots.Add(new AvailableSlotResponse
                {
                    Date = date.Date,
                    Time = current,
                    IsAvailable = !allBookedTimes.Contains(current)
                });
                current = current.Add(TimeSpan.FromMinutes(template.SlotDurationMinutes));
            }
        }

        return availableSlots;
    }
}