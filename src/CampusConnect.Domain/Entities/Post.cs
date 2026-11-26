using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Post
{
    public int Id { get; set; }

    public int ClubId { get; set; }

    public int AuthorId { get; set; }

    public byte Type { get; set; }

    public string Title { get; set; } = null!;

    public string? Body { get; set; }

    public string? LinkUrl { get; set; }

    public byte Status { get; set; }

    public bool IsPinned { get; set; }

    public int? ModeratedByUserId { get; set; }

    public string? ModerationReason { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public DateTime? EditedAtUtc { get; set; }

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual User Author { get; set; } = null!;

    public virtual ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();

    public virtual Club Club { get; set; } = null!;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual User? ModeratedByUser { get; set; }

    public virtual ICollection<PostVote> PostVotes { get; set; } = new List<PostVote>();
}
