using SehhaTech.Core.Models;
using System.ComponentModel.DataAnnotations;
namespace SehhaTech.Core.DTOs.Doctor
{
    public class UpdateAppointmentStatusRequest
    {
        [Required]
        public AppointmentStatus Status { get; set; }
    }
}