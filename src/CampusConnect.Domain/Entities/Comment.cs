using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Comment
{
    public int Id { get; set; }

    public int PostId { get; set; }

    public int AuthorId { get; set; }

    public int? ParentCommentId { get; set; }

    public string Body { get; set; } = null!;

    public byte Status { get; set; }

    public int? ModeratedByUserId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public DateTime? EditedAtUtc { get; set; }

    public int? RootCommentId { get; set; }

    public virtual User Author { get; set; } = null!;

    public virtual ICollection<CommentVote> CommentVotes { get; set; } = new List<CommentVote>();

    public virtual ICollection<Comment> InverseParentComment { get; set; } = new List<Comment>();

    public virtual ICollection<Comment> InverseRootComment { get; set; } = new List<Comment>();

    public virtual User? ModeratedByUser { get; set; }

    public virtual Comment? ParentComment { get; set; }

    public virtual Post Post { get; set; } = null!;

    public virtual Comment? RootComment { get; set; }

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
