using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Moderation;
using CampusConnect.Application.Features.Posts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

// The role gate is coarse; the service enforces per-club assignment
[Authorize(Policy = Policies.Moderation)]
[Route("api/moderation")]
public sealed class ModerationController(IModerationService moderation) : ApiController
{
    [HttpGet("clubs")]
    public async Task<ActionResult<IReadOnlyList<ModeratedClubDto>>> Clubs(CancellationToken cancellationToken) =>
        Ok(await moderation.GetClubsAsync(cancellationToken));

    [HttpGet("clubs/{clubId:int}/posts")]
    public async Task<ActionResult<PagedResult<PostDto>>> Posts(
        int clubId, [FromQuery] ModerationQuery query, CancellationToken cancellationToken) =>
        await moderation.GetPostsAsync(clubId, query, cancellationToken);

    [HttpGet("clubs/{clubId:int}/comments")]
    public async Task<ActionResult<PagedResult<ModerationCommentDto>>> Comments(
        int clubId, [FromQuery] ModerationQuery query, CancellationToken cancellationToken) =>
        await moderation.GetCommentsAsync(clubId, query, cancellationToken);

    [HttpPut("posts/{postId:int}/pin")]
    public async Task<IActionResult> SetPinned(
        int postId, SetPinnedRequest request, CancellationToken cancellationToken)
    {
        await moderation.SetPinnedAsync(postId, request, cancellationToken);
        return NoContent();
    }

    [HttpPost("posts/{postId:int}/remove")]
    public async Task<IActionResult> RemovePost(
        int postId, RemoveContentRequest request, CancellationToken cancellationToken)
    {
        await moderation.RemovePostAsync(postId, request, cancellationToken);
        return NoContent();
    }

    [HttpPost("posts/{postId:int}/restore")]
    public async Task<IActionResult> RestorePost(int postId, CancellationToken cancellationToken)
    {
        await moderation.RestorePostAsync(postId, cancellationToken);
        return NoContent();
    }

    [HttpPost("comments/{commentId:int}/remove")]
    public async Task<IActionResult> RemoveComment(int commentId, CancellationToken cancellationToken)
    {
        await moderation.RemoveCommentAsync(commentId, cancellationToken);
        return NoContent();
    }

    [HttpPost("comments/{commentId:int}/restore")]
    public async Task<IActionResult> RestoreComment(int commentId, CancellationToken cancellationToken)
    {
        await moderation.RestoreCommentAsync(commentId, cancellationToken);
        return NoContent();
    }
}
