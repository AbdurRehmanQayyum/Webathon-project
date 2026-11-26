using System.Text;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Content;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Files;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using CampusConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampusConnect.Infrastructure.Seeding;

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public bool Enabled { get; set; }
    public string? DemoPassword { get; set; }
}

// Development-only bootstrap data; passwords are hashed by the application
public sealed class DemoDataSeeder(
    CampusConnectDbContext db,
    IPasswordService passwords,
    IFileStorageService storage,
    IOptions<SeedOptions> options,
    TimeProvider clock,
    ILogger<DemoDataSeeder> logger)
{
    private readonly Dictionary<string, Tag> _tags = [];

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.Enabled)
        {
            return;
        }

        if (settings.DemoPassword is not { Length: >= 8 } password)
        {
            logger.LogWarning("Demo data skipped: set Seed:DemoPassword to at least 8 characters");
            return;
        }

        var suffix = $"@{DemoContent.EmailDomain}";
        if (await db.Users.AnyAsync(u => u.Email.EndsWith(suffix), cancellationToken))
        {
            return;
        }

        var now = clock.GetUtcNow().UtcDateTime;
        await db.ExecuteInTransactionAsync(async () =>
        {
            var users = await AddUsersAsync(password, now, cancellationToken);
            var clubs = await AddClubsAsync(users, now, cancellationToken);
            AddPosts(users, clubs, now);
            AddClubRequests(users, clubs, now);
            await AddAnnouncementsAsync(users, now, cancellationToken);
            AddEvents(users);
            await db.SaveChangesAsync(cancellationToken);
        }, cancellationToken);

        logger.LogInformation("Demo data created");
    }

    private async Task<Dictionary<string, User>> AddUsersAsync(
        string password, DateTime now, CancellationToken cancellationToken)
    {
        var roles = await db.Roles.ToDictionaryAsync(r => r.Id, cancellationToken);
        var moderatorKeys = DemoContent.Clubs.SelectMany(c => c.Moderators).ToHashSet();
        var users = new Dictionary<string, User>();

        foreach (var (seed, index) in DemoContent.Users.Select((seed, index) => (seed, index)))
        {
            var user = new User
            {
                FullName = seed.FullName,
                Email = $"{seed.Key}@{DemoContent.EmailDomain}",
                Username = seed.Key,
                RegistrationNumber = seed.RegistrationNumber,
                Semester = seed.Semester,
                Title = seed.Title,
                Bio = seed.Bio,
                PasswordHash = passwords.Hash(password),
                SecurityStamp = Guid.NewGuid(),
                IsActive = true,
                CreatedAtUtc = now.AddDays(-60).AddHours(index)
            };

            if (seed.IsAdmin)
            {
                user.Roles.Add(roles[RoleIds.Admin]);
            }
            else
            {
                user.Roles.Add(roles[RoleIds.Student]);
            }

            if (moderatorKeys.Contains(seed.Key))
            {
                user.Roles.Add(roles[RoleIds.Moderator]);
            }

            users.Add(seed.Key, user);
            db.Users.Add(user);
        }

        await db.SaveChangesAsync(cancellationToken);
        return users;
    }

    private async Task<Dictionary<string, Club>> AddClubsAsync(
        Dictionary<string, User> users, DateTime now, CancellationToken cancellationToken)
    {
        var categories = await db.ClubCategories.ToDictionaryAsync(c => c.Name, cancellationToken);
        var clubs = new Dictionary<string, Club>();
        var admin = users["admin"];

        foreach (var seed in DemoContent.Clubs)
        {
            var club = new Club
            {
                Name = seed.Name,
                Slug = ClubCreator.Slugify(seed.Name),
                Category = categories[seed.Category],
                Description = seed.Description,
                Rules = "Be respectful.\nStay on topic.\nCredit your sources and do not share graded solutions.",
                Status = (byte)ClubStatus.Active,
                CreatedByUser = admin,
                CreatedAtUtc = now.AddDays(-50).AddHours(clubs.Count)
            };

            foreach (var key in seed.Members.Concat(seed.Moderators).Distinct())
            {
                club.ClubMembers.Add(new ClubMember { User = users[key], JoinedAtUtc = now.AddDays(-30) });
            }

            foreach (var key in seed.Moderators)
            {
                club.ClubModerators.Add(new ClubModerator
                {
                    User = users[key],
                    AssignedByUser = admin,
                    AssignedAtUtc = now.AddDays(-29)
                });
                db.Notifications.Add(new Notification
                {
                    RecipientUser = users[key],
                    Type = (byte)NotificationType.ModeratorAssigned,
                    Message = $"You are now a moderator of {club.Name}.",
                    LinkPath = $"/clubs/{club.Slug}",
                    CreatedAtUtc = now.AddDays(-29)
                });
            }

            clubs.Add(seed.Key, club);
            db.Clubs.Add(club);
        }

        // Interests mirror the first clubs each member joined
        foreach (var (key, user) in users)
        {
            foreach (var category in DemoContent.Clubs
                .Where(c => c.Members.Contains(key))
                .Select(c => categories[c.Category])
                .Distinct()
                .Take(3))
            {
                user.Categories.Add(category);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return clubs;
    }

    private void AddPosts(Dictionary<string, User> users, Dictionary<string, Club> clubs, DateTime now)
    {
        foreach (var seed in DemoContent.Posts)
        {
            var createdAt = now.AddHours(-seed.HoursAgo);
            var post = new Post
            {
                Club = clubs[seed.Club],
                Author = users[seed.Author],
                Type = (byte)(seed.Link is null ? PostType.Text : PostType.Link),
                Title = seed.Title,
                Body = seed.Body is null ? null : Markup(seed.Body),
                LinkUrl = seed.Link,
                Status = (byte)ContentStatus.Published,
                IsPinned = seed.Pinned,
                CreatedAtUtc = createdAt
            };

            foreach (var tag in RichText.Tags(seed.Body ?? string.Empty))
            {
                post.Tags.Add(TagFor(tag));
            }

            foreach (var voter in seed.Upvotes ?? [])
            {
                post.PostVotes.Add(new PostVote { User = users[voter], Value = 1, CreatedAtUtc = createdAt });
            }

            AddComments(users, post, seed.Comments ?? [], null, createdAt);
            db.Posts.Add(post);

            if (seed.Author != "student" && seed.Pinned)
            {
                db.Bookmarks.Add(new Bookmark { User = users["student"], Post = post, CreatedAtUtc = createdAt });
            }
        }
    }

    private static string Markup(string text) =>
        RichText.Decorate(RichText.FromPlainText(text), new Dictionary<string, int>());

    private Tag TagFor(string name)
    {
        if (!_tags.TryGetValue(name, out var tag))
        {
            tag = new Tag { Name = name };
            _tags.Add(name, tag);
        }

        return tag;
    }

    private static void AddComments(
        Dictionary<string, User> users,
        Post post,
        DemoComment[] seeds,
        Comment? parent,
        DateTime after,
        Comment? root = null)
    {
        var createdAt = after;
        foreach (var seed in seeds)
        {
            createdAt = createdAt.AddMinutes(17);
            var comment = new Comment
            {
                Post = post,
                Author = users[seed.Author],
                ParentComment = parent,
                RootComment = root,
                Body = Markup(seed.Body),
                Status = (byte)ContentStatus.Published,
                CreatedAtUtc = createdAt
            };
            post.Comments.Add(comment);
            AddComments(users, post, seed.Replies, comment, createdAt, root ?? comment);
        }
    }

    private void AddClubRequests(Dictionary<string, User> users, Dictionary<string, Club> clubs, DateTime now)
    {
        var admin = users["admin"];
        var academics = clubs["academics"];

        db.ClubRequests.AddRange(
            NewRequest("student03", clubs["web"].CategoryId, "Cloud Computing Circle",
                "Hands-on sessions about containers, hosting and deploying student projects.",
                "Many project groups struggle to put their work online and there is no shared place to learn.", 2),
            NewRequest("student06", clubs["web"].CategoryId, "Human Computer Interaction Group",
                "Interface design, usability testing and accessibility reviews for course projects.",
                "Design feedback is hard to get before evaluations, and a club would make it regular.", 1),
            NewRequest("student02", academics.CategoryId, academics.Name, academics.Description,
                "Students across semesters need one place to ask course questions and share notes.", 52,
                request =>
                {
                    request.Status = (byte)ClubRequestStatus.Approved;
                    request.CreatedClub = academics;
                    request.ReviewedByUser = admin;
                    request.ReviewedAtUtc = now.AddDays(-50);
                }),
            NewRequest("student07", academics.CategoryId, "Campus Meme Society",
                "A place to post jokes and memes about university life and deadlines.",
                "It would be a fun way for new students to get to know each other.", 7,
                request =>
                {
                    request.Status = (byte)ClubRequestStatus.Rejected;
                    request.RejectionReason =
                        "Clubs need an academic or professional focus. Social threads can live inside existing clubs.";
                    request.ReviewedByUser = admin;
                    request.ReviewedAtUtc = now.AddDays(-5);
                }));

        ClubRequest NewRequest(
            string author, int categoryId, string name, string description, string reason, int daysAgo,
            Action<ClubRequest>? review = null)
        {
            var request = new ClubRequest
            {
                RequestedByUser = users[author],
                CategoryId = categoryId,
                ProposedName = name,
                Description = description,
                Justification = reason,
                Status = (byte)ClubRequestStatus.Pending,
                CreatedAtUtc = now.AddDays(-daysAgo)
            };
            review?.Invoke(request);
            return request;
        }
    }

    private async Task AddAnnouncementsAsync(
        Dictionary<string, User> users, DateTime now, CancellationToken cancellationToken)
    {
        foreach (var seed in DemoContent.Announcements)
        {
            var createdAt = now.AddDays(-seed.DaysAgo).AddHours(-2);
            var announcement = new Announcement
            {
                Author = users[seed.Author],
                Title = seed.Title,
                Body = Markup(seed.Body),
                LinkUrl = seed.Link,
                LinkLabel = seed.LinkLabel,
                Priority = (byte)(seed.Important ? AnnouncementPriority.Important : AnnouncementPriority.Normal),
                IsPublished = seed.Published,
                PublishedAtUtc = seed.Published ? createdAt : null,
                CreatedAtUtc = createdAt
            };

            db.Announcements.Add(announcement);

            if (seed is { FileName: not null, FileText: not null })
            {
                await db.SaveChangesAsync(cancellationToken);
                await AttachTextFileAsync(announcement, seed.FileName, seed.FileText, cancellationToken);
            }
        }
    }

    private async Task AttachTextFileAsync(
        Announcement announcement, string fileName, string text, CancellationToken cancellationToken)
    {
        var bytes = Encoding.UTF8.GetBytes(text);
        var fileId = Guid.NewGuid().ToString("N");
        var objectKey = FilePurposeRules.ObjectKey(
            FilePurpose.AnnouncementAttachment, announcement.Id, fileId);

        try
        {
            using var content = new MemoryStream(bytes);
            await storage.UploadAsync(objectKey, content, "text/plain", cancellationToken);
        }
        catch (StorageUnavailableException exception)
        {
            logger.LogWarning(exception, "Sample attachment skipped because storage is unavailable");
            return;
        }

        announcement.Attachments.Add(new Attachment
        {
            UploadedByUserId = announcement.AuthorId,
            OriginalFileName = fileName,
            StoredFileName = fileId,
            ObjectKey = objectKey,
            ContentType = "text/plain",
            FileExtension = ".txt",
            FileSize = bytes.Length,
            StorageProvider = storage.ProviderName,
            Purpose = (byte)FilePurpose.AnnouncementAttachment
        });
    }

    private void AddEvents(Dictionary<string, User> users)
    {
        // Event hours are expressed in the server's local time
        var today = clock.GetLocalNow().Date;

        foreach (var seed in DemoContent.Events)
        {
            var startsAt = DateTime.SpecifyKind(
                today.AddDays(seed.DayOffset).AddHours(seed.StartHour), DateTimeKind.Local).ToUniversalTime();

            db.Events.Add(new Event
            {
                CreatedByUser = users["admin"],
                Title = seed.Title,
                Description = seed.Description,
                Venue = seed.Venue,
                Category = (byte)seed.Category,
                StartsAtUtc = startsAt,
                EndsAtUtc = startsAt.AddHours(seed.Hours),
                Status = (byte)(seed.CancellationReason is null ? EventStatus.Scheduled : EventStatus.Cancelled),
                CancellationReason = seed.CancellationReason
            });
        }
    }
}
