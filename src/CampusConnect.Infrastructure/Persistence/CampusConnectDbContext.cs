using System;
using System.Collections.Generic;
using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Infrastructure.Persistence;

public partial class CampusConnectDbContext : DbContext
{
    public CampusConnectDbContext(DbContextOptions<CampusConnectDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Announcement> Announcements { get; set; }

    public virtual DbSet<Attachment> Attachments { get; set; }

    public virtual DbSet<Bookmark> Bookmarks { get; set; }

    public virtual DbSet<Club> Clubs { get; set; }

    public virtual DbSet<ClubCategory> ClubCategories { get; set; }

    public virtual DbSet<ClubMember> ClubMembers { get; set; }

    public virtual DbSet<ClubModerator> ClubModerators { get; set; }

    public virtual DbSet<ClubRequest> ClubRequests { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Post> Posts { get; set; }

    public virtual DbSet<PostVote> PostVotes { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.HasIndex(e => new { e.IsDeleted, e.IsPublished, e.PublishedAtUtc }, "IX_Announcements_Publication").IsDescending(false, false, true);

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Announcements_CreatedAtUtc");
            entity.Property(e => e.LinkLabel).HasMaxLength(100);
            entity.Property(e => e.LinkUrl).HasMaxLength(2048);
            entity.Property(e => e.Priority).HasDefaultValue((byte)1, "DF_Announcements_Priority");
            entity.Property(e => e.PublishedAtUtc).HasPrecision(3);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Author).WithMany(p => p.Announcements)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Announcements_Author");
        });

        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasIndex(e => e.AnnouncementId, "IX_Attachments_AnnouncementId");

            entity.HasIndex(e => e.EventId, "IX_Attachments_EventId");

            entity.HasIndex(e => e.PostId, "IX_Attachments_PostId");

            entity.HasIndex(e => new { e.UploadedByUserId, e.IsDeleted }, "IX_Attachments_UploadedByUserId");

            entity.HasIndex(e => e.StoredFileName, "UQ_Attachments_StoredFileName").IsUnique();

            entity.HasIndex(e => e.ObjectKey, "UX_Attachments_ObjectKey").IsUnique();

            entity.Property(e => e.ContentType).HasMaxLength(100);
            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Attachments_CreatedAtUtc");
            entity.Property(e => e.FileExtension).HasMaxLength(10);
            entity.Property(e => e.ObjectKey).HasMaxLength(300);
            entity.Property(e => e.OriginalFileName).HasMaxLength(255);
            entity.Property(e => e.StorageProvider).HasMaxLength(20);
            entity.Property(e => e.StoredFileName).HasMaxLength(100);
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Announcement).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.AnnouncementId)
                .HasConstraintName("FK_Attachments_Announcements");

            entity.HasOne(d => d.Event).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.EventId)
                .HasConstraintName("FK_Attachments_Events");

            entity.HasOne(d => d.Post).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.PostId)
                .HasConstraintName("FK_Attachments_Posts");

            entity.HasOne(d => d.UploadedByUser).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.UploadedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attachments_UploadedByUser");
        });

        modelBuilder.Entity<Bookmark>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.PostId });

            entity.HasIndex(e => e.PostId, "IX_Bookmarks_PostId");

            entity.HasIndex(e => new { e.UserId, e.CreatedAtUtc }, "IX_Bookmarks_UserId_CreatedAtUtc").IsDescending(false, true);

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Bookmarks_CreatedAtUtc");

            entity.HasOne(d => d.Post).WithMany(p => p.Bookmarks)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bookmarks_Posts");

            entity.HasOne(d => d.User).WithMany(p => p.Bookmarks)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bookmarks_Users");
        });

        modelBuilder.Entity<Club>(entity =>
        {
            entity.HasIndex(e => new { e.CategoryId, e.Status }, "IX_Clubs_CategoryId_Status");

            entity.HasIndex(e => e.Name, "UQ_Clubs_Name").IsUnique();

            entity.HasIndex(e => e.Slug, "UQ_Clubs_Slug").IsUnique();

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Clubs_CreatedAtUtc");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(80);
            entity.Property(e => e.Rules).HasMaxLength(2000);
            entity.Property(e => e.Slug).HasMaxLength(100);
            entity.Property(e => e.Status).HasDefaultValue((byte)1, "DF_Clubs_Status");
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Category).WithMany(p => p.Clubs)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Clubs_ClubCategories");

            entity.HasOne(d => d.CoverFile).WithMany(p => p.ClubCoverFiles)
                .HasForeignKey(d => d.CoverFileId)
                .HasConstraintName("FK_Clubs_CoverFile");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Clubs)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Clubs_CreatedByUser");

            entity.HasOne(d => d.LogoFile).WithMany(p => p.ClubLogoFiles)
                .HasForeignKey(d => d.LogoFileId)
                .HasConstraintName("FK_Clubs_LogoFile");
        });

        modelBuilder.Entity<ClubCategory>(entity =>
        {
            entity.HasIndex(e => e.Name, "UQ_ClubCategories_Name").IsUnique();

            entity.Property(e => e.IconKey).HasMaxLength(30);
            entity.Property(e => e.Name).HasMaxLength(60);
        });

        modelBuilder.Entity<ClubMember>(entity =>
        {
            entity.HasKey(e => new { e.ClubId, e.UserId });

            entity.HasIndex(e => e.UserId, "IX_ClubMembers_UserId");

            entity.Property(e => e.JoinedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_ClubMembers_JoinedAtUtc");

            entity.HasOne(d => d.Club).WithMany(p => p.ClubMembers)
                .HasForeignKey(d => d.ClubId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubMembers_Clubs");

            entity.HasOne(d => d.User).WithMany(p => p.ClubMembers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubMembers_Users");
        });

        modelBuilder.Entity<ClubModerator>(entity =>
        {
            entity.HasKey(e => new { e.ClubId, e.UserId });

            entity.HasIndex(e => e.UserId, "IX_ClubModerators_UserId");

            entity.Property(e => e.AssignedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_ClubModerators_AssignedAtUtc");

            entity.HasOne(d => d.AssignedByUser).WithMany(p => p.ClubModeratorAssignedByUsers)
                .HasForeignKey(d => d.AssignedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubModerators_AssignedByUser");

            entity.HasOne(d => d.Club).WithMany(p => p.ClubModerators)
                .HasForeignKey(d => d.ClubId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubModerators_Clubs");

            entity.HasOne(d => d.User).WithMany(p => p.ClubModeratorUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubModerators_Users");
        });

        modelBuilder.Entity<ClubRequest>(entity =>
        {
            entity.HasIndex(e => e.RequestedByUserId, "IX_ClubRequests_RequestedByUserId");

            entity.HasIndex(e => new { e.Status, e.CreatedAtUtc }, "IX_ClubRequests_Status_CreatedAtUtc").IsDescending(false, true);

            entity.HasIndex(e => e.ProposedName, "UX_ClubRequests_PendingName")
                .IsUnique()
                .HasFilter("([Status]=(1))");

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_ClubRequests_CreatedAtUtc");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Justification).HasMaxLength(1000);
            entity.Property(e => e.ProposedName).HasMaxLength(80);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.ReviewedAtUtc).HasPrecision(3);
            entity.Property(e => e.Status).HasDefaultValue((byte)1, "DF_ClubRequests_Status");
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Category).WithMany(p => p.ClubRequests)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubRequests_ClubCategories");

            entity.HasOne(d => d.CreatedClub).WithMany(p => p.ClubRequests)
                .HasForeignKey(d => d.CreatedClubId)
                .HasConstraintName("FK_ClubRequests_CreatedClub");

            entity.HasOne(d => d.RequestedByUser).WithMany(p => p.ClubRequestRequestedByUsers)
                .HasForeignKey(d => d.RequestedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClubRequests_RequestedByUser");

            entity.HasOne(d => d.ReviewedByUser).WithMany(p => p.ClubRequestReviewedByUsers)
                .HasForeignKey(d => d.ReviewedByUserId)
                .HasConstraintName("FK_ClubRequests_ReviewedByUser");
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasIndex(e => e.AuthorId, "IX_Comments_AuthorId");

            entity.HasIndex(e => e.ParentCommentId, "IX_Comments_ParentCommentId");

            entity.HasIndex(e => new { e.PostId, e.CreatedAtUtc }, "IX_Comments_PostId_CreatedAtUtc");

            entity.Property(e => e.Body).HasMaxLength(4000);
            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Comments_CreatedAtUtc");
            entity.Property(e => e.EditedAtUtc).HasPrecision(3);
            entity.Property(e => e.Status).HasDefaultValue((byte)1, "DF_Comments_Status");
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Author).WithMany(p => p.CommentAuthors)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comments_Author");

            entity.HasOne(d => d.ModeratedByUser).WithMany(p => p.CommentModeratedByUsers)
                .HasForeignKey(d => d.ModeratedByUserId)
                .HasConstraintName("FK_Comments_ModeratedByUser");

            entity.HasOne(d => d.ParentComment).WithMany(p => p.InverseParentComment)
                .HasForeignKey(d => d.ParentCommentId)
                .HasConstraintName("FK_Comments_ParentComment");

            entity.HasOne(d => d.Post).WithMany(p => p.Comments)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comments_Posts");
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasIndex(e => e.StartsAtUtc, "IX_Events_StartsAtUtc");

            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Events_CreatedAtUtc");
            entity.Property(e => e.Description).HasMaxLength(4000);
            entity.Property(e => e.EndsAtUtc).HasPrecision(0);
            entity.Property(e => e.StartsAtUtc).HasPrecision(0);
            entity.Property(e => e.Status).HasDefaultValue((byte)1, "DF_Events_Status");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);
            entity.Property(e => e.Venue).HasMaxLength(200);

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Events)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Events_CreatedByUser");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(e => new { e.RecipientUserId, e.IsRead, e.CreatedAtUtc }, "IX_Notifications_Recipient").IsDescending(false, false, true);

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Notifications_CreatedAtUtc");
            entity.Property(e => e.LinkPath).HasMaxLength(200);
            entity.Property(e => e.Message).HasMaxLength(300);

            entity.HasOne(d => d.RecipientUser).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.RecipientUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_Recipient");
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasIndex(e => new { e.AuthorId, e.CreatedAtUtc }, "IX_Posts_AuthorId").IsDescending(false, true);

            entity.HasIndex(e => new { e.ClubId, e.Status, e.CreatedAtUtc }, "IX_Posts_ClubId_Status_CreatedAtUtc").IsDescending(false, false, true);

            entity.HasIndex(e => new { e.Status, e.CreatedAtUtc }, "IX_Posts_Status_CreatedAtUtc").IsDescending(false, true);

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Posts_CreatedAtUtc");
            entity.Property(e => e.EditedAtUtc).HasPrecision(3);
            entity.Property(e => e.LinkUrl).HasMaxLength(2048);
            entity.Property(e => e.ModerationReason).HasMaxLength(500);
            entity.Property(e => e.Status).HasDefaultValue((byte)1, "DF_Posts_Status");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Author).WithMany(p => p.PostAuthors)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Posts_Author");

            entity.HasOne(d => d.Club).WithMany(p => p.Posts)
                .HasForeignKey(d => d.ClubId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Posts_Clubs");

            entity.HasOne(d => d.ModeratedByUser).WithMany(p => p.PostModeratedByUsers)
                .HasForeignKey(d => d.ModeratedByUserId)
                .HasConstraintName("FK_Posts_ModeratedByUser");
        });

        modelBuilder.Entity<PostVote>(entity =>
        {
            entity.HasKey(e => new { e.PostId, e.UserId });

            entity.HasIndex(e => e.UserId, "IX_PostVotes_UserId");

            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_PostVotes_CreatedAtUtc");
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.Post).WithMany(p => p.PostVotes)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PostVotes_Posts");

            entity.HasOne(d => d.User).WithMany(p => p.PostVotes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PostVotes_Users");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.Name, "UQ_Roles_Name").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(30);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.FullName, "IX_Users_FullName");

            entity.HasIndex(e => e.Email, "UQ_Users_Email").IsUnique();

            entity.HasIndex(e => e.RegistrationNumber, "UX_Users_RegistrationNumber")
                .IsUnique()
                .HasFilter("([RegistrationNumber] IS NOT NULL)");

            entity.Property(e => e.Bio).HasMaxLength(500);
            entity.Property(e => e.CreatedAtUtc)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Users_CreatedAtUtc");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_Users_IsActive");
            entity.Property(e => e.LastLoginAtUtc).HasPrecision(3);
            entity.Property(e => e.LockoutEndsAtUtc).HasPrecision(3);
            entity.Property(e => e.PasswordHash).HasMaxLength(256);
            entity.Property(e => e.RegistrationNumber).HasMaxLength(30);
            entity.Property(e => e.SecurityStamp).HasDefaultValueSql("(newid())", "DF_Users_SecurityStamp");
            entity.Property(e => e.Title).HasMaxLength(60);
            entity.Property(e => e.UpdatedAtUtc).HasPrecision(3);

            entity.HasOne(d => d.AvatarFile).WithMany(p => p.Users)
                .HasForeignKey(d => d.AvatarFileId)
                .HasConstraintName("FK_Users_AvatarFile");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRole",
                    r => r.HasOne<Role>().WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_UserRoles_Roles"),
                    l => l.HasOne<User>().WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_UserRoles_Users"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId");
                        j.ToTable("UserRoles");
                        j.HasIndex(new[] { "RoleId" }, "IX_UserRoles_RoleId");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
