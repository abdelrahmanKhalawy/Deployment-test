using Microsoft.AspNetCore.Mvc;
using SehhaTech.Infrastructure.Services.Portal;

namespace SehhaTech.PatientPortal.API.Controllers;

[ApiController]
[Route("api/portal/clinics")]
public class ClinicController : ControllerBase
{
    private readonly ClinicSearchService _clinicService;

    public ClinicController(ClinicSearchService clinicService)
    {
        _clinicService = clinicService;
    }

    // GET /api/portal/clinics?name=&specialty=&city=
    [HttpGet]
    public async Task<IActionResult> SearchClinics(
        [FromQuery] string? name,
        [FromQuery] string? specialty,      // ✅ كان "specialization" - مش بيتطابق مع الـ frontend
        [FromQuery] string? city)
    {
        var result = await _clinicService.SearchClinicsAsync(name, specialty, city);
        return Ok(result);
    }

    // GET /api/portal/clinics/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetClinicProfile(int id)
    {
        var result = await _clinicService.GetClinicProfileAsync(id);

        if (result == null)
            return NotFound(new { message = "Clinic not found." });

        return Ok(result);
    }

    // GET /api/portal/clinics/{id}/doctors
    [HttpGet("{id}/doctors")]
    public async Task<IActionResult> GetClinicDoctors(int id)
    {
        var clinic = await _clinicService.GetClinicProfileAsync(id);

        if (clinic == null)
            return NotFound(new { message = "Clinic not found." });

        // ✅ رجّع الـ doctors مباشرة - حتى لو الـ clinic inactive
        // الـ frontend هو المسؤول عن إنه ميخليش المريض يبوك في inactive clinic
        return Ok(clinic.Doctors);
    }
}