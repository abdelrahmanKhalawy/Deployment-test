using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SehhaTech.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReceptionPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentInvoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    AppointmentId = table.Column<int>(type: "int", nullable: true),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ServiceName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RemainingAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentInvoices_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentInvoices_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentInvoices_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlotTemplates_DoctorId",
                table: "SlotTemplates",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentInvoices_AppointmentId",
                table: "PaymentInvoices",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentInvoices_PatientId",
                table: "PaymentInvoices",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentInvoices_TenantId",
                table: "PaymentInvoices",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_SlotTemplates_Doctors_DoctorId",
                table: "SlotTemplates",
                column: "DoctorId",
                principalTable: "Doctors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SlotTemplates_Doctors_DoctorId",
                table: "SlotTemplates");

            migrationBuilder.DropTable(
                name: "PaymentInvoices");

            migrationBuilder.DropIndex(
                name: "IX_SlotTemplates_DoctorId",
                table: "SlotTemplates");
        }
    }
}
