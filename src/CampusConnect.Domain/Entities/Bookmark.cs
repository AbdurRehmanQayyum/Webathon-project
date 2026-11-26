using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Bookmark
{
    public int UserId { get; set; }

    public int PostId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public virtual Post Post { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
