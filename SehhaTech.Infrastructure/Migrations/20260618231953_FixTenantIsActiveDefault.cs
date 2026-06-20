using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SehhaTech.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixTenantIsActiveDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SlotTemplates_DoctorId",
                table: "SlotTemplates",
                column: "DoctorId");

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

            migrationBuilder.DropIndex(
                name: "IX_SlotTemplates_DoctorId",
                table: "SlotTemplates");
        }
    }
}
