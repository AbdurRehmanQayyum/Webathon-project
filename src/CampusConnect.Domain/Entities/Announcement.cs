using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Announcement
{
    public int Id { get; set; }

    public int AuthorId { get; set; }

    public string Title { get; set; } = null!;

    public string Body { get; set; } = null!;

    public string? LinkUrl { get; set; }

    public string? LinkLabel { get; set; }

    public byte Priority { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? PublishedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual User Author { get; set; } = null!;
}
