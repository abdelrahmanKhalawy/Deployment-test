using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Infrastructure.Services.Portal;

namespace SehhaTech.PatientPortal.API.Controllers;

[ApiController]
[Route("api/portal")]
public class SlotController : ControllerBase
{
    private readonly SlotService _slotService;

    public SlotController(SlotService slotService)
    {
        _slotService = slotService;
    }

    // ✅ بيجيب TenantId من claim "TenantId" بتاع توكن النظام الأصلي (الموظف/صاحب العيادة)
    // مفيش طريقة لأي حد يكتب tenantId يدوي - لازم يكون عامل login كموظف فعلي في العيادة دي
    private int GetStaffTenantId()
    {
        var claim = User.FindFirst("TenantId");
        if (claim == null || !int.TryParse(claim.Value, out var tenantId))
            throw new UnauthorizedAccessException("Invalid or missing TenantId claim in staff token.");

        return tenantId;
    }

    // GET /api/portal/doctors/{id}/slots?date=2026-06-15
    // ده endpoint عام للمرضى - بياخد tenantId من query لأن المريض لسه مش عامل login بحساب عيادة
    // (بياخده من الـ clinic اللي ضغط عليها في الواجهة، ده غير حساس لأنه قراءة بس مش تعديل)
    [HttpGet("doctors/{doctorId}/slots")]
    public async Task<IActionResult> GetAvailableSlots(
        int doctorId,
        [FromQuery] int tenantId,
        [FromQuery] DateTime? date = null)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;

        if (targetDate < DateTime.UtcNow.Date)
            return BadRequest(new { message = "Cannot view slots for past dates." });

        var slots = await _slotService.GetAvailableSlotsAsync(doctorId, tenantId, targetDate);
        return Ok(slots);
    }

    // ─── Admin Endpoints (لصاحب العيادة/الموظف بس) ──────────────────────────
    // ✅ كل الـ endpoints دي بقت تستخدم StaffScheme + TenantId من التوكن
    // مش من query parameter يدوي - ده اللي كان بيسمح بالغلط (أو التلاعب) قبل كده

    // GET /api/portal/admin/slots/{doctorId}
    [HttpGet("admin/slots/{doctorId}")]
    [Authorize(AuthenticationSchemes = "StaffScheme")]
    public async Task<IActionResult> GetDoctorSlotTemplates(int doctorId)
    {
        var tenantId = GetStaffTenantId();
        var slots = await _slotService.GetDoctorSlotsAsync(doctorId, tenantId);
        return Ok(slots);
    }

    // POST /api/portal/admin/slots
    [HttpPost("admin/slots")]
    [Authorize(AuthenticationSchemes = "StaffScheme")]
    public async Task<IActionResult> CreateSlotTemplate([FromBody] CreateSlotTemplateRequest request)
    {
        var tenantId = GetStaffTenantId();

        try
        {
            var result = await _slotService.CreateSlotTemplateAsync(request, tenantId);
            return CreatedAtAction(nameof(GetDoctorSlotTemplates),
                new { doctorId = result.DoctorId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/portal/admin/slots/{id}
    [HttpDelete("admin/slots/{id}")]
    [Authorize(AuthenticationSchemes = "StaffScheme")]
    public async Task<IActionResult> DeleteSlotTemplate(int id)
    {
        var tenantId = GetStaffTenantId();
        var success = await _slotService.DeleteSlotTemplateAsync(id, tenantId);
        if (!success)
            return NotFound(new { message = "Slot template not found." });

        return Ok(new { message = "Slot template deleted successfully." });
    }
}