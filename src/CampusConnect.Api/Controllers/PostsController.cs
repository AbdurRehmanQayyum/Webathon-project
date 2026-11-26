using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Posts;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/posts")]
public sealed class PostsController(IPostService posts, IPostEngagementService engagement) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<PostDto>>> List(
        [FromQuery] PostQuery query, CancellationToken cancellationToken) =>
        await posts.ListAsync(query, cancellationToken);

    [HttpGet("{postId:int}")]
    public async Task<ActionResult<PostDto>> Get(int postId, CancellationToken cancellationToken) =>
        await posts.GetAsync(postId, cancellationToken);

    [HttpPost]
    public async Task<ActionResult<CreatedResponse>> Create(
        CreatePostRequest request, CancellationToken cancellationToken) =>
        CreatedId("/api/posts", await posts.CreateAsync(request, cancellationToken));

    [HttpPut("{postId:int}")]
    public async Task<IActionResult> Update(
        int postId, UpdatePostRequest request, CancellationToken cancellationToken)
    {
        await posts.UpdateAsync(postId, request, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{postId:int}")]
    public async Task<IActionResult> Delete(int postId, CancellationToken cancellationToken)
    {
        await posts.DeleteAsync(postId, cancellationToken);
        return NoContent();
    }

    [HttpPut("{postId:int}/vote")]
    public async Task<ActionResult<VoteResultDto>> Vote(
        int postId, VoteRequest request, CancellationToken cancellationToken) =>
        await engagement.VoteAsync(postId, request, cancellationToken);

    [HttpPut("{postId:int}/bookmark")]
    public async Task<IActionResult> AddBookmark(int postId, CancellationToken cancellationToken)
    {
        await engagement.SetBookmarkAsync(postId, true, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{postId:int}/bookmark")]
    public async Task<IActionResult> RemoveBookmark(int postId, CancellationToken cancellationToken)
    {
        await engagement.SetBookmarkAsync(postId, false, cancellationToken);
        return NoContent();
    }
}
