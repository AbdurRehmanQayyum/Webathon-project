using CampusConnect.Application.Features.Users;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/users")]
public sealed class UsersController(IUserService users) : ApiController
{
    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<UserHandleDto>>> Search(
        [FromQuery] string? search, CancellationToken cancellationToken) =>
        Ok(await users.SearchHandlesAsync(search, cancellationToken));

    [HttpGet("{userId:int}")]
    public async Task<ActionResult<ProfileDto>> GetProfile(int userId, CancellationToken cancellationToken) =>
        await users.GetProfileAsync(userId, cancellationToken);

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile(
        UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        await users.UpdateProfileAsync(request, cancellationToken);
        return NoContent();
    }
}
