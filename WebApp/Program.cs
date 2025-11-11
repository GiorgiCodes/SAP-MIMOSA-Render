var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var pyApiBase = Environment.GetEnvironmentVariable("PY_API_BASE") ?? "http://127.0.0.1:8000/";
Console.WriteLine($"[SAP-MIMOSA] Configuring Python API base URL: {pyApiBase}");

builder.Services.AddHttpClient("PythonAPI", client =>
{
    client.BaseAddress = new Uri(pyApiBase);
    client.Timeout = TimeSpan.FromSeconds(90); // Max 90 seconds for AI requests
});

builder.Services.AddHttpClient();

var app = builder.Build();

Console.WriteLine("[SAP-MIMOSA] Checking backend health...");
var backendReady = await WaitForBackendAsync(pyApiBase);
if (!backendReady)
{
    Console.WriteLine("[WARNING] Backend is not responding. App will start but API calls may fail.");
}
else
{
    Console.WriteLine("[SUCCESS] Backend is ready!");
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");    
    app.UseHsts();
}

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

Console.WriteLine($"[SAP-MIMOSA] Starting application on {Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://0.0.0.0:8080"}");

app.Run();

static async Task<bool> WaitForBackendAsync(string baseUrl)
{
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
    var maxAttempts = 12; // 12 attempts * 5 seconds = 60 seconds max wait
    
    for (int i = 0; i < maxAttempts; i++)
    {
        try
        {
            var healthUrl = new Uri(new Uri(baseUrl), "/health");
            Console.WriteLine($"[SAP-MIMOSA] Attempt {i + 1}/{maxAttempts}: Checking {healthUrl}");
            
            var response = await client.GetAsync(healthUrl);
            if (response.IsSuccessStatusCode)
            {
                return true;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SAP-MIMOSA] Backend not ready yet: {ex.Message}");
        }
        
        if (i < maxAttempts - 1)
        {
            await Task.Delay(5000); // Wait 5 seconds before retry
        }
    }
    
    return false;
}
