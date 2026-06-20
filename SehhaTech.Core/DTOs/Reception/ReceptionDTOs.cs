using System.ComponentModel.DataAnnotations;

namespace SehhaTech.Core.DTOs.Reception
{
    public class CreatePatientRequest
    {
        [Required(ErrorMessage = "Patient full name is required")]
        [MinLength(3, ErrorMessage = "Patient full name must be at least 3 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Patient phone is required")]
        [RegularExpression(@"^\d{10,15}$", ErrorMessage = "Patient phone must contain digits only and be between 10 and 15 digits")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Patient email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Patient date of birth is required")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "Patient gender is required")]
        [RegularExpression("^(Male|Female)$", ErrorMessage = "Gender must be Male or Female")]
        public string Gender { get; set; } = string.Empty;
    }

    public class CreateAppointmentRequest
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public TimeSpan Duration { get; set; }
        public string? Notes { get; set; }
    }
}