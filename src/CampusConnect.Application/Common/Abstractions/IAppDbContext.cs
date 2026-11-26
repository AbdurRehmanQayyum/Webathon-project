using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Common.Abstractions;

public interface IAppDbContext
{
    DbSet<Announcement> Announcements { get; }
    DbSet<Attachment> Attachments { get; }
    DbSet<Bookmark> Bookmarks { get; }
    DbSet<Club> Clubs { get; }
    DbSet<ClubCategory> ClubCategories { get; }
    DbSet<ClubMember> ClubMembers { get; }
    DbSet<ClubModerator> ClubModerators { get; }
    DbSet<ClubRequest> ClubRequests { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Event> Events { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Post> Posts { get; }
    DbSet<PostVote> PostVotes { get; }
    DbSet<Role> Roles { get; }
    DbSet<User> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken);
}
