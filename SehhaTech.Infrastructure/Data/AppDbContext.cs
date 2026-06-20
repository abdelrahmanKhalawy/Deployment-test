using Microsoft.EntityFrameworkCore;
using SehhaTech.Core.Models;
using SehhaTech.Core.Models.Portal;
using SehhaTech.Core.Models.Portal;

namespace SehhaTech.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<PaymentInvoice> PaymentInvoices { get; set; }
        // Staff Tables
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<PortalRefreshToken> RefreshTokens { get; set; }

        // Portal Tables
        public DbSet<PortalUser> PortalUsers { get; set; }
        public DbSet<OTPRecord> OTPRecords { get; set; }
        public DbSet<SlotTemplate> SlotTemplates { get; set; }
        public DbSet<PatientBooking> PatientBookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Tenant
            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Name).IsRequired().HasMaxLength(200);
                entity.Property(t => t.Email).IsRequired().HasMaxLength(200);
                entity.HasIndex(t => t.Email).IsUnique();
            });

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Role).HasConversion<string>();

                entity.HasOne(u => u.Tenant)
                      .WithMany(t => t.Users)
                      .HasForeignKey(u => u.TenantId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Subscription
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Amount).HasColumnType("decimal(18,2)");
                entity.Property(s => s.Status).HasConversion<string>();

                entity.HasOne(s => s.Tenant)
                      .WithOne(t => t.Subscription)
                      .HasForeignKey<Subscription>(s => s.TenantId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Patient
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.FullName).IsRequired().HasMaxLength(200);
                entity.Property(p => p.Phone).IsRequired().HasMaxLength(20);

                entity.HasOne(p => p.Tenant)
                      .WithMany()
                      .HasForeignKey(p => p.TenantId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Doctor
            modelBuilder.Entity<Doctor>(entity =>
            {
                entity.HasKey(d => d.Id);

                entity.HasOne(d => d.Tenant)
                      .WithMany()
                      .HasForeignKey(d => d.TenantId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.User)
                      .WithMany()
                      .HasForeignKey(d => d.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Appointment
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.Status).HasConversion<string>();
                entity.Property(a => a.Source).HasConversion<string>();

                entity.HasOne(a => a.Tenant)
                      .WithMany()
                      .HasForeignKey(a => a.TenantId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Patient)
                      .WithMany(p => p.Appointments)
                      .HasForeignKey(a => a.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Doctor)
                      .WithMany(d => d.Appointments)
                      .HasForeignKey(a => a.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // PortalUser
            modelBuilder.Entity<PortalUser>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Phone).IsRequired().HasMaxLength(20);
                entity.HasIndex(p => p.Phone).IsUnique();
                entity.Property(p => p.FullName).IsRequired().HasMaxLength(200);
                entity.Property(p => p.Level).HasConversion<string>();
            });

            // OTPRecord
            modelBuilder.Entity<OTPRecord>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.Phone).IsRequired().HasMaxLength(20);
                entity.Property(o => o.Purpose).HasConversion<string>();
            });

            // SlotTemplate
            modelBuilder.Entity<SlotTemplate>(entity =>
            {
                entity.HasKey(s => s.Id);
            });

            // PatientBooking
            modelBuilder.Entity<PatientBooking>(entity =>
            {
                entity.HasKey(b => b.Id);
                entity.Property(b => b.Status).HasConversion<string>();
                entity.HasIndex(b => b.IdempotencyKey).IsUnique();

                // Unique constraint - منع double booking
                entity.HasIndex(b => new { b.DoctorId, b.SlotDate, b.SlotTime, b.TenantId })
                      .IsUnique()
                      .HasFilter("[Status] != 'Cancelled'");

                entity.HasOne(b => b.PortalUser)
                      .WithMany(u => u.Bookings)
                      .HasForeignKey(b => b.PortalUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PortalRefreshToken>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.HasIndex(r => r.Token).IsUnique();
                entity.HasOne(r => r.PortalUser)
                      .WithMany()
                      .HasForeignKey(r => r.PortalUserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<PaymentInvoice>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.InvoiceNumber)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.ServiceName)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.TotalAmount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.PaidAmount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.RemainingAmount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.Notes)
                    .HasMaxLength(500);

                entity.HasOne(x => x.Patient)
                    .WithMany()
                    .HasForeignKey(x => x.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Appointment)
                    .WithMany()
                    .HasForeignKey(x => x.AppointmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}