using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class ClubMember
{
    public int ClubId { get; set; }

    public int UserId { get; set; }

    public DateTime JoinedAtUtc { get; set; }

    public virtual Club Club { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
