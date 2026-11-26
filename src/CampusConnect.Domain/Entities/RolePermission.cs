using System;
using System.Collections.Generic;

namespace CampusConnect.Domain.Entities;

public partial class RolePermission
{
    public int RoleId { get; set; }

    public string Permission { get; set; } = null!;

    public virtual Role Role { get; set; } = null!;
}
