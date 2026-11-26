using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Notification
{
    public int Id { get; set; }

    public int RecipientUserId { get; set; }

    public byte Type { get; set; }

    public string Message { get; set; } = null!;

    public string LinkPath { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public int? ActorUserId { get; set; }

    public virtual User? ActorUser { get; set; }

    public virtual User RecipientUser { get; set; } = null!;
}
