using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SehhaTech.Core.DTOs.Portal;
using SehhaTech.Infrastructure.Services.Portal;

namespace SehhaTech.PatientPortal.API.Controllers;

[ApiController]
[Route("api/portal/bookings")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly BookingService _bookingService;

    public BookingController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    // ✅ بيدور على "sub" مباشرة (هو ده اسم الـ claim في PortalJwtService)
    // claim type mapping بتاع .NET ممكن يحول "sub" لـ ClaimTypes.NameIdentifier
    // أو يسيبه "sub" حسب الإصدار - فبندور على الاتنين للأمان
    private int GetPortalUserId()
    {
        var claim = User.FindFirst("sub")
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

        if (claim == null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedAccessException("Invalid or missing user claim in token.");

        return id;
    }

    // POST /api/portal/bookings
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var portalUserId = GetPortalUserId();

        var (success, message, data) = await _bookingService.BookSlotAsync(request, portalUserId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, data });
    }

    // GET /api/portal/bookings
    [HttpGet]
    public async Task<IActionResult> GetMyBookings()
    {
        var portalUserId = GetPortalUserId();

        var bookings = await _bookingService.GetMyBookingsAsync(portalUserId);
        return Ok(bookings);
    }

    // GET /api/portal/bookings/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBookingById(int id)
    {
        var portalUserId = GetPortalUserId();

        var booking = await _bookingService.GetBookingByIdAsync(id, portalUserId);

        if (booking == null)
            return NotFound(new { message = "Booking not found." });

        return Ok(booking);
    }

    // PUT /api/portal/bookings/{id}/cancel
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(
        int id,
        [FromBody] CancelBookingRequest? request = null)
    {
        var portalUserId = GetPortalUserId();

        var (success, message) = await _bookingService.CancelBookingAsync(
            id, portalUserId, request?.CancellationReason);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }
}