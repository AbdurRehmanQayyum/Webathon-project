using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Comments;
using CampusConnect.Application.Features.Posts;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api")]
public sealed class CommentsController(ICommentService comments) : ApiController
{
    [HttpGet("posts/{postId:int}/comments")]
    public async Task<ActionResult<PagedResult<CommentDto>>> List(
        int postId, [FromQuery] CommentQuery query, CancellationToken cancellationToken) =>
        await comments.ListAsync(postId, query, cancellationToken);

    [HttpPut("comments/{commentId:int}/vote")]
    public async Task<ActionResult<VoteResultDto>> Vote(
        int commentId, VoteRequest request, CancellationToken cancellationToken) =>
        await comments.VoteAsync(commentId, request, cancellationToken);

    [HttpPost("posts/{postId:int}/comments")]
    public async Task<ActionResult<CreatedResponse>> Create(
        int postId, CreateCommentRequest request, CancellationToken cancellationToken) =>
        CreatedId("/api/comments", await comments.CreateAsync(postId, request, cancellationToken));

    [HttpPut("comments/{commentId:int}")]
    public async Task<IActionResult> Update(
        int commentId, UpdateCommentRequest request, CancellationToken cancellationToken)
    {
        await comments.UpdateAsync(commentId, request, cancellationToken);
        return NoContent();
    }

    [HttpDelete("comments/{commentId:int}")]
    public async Task<IActionResult> Delete(int commentId, CancellationToken cancellationToken)
    {
        await comments.DeleteAsync(commentId, cancellationToken);
        return NoContent();
    }
}
