using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class ClubModerator
{
    public int ClubId { get; set; }

    public int UserId { get; set; }

    public int AssignedByUserId { get; set; }

    public DateTime AssignedAtUtc { get; set; }

    public virtual User AssignedByUser { get; set; } = null!;

    public virtual Club Club { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
