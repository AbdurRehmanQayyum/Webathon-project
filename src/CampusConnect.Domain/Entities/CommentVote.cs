using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class CommentVote
{
    public int CommentId { get; set; }

    public int UserId { get; set; }

    public short Value { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public virtual Comment Comment { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
