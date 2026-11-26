using CampusConnect.Application.Features.Posts;
using CampusConnect.Application.Features.Recommendations;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api")]
public sealed class CommunityController(IPostService posts, IRecommendationService recommendations)
    : ApiController
{
    [HttpGet("tags")]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> Tags(
        [FromQuery] string? search, CancellationToken cancellationToken) =>
        Ok(await posts.PopularTagsAsync(search, cancellationToken));

    [HttpGet("recommendations/clubs")]
    public async Task<ActionResult<IReadOnlyList<ClubRecommendationDto>>> RecommendedClubs(
        CancellationToken cancellationToken) =>
        Ok(await recommendations.RecommendClubsAsync(cancellationToken));
}
