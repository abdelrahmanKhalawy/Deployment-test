using SehhaTech.Core.DTOs.Admin;

namespace SehhaTech.Core.Interfaces
{
    public interface IAdminService
    {
        Task<AdminDashboardDto> GetDashboardAsync(int tenantId);

        Task<List<DoctorListItemDto>> GetDoctorsAsync(int tenantId);
        Task<DoctorListItemDto> AddDoctorAsync(int tenantId, AddDoctorDto dto);
        Task DeleteDoctorAsync(int tenantId, int doctorId);
        Task ToggleDoctorStatusAsync(int tenantId, int doctorId);

        Task<List<ReceptionistListItemDto>> GetReceptionistsAsync(int tenantId);
        Task<ReceptionistListItemDto> AddReceptionistAsync(int tenantId, AddReceptionistDto dto);
        Task DeleteReceptionistAsync(int tenantId, int receptionistId);

        Task<ClinicSettingsDto> GetSettingsAsync(int tenantId);
        Task UpdateSettingsAsync(int tenantId, UpdateClinicSettingsDto dto);
    }
}
