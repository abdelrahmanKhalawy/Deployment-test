using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SehhaTech.Infrastructure.Data
{
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseNpgsql("Host=reseau.proxy.rlwy.net;Port=38078;Database=railway;Username=postgres;Password=ygqTkolrLwrNuwhguExwtdYtZwDSmsQn");
            return new AppDbContext(optionsBuilder.Options);
        }
    }
}