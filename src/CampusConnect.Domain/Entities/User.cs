using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? RegistrationNumber { get; set; }

    public byte? Semester { get; set; }

    public string? Title { get; set; }

    public string? Bio { get; set; }

    public string PasswordHash { get; set; } = null!;

    public Guid SecurityStamp { get; set; }

    public bool IsActive { get; set; }

    public int FailedLoginCount { get; set; }

    public DateTime? LockoutEndsAtUtc { get; set; }

    public DateTime? LastLoginAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public int? AvatarFileId { get; set; }

    public virtual ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual Attachment? AvatarFile { get; set; }

    public virtual ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();

    public virtual ICollection<ClubMember> ClubMembers { get; set; } = new List<ClubMember>();

    public virtual ICollection<ClubModerator> ClubModeratorAssignedByUsers { get; set; } = new List<ClubModerator>();

    public virtual ICollection<ClubModerator> ClubModeratorUsers { get; set; } = new List<ClubModerator>();

    public virtual ICollection<ClubRequest> ClubRequestRequestedByUsers { get; set; } = new List<ClubRequest>();

    public virtual ICollection<ClubRequest> ClubRequestReviewedByUsers { get; set; } = new List<ClubRequest>();

    public virtual ICollection<Club> Clubs { get; set; } = new List<Club>();

    public virtual ICollection<Comment> CommentAuthors { get; set; } = new List<Comment>();

    public virtual ICollection<Comment> CommentModeratedByUsers { get; set; } = new List<Comment>();

    public virtual ICollection<Event> Events { get; set; } = new List<Event>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Post> PostAuthors { get; set; } = new List<Post>();

    public virtual ICollection<Post> PostModeratedByUsers { get; set; } = new List<Post>();

    public virtual ICollection<PostVote> PostVotes { get; set; } = new List<PostVote>();

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
}
