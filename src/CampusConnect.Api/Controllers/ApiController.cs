using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

public sealed record CreatedResponse(int Id);

[ApiController]
[Produces("application/json")]
public abstract class ApiController : ControllerBase
{
    protected ObjectResult CreatedId(string location, int id) =>
        Created($"{location}/{id}", new CreatedResponse(id));
}
