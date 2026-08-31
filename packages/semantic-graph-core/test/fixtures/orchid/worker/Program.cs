public sealed class OrchidRepository { }
app.MapGet("/orchids", () => Results.Ok());
services.AddScoped<OrchidRepository>();
