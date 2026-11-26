using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Attachment
{
    public int Id { get; set; }

    public int UploadedByUserId { get; set; }

    public int? PostId { get; set; }

    public int? AnnouncementId { get; set; }

    public string OriginalFileName { get; set; } = null!;

    public string StoredFileName { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public long FileSize { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public string ObjectKey { get; set; } = null!;

    public string FileExtension { get; set; } = null!;

    public string StorageProvider { get; set; } = null!;

    public byte Purpose { get; set; }

    public int? EventId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Announcement? Announcement { get; set; }

    public virtual ICollection<Club> ClubCoverFiles { get; set; } = new List<Club>();

    public virtual ICollection<Club> ClubLogoFiles { get; set; } = new List<Club>();

    public virtual Event? Event { get; set; }

    public virtual Post? Post { get; set; }

    public virtual User UploadedByUser { get; set; } = null!;

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
