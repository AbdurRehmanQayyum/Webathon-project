using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Content;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Common.Validation;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.Announcements;

public enum PublicationFilter
{
    Published,
    Draft,
    All
}

public sealed record AnnouncementQuery : PageQuery
{
    public PublicationFilter Publication { get; init; } = PublicationFilter.Published;
}

public sealed record SaveAnnouncementRequest(
    string Title,
    string Body,
    string? LinkUrl,
    string? LinkLabel,
    AnnouncementPriority Priority,
    bool Publish);

public sealed record SetPublicationRequest(bool IsPublished);

public sealed record AnnouncementDto
{
    public required int Id { get; init; }
    public required string Title { get; init; }
    public required string Body { get; init; }
    public required string Excerpt { get; init; }
    public string? LinkUrl { get; init; }
    public string? LinkLabel { get; init; }
    public required AnnouncementPriority Priority { get; init; }
    public required bool IsPublished { get; init; }
    public DateTime? PublishedAtUtc { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
    public required UserSummaryDto Author { get; init; }
    public required IReadOnlyList<AttachmentDto> Attachments { get; init; }
}

public sealed class SaveAnnouncementRequestValidator : AbstractValidator<SaveAnnouncementRequest>
{
    public SaveAnnouncementRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(60_000);
        RuleFor(x => x.LinkUrl).WebUrl().When(x => !string.IsNullOrEmpty(x.LinkUrl));
        RuleFor(x => x.LinkLabel).MaximumLength(100);
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public interface IAnnouncementService
{
    Task<PagedResult<AnnouncementDto>> ListAsync(AnnouncementQuery query, CancellationToken cancellationToken);
    Task<AnnouncementDto> GetAsync(int id, CancellationToken cancellationToken);
    Task<int> CreateAsync(SaveAnnouncementRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int id, SaveAnnouncementRequest request, CancellationToken cancellationToken);
    Task SetPublicationAsync(int id, SetPublicationRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int id, CancellationToken cancellationToken);
}

public sealed class AnnouncementService(
    IAppDbContext db,
    ICurrentUser currentUser,
    ContentProcessor content,
    INotificationService notifications,
    TimeProvider clock,
    ILogger<AnnouncementService> logger) : IAnnouncementService
{
    private const int MaxTextLength = 20_000;
    private const int PreviewLength = 220;

    public Task<PagedResult<AnnouncementDto>> ListAsync(
        AnnouncementQuery query, CancellationToken cancellationToken)
    {
        var announcements = Visible();
        var publication = CanManage ? query.Publication : PublicationFilter.Published;

        if (publication != PublicationFilter.All)
        {
            var published = publication == PublicationFilter.Published;
            announcements = announcements.Where(a => a.IsPublished == published);
        }

        if (query.Search is { } search)
        {
            announcements = announcements.Where(a => a.Title.Contains(search));
        }

        return announcements
            .OrderByDescending(a => a.PublishedAtUtc ?? a.CreatedAtUtc)
            .ThenByDescending(a => a.Id)
            .ToPagedResultAsync(query, Project, cancellationToken);
    }

    public async Task<AnnouncementDto> GetAsync(int id, CancellationToken cancellationToken) =>
        await Project(Visible().Where(a => a.Id == id)).SingleOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Announcement");

    public async Task<int> CreateAsync(SaveAnnouncementRequest request, CancellationToken cancellationToken)
    {
        var announcement = new Announcement { AuthorId = currentUser.Id };
        var isNewlyPublished = await ApplyAsync(announcement, request, cancellationToken);
        db.Announcements.Add(announcement);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Announcement {AnnouncementId} created", announcement.Id);

        await AnnounceAsync(announcement, isNewlyPublished, cancellationToken);
        return announcement.Id;
    }

    public async Task UpdateAsync(
        int id, SaveAnnouncementRequest request, CancellationToken cancellationToken)
    {
        var announcement = await FindAsync(id, cancellationToken);
        var isNewlyPublished = await ApplyAsync(announcement, request, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await AnnounceAsync(announcement, isNewlyPublished, cancellationToken);
    }

    public async Task SetPublicationAsync(
        int id, SetPublicationRequest request, CancellationToken cancellationToken)
    {
        var announcement = await FindAsync(id, cancellationToken);
        var isNewlyPublished = Publish(announcement, request.IsPublished);
        await db.SaveChangesAsync(cancellationToken);
        await AnnounceAsync(announcement, isNewlyPublished, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var announcement = await FindAsync(id, cancellationToken);
        announcement.IsDeleted = true;
        announcement.IsPublished = false;
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Announcement {AnnouncementId} deleted", id);
    }

    private bool CanManage => currentUser.Has(PermissionKeys.ManageAnnouncements);

    private IQueryable<Announcement> Visible()
    {
        var canManage = CanManage;
        return db.Announcements.AsNoTracking().Where(a => !a.IsDeleted && (a.IsPublished || canManage));
    }

    private async Task<bool> ApplyAsync(
        Announcement announcement, SaveAnnouncementRequest request, CancellationToken cancellationToken)
    {
        var processed = await content.ProcessAsync(
            request.Body, "body", MaxTextLength, null, cancellationToken);
        if (processed.IsBlank)
        {
            throw new RequestValidationException("body", "Write the announcement text.");
        }

        var link = string.IsNullOrWhiteSpace(request.LinkUrl) ? null : request.LinkUrl.Trim();
        announcement.Title = request.Title.Trim();
        announcement.Body = processed.Html;
        announcement.LinkUrl = link;
        announcement.LinkLabel = link is null || string.IsNullOrWhiteSpace(request.LinkLabel)
            ? null
            : request.LinkLabel.Trim();
        announcement.Priority = (byte)request.Priority;
        return Publish(announcement, request.Publish);
    }

    private bool Publish(Announcement announcement, bool publish)
    {
        var isNewlyPublished = publish && !announcement.IsPublished;
        if (isNewlyPublished)
        {
            announcement.PublishedAtUtc = clock.GetUtcNow().UtcDateTime;
        }

        announcement.IsPublished = publish;
        return isNewlyPublished;
    }

    private async Task AnnounceAsync(
        Announcement announcement, bool isNewlyPublished, CancellationToken cancellationToken)
    {
        if (isNewlyPublished)
        {
            await notifications.BroadcastAsync(
                NotificationType.AnnouncementPublished,
                $"New announcement: {announcement.Title}",
                $"/announcements/{announcement.Id}",
                cancellationToken);
        }
    }

    private async Task<Announcement> FindAsync(int id, CancellationToken cancellationToken) =>
        await db.Announcements.SingleOrDefaultAsync(a => a.Id == id && !a.IsDeleted, cancellationToken)
        ?? throw new NotFoundException("Announcement");

    private static IQueryable<AnnouncementDto> Project(IQueryable<Announcement> announcements) =>
        announcements.Select(a => new AnnouncementDto
        {
            Id = a.Id,
            Title = a.Title,
            Body = a.Body,
            Excerpt = RichText.Preview(a.Body, PreviewLength)!,
            LinkUrl = a.LinkUrl,
            LinkLabel = a.LinkLabel,
            Priority = (AnnouncementPriority)a.Priority,
            IsPublished = a.IsPublished,
            PublishedAtUtc = a.PublishedAtUtc,
            CreatedAtUtc = a.CreatedAtUtc,
            UpdatedAtUtc = a.UpdatedAtUtc,
            Author = new UserSummaryDto(a.AuthorId, a.Author.FullName, a.Author.Title, a.Author.AvatarFileId),
            Attachments = a.Attachments
                .Where(f => !f.IsDeleted)
                .OrderBy(f => f.Id)
                .Select(f => new AttachmentDto(f.Id, f.OriginalFileName, f.ContentType, f.FileSize))
                .ToList()
        });
}
