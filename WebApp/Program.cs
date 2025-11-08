var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Configure HttpClient to call Python API using PY_API_BASE environment variable
var pyApiBase = Environment.GetEnvironmentVariable("PY_API_BASE") ?? "http://localhost:8000/";
Console.WriteLine($"[SAP-MIMOSA] Configuring Python API base URL: {pyApiBase}");

builder.Services.AddHttpClient("PythonAPI", client =>
{
    client.BaseAddress = new Uri(pyApiBase);
    client.Timeout = TimeSpan.FromSeconds(60);
});

// Also add default HttpClient for other uses
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");    
    app.UseHsts();
}

// Only use HTTPS redirect in development or when explicitly configured
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

Console.WriteLine($"[SAP-MIMOSA] Starting application on {Environment.GetEnvironmentVariable("ASPNETCORE_URLS")}");

app.Run();