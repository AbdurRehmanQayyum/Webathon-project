using CampusConnect.Api.Setup;
using CampusConnect.Application;
using CampusConnect.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration)
    .AddWebApi(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseWebApi();
await app.InitializeDataAsync();
await app.RunAsync();
