using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class ClubCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string IconKey { get; set; } = null!;

    public int SortOrder { get; set; }

    public virtual ICollection<ClubRequest> ClubRequests { get; set; } = new List<ClubRequest>();

    public virtual ICollection<Club> Clubs { get; set; } = new List<Club>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
