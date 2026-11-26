using CampusConnect.Api.Setup;
using CampusConnect.Application;
using CampusConnect.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Allows the published executable to run as a Windows service
builder.Host.UseWindowsService();

if (builder.Environment.IsDevelopment())
{
    DevelopmentKeys.Load(builder.Configuration, builder.Environment.ContentRootPath);
}

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration)
    .AddWebApi(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseWebApi();
await app.InitializeDataAsync();
await app.RunAsync();
