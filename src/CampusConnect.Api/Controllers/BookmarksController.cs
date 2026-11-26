using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Posts;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/bookmarks")]
public sealed class BookmarksController(IPostService posts) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<PostDto>>> List(
        [FromQuery] PageQuery query, CancellationToken cancellationToken) =>
        await posts.ListBookmarkedAsync(query, cancellationToken);
}
