using CorrelationAnalysisAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<ICsvReaderService, CsvReaderService>();
builder.Services.AddScoped<ICorrelationAnalysisService, CorrelationAnalysisService>();
builder.Services.AddScoped<IFeatureImportanceService, FeatureImportanceService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => new 
{
    message = "Welcome to Web API",
    version = "1.0.0",
    endpoints = new[]
    {
        "GET /api/data/health",
        "POST /api/data/process", 
        "POST /api/correlation/analyze",
        "POST /api/feature-importance/analyze",
        "GET /swagger (Development only)"
    }
});

app.Run();