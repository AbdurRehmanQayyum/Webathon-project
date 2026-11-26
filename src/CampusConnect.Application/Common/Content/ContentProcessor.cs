using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Common.Content;

public sealed record MentionedUser(int Id, string Username);

public sealed record ProcessedContent(
    string Html,
    IReadOnlyList<MentionedUser> Mentions,
    IReadOnlyList<Tag> Tags)
{
    public bool IsBlank => RichText.ToPlainText(Html).Length == 0;

    // Users mentioned now who were not mentioned in the earlier version
    public IEnumerable<int> NewMentions(string? previousHtml)
    {
        var earlier = RichText.Mentions(RichText.ToPlainText(previousHtml));
        return Mentions
            .Where(m => !earlier.Contains(m.Username, StringComparer.OrdinalIgnoreCase))
            .Select(m => m.Id);
    }
}

public sealed class ContentProcessor(IAppDbContext db)
{
    public const int MaxTags = 8;
    private const int MaxMentions = 10;

    public async Task<ProcessedContent> ProcessAsync(
        string? rawHtml,
        string field,
        int maxLength,
        IReadOnlyList<string>? extraTags,
        CancellationToken cancellationToken)
    {
        var html = RichText.Sanitize(rawHtml);
        var text = RichText.ToPlainText(html);
        if (text.Length > maxLength)
        {
            throw new RequestValidationException(field, $"Keep the text under {maxLength:N0} characters.");
        }

        var handles = RichText.Mentions(text).Take(MaxMentions).ToList();
        var users = await db.Users.AsNoTracking()
            .Where(u => u.IsActive && handles.Contains(u.Username))
            .Select(u => new { u.Id, u.Username })
            .ToListAsync(cancellationToken);

        var tagNames = (extraTags ?? [])
            .Select(tag => tag.Trim().TrimStart('#').ToLowerInvariant())
            .Where(RichText.IsValidTag)
            .Concat(RichText.Tags(text))
            .Distinct()
            .Take(MaxTags)
            .ToList();
        var tags = await db.Tags.Where(t => tagNames.Contains(t.Name)).ToListAsync(cancellationToken);
        foreach (var name in tagNames.Except(tags.Select(t => t.Name), StringComparer.OrdinalIgnoreCase).ToList())
        {
            var tag = new Tag { Name = name };
            db.Tags.Add(tag);
            tags.Add(tag);
        }

        var decorated = html.Length == 0
            ? html
            : RichText.Decorate(
                html, users.ToDictionary(u => u.Username, u => u.Id, StringComparer.OrdinalIgnoreCase));

        return new ProcessedContent(decorated, [.. users.Select(u => new MentionedUser(u.Id, u.Username))], tags);
    }
}
