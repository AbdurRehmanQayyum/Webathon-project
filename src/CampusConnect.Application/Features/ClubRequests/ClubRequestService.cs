using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.ClubRequests;

public interface IClubRequestService
{
    Task<int> SubmitAsync(CreateClubRequestRequest request, CancellationToken cancellationToken);
    Task<PagedResult<ClubRequestDto>> ListMineAsync(ClubRequestQuery query, CancellationToken cancellationToken);
    Task<PagedResult<ClubRequestDto>> ListAllAsync(ClubRequestQuery query, CancellationToken cancellationToken);
    Task ApproveAsync(int requestId, CancellationToken cancellationToken);
    Task RejectAsync(int requestId, RejectClubRequestRequest request, CancellationToken cancellationToken);
}

public sealed class ClubRequestService(
    IAppDbContext db,
    ICurrentUser currentUser,
    ClubCreator clubCreator,
    INotificationService notifications,
    TimeProvider clock,
    ILogger<ClubRequestService> logger) : IClubRequestService
{
    private const int MaxPendingPerStudent = 3;

    public async Task<int> SubmitAsync(CreateClubRequestRequest request, CancellationToken cancellationToken)
    {
        var name = request.ProposedName.Trim();
        await clubCreator.EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        if (await db.Clubs.AnyAsync(c => c.Name == name, cancellationToken))
        {
            throw new ConflictException("A club with this name already exists.", "proposedName");
        }

        var pending = db.ClubRequests.Where(r => r.Status == (byte)ClubRequestStatus.Pending);
        if (await pending.AnyAsync(r => r.ProposedName == name, cancellationToken))
        {
            throw new ConflictException("A request for this club is already awaiting review.", "proposedName");
        }

        if (await pending.CountAsync(r => r.RequestedByUserId == currentUser.Id, cancellationToken)
            >= MaxPendingPerStudent)
        {
            throw new ConflictException(
                $"You can have up to {MaxPendingPerStudent} requests awaiting review at a time.");
        }

        var clubRequest = new ClubRequest
        {
            RequestedByUserId = currentUser.Id,
            CategoryId = request.CategoryId,
            ProposedName = name,
            Description = request.Description.Trim(),
            Justification = request.Justification.Trim(),
            Status = (byte)ClubRequestStatus.Pending
        };
        db.ClubRequests.Add(clubRequest);
        await db.SaveChangesAsync(cancellationToken);
        return clubRequest.Id;
    }

    public Task<PagedResult<ClubRequestDto>> ListMineAsync(
        ClubRequestQuery query, CancellationToken cancellationToken) =>
        QueryAsync(
            db.ClubRequests.Where(r => r.RequestedByUserId == currentUser.Id), query, cancellationToken);

    public Task<PagedResult<ClubRequestDto>> ListAllAsync(
        ClubRequestQuery query, CancellationToken cancellationToken) =>
        QueryAsync(db.ClubRequests, query, cancellationToken);

    // Approval creates the club, closes the request and enrols the requester atomically
    public Task ApproveAsync(int requestId, CancellationToken cancellationToken) =>
        db.ExecuteInTransactionAsync(async () =>
        {
            var request = await FindPendingAsync(requestId, cancellationToken);
            var club = await clubCreator.AddAsync(
                new SaveClubRequest(request.ProposedName, request.CategoryId, request.Description, null),
                cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            var reviewedAt = clock.GetUtcNow().UtcDateTime;
            var updated = await db.ClubRequests
                .Where(r => r.Id == requestId && r.Status == (byte)ClubRequestStatus.Pending)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(r => r.Status, (byte)ClubRequestStatus.Approved)
                    .SetProperty(r => r.CreatedClubId, club.Id)
                    .SetProperty(r => r.ReviewedByUserId, currentUser.Id)
                    .SetProperty(r => r.ReviewedAtUtc, reviewedAt)
                    .SetProperty(r => r.UpdatedAtUtc, reviewedAt), cancellationToken);

            if (updated == 0)
            {
                throw new ConflictException("This request has already been reviewed.");
            }

            db.ClubMembers.Add(new ClubMember { ClubId = club.Id, UserId = request.RequestedByUserId });
            notifications.Queue(
                request.RequestedByUserId,
                NotificationType.ClubRequestApproved,
                $"Your request for {club.Name} was approved. The club is now open.",
                $"/clubs/{club.Slug}");
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Club request {RequestId} approved as club {ClubId}", requestId, club.Id);
        }, cancellationToken);

    public async Task RejectAsync(
        int requestId, RejectClubRequestRequest request, CancellationToken cancellationToken)
    {
        var clubRequest = await FindPendingAsync(requestId, cancellationToken);
        clubRequest.Status = (byte)ClubRequestStatus.Rejected;
        clubRequest.RejectionReason = request.Reason.Trim();
        clubRequest.ReviewedByUserId = currentUser.Id;
        clubRequest.ReviewedAtUtc = clock.GetUtcNow().UtcDateTime;

        notifications.Queue(
            clubRequest.RequestedByUserId,
            NotificationType.ClubRequestRejected,
            $"Your request for {clubRequest.ProposedName} was not approved.",
            "/clubs/requests");
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Club request {RequestId} rejected", requestId);
    }

    private async Task<ClubRequest> FindPendingAsync(int requestId, CancellationToken cancellationToken)
    {
        var request = await db.ClubRequests.SingleOrDefaultAsync(r => r.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Club request");

        return request.Status == (byte)ClubRequestStatus.Pending
            ? request
            : throw new ConflictException("This request has already been reviewed.");
    }

    private static Task<PagedResult<ClubRequestDto>> QueryAsync(
        IQueryable<ClubRequest> requests, ClubRequestQuery query, CancellationToken cancellationToken)
    {
        requests = requests.AsNoTracking();

        if (query.Status is { } status)
        {
            requests = requests.Where(r => r.Status == (byte)status);
        }

        if (query.Search is { } search)
        {
            requests = requests.Where(r => r.ProposedName.Contains(search)
                || r.RequestedByUser.FullName.Contains(search));
        }

        return requests
            .OrderByDescending(r => r.CreatedAtUtc)
            .ThenByDescending(r => r.Id)
            .Select(r => new ClubRequestDto
            {
                Id = r.Id,
                ProposedName = r.ProposedName,
                Description = r.Description,
                Justification = r.Justification,
                Status = (ClubRequestStatus)r.Status,
                RejectionReason = r.RejectionReason,
                Category = new ClubCategoryDto(r.Category.Id, r.Category.Name, r.Category.IconKey),
                RequestedBy = new UserSummaryDto(
                    r.RequestedByUserId,
                    r.RequestedByUser.FullName,
                    r.RequestedByUser.Title,
                    r.RequestedByUser.AvatarFileId),
                ReviewedBy = r.ReviewedByUser == null
                    ? null
                    : new UserSummaryDto(
                        r.ReviewedByUser.Id,
                        r.ReviewedByUser.FullName,
                        r.ReviewedByUser.Title,
                        r.ReviewedByUser.AvatarFileId),
                CreatedAtUtc = r.CreatedAtUtc,
                ReviewedAtUtc = r.ReviewedAtUtc,
                CreatedClubSlug = r.CreatedClub == null ? null : r.CreatedClub.Slug
            })
            .ToPagedResultAsync(query, cancellationToken);
    }
}
