using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class Club
{
    public int Id { get; set; }

    public int CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? Rules { get; set; }

    public byte Status { get; set; }

    public int CreatedByUserId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public int? LogoFileId { get; set; }

    public int? CoverFileId { get; set; }

    public virtual ClubCategory Category { get; set; } = null!;

    public virtual ICollection<ClubMember> ClubMembers { get; set; } = new List<ClubMember>();

    public virtual ICollection<ClubModerator> ClubModerators { get; set; } = new List<ClubModerator>();

    public virtual ICollection<ClubRequest> ClubRequests { get; set; } = new List<ClubRequest>();

    public virtual Attachment? CoverFile { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual Attachment? LogoFile { get; set; }

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
}
