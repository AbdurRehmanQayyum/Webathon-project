using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Event
{
    public int Id { get; set; }

    public int CreatedByUserId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Venue { get; set; } = null!;

    public byte Category { get; set; }

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }

    public byte Status { get; set; }

    public string? CancellationReason { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual User CreatedByUser { get; set; } = null!;
}
