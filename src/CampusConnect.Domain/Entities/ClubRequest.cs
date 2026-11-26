using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class ClubRequest
{
    public int Id { get; set; }

    public int RequestedByUserId { get; set; }

    public int CategoryId { get; set; }

    public string ProposedName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Justification { get; set; } = null!;

    public byte Status { get; set; }

    public string? RejectionReason { get; set; }

    public int? ReviewedByUserId { get; set; }

    public DateTime? ReviewedAtUtc { get; set; }

    public int? CreatedClubId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public virtual ClubCategory Category { get; set; } = null!;

    public virtual Club? CreatedClub { get; set; }

    public virtual User RequestedByUser { get; set; } = null!;

    public virtual User? ReviewedByUser { get; set; }
}
