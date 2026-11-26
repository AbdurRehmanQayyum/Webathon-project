using System.Net;
using System.Text.RegularExpressions;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using Ganss.Xss;

namespace CampusConnect.Application.Common.Content;

// Server-side authority for rich text: sanitising, previews, mentions and tags
public static partial class RichText
{
    private static readonly string[] AllowedTags =
    [
        "p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li",
        "blockquote", "code", "pre", "a", "hr", "span"
    ];

    private static readonly HtmlSanitizer Sanitizer = CreateSanitizer();

    public static string Sanitize(string? html) =>
        string.IsNullOrWhiteSpace(html) ? string.Empty : Sanitizer.Sanitize(html).Trim();

    public static string ToPlainText(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var spaced = BlockEnd().Replace(html, "$0\n");
        var text = new HtmlParser().ParseDocument(spaced).Body?.TextContent ?? string.Empty;
        return BlankLines().Replace(text.Replace(' ', ' '), "\n").Trim();
    }

    public static string? Preview(string? html, int limit)
    {
        if (html is null)
        {
            return null;
        }

        var text = ToPlainText(html);
        return text.Length <= limit ? text : $"{text[..limit].TrimEnd()}…";
    }

    public static string FromPlainText(string text)
    {
        var encoded = WebUtility.HtmlEncode(text.Replace("\r\n", "\n").Trim());
        return $"<p>{encoded.Replace("\n\n", "</p><p>").Replace("\n", "<br>")}</p>";
    }

    public static IReadOnlyList<string> Mentions(string plainText) =>
    [
        .. MentionPattern().Matches(plainText)
            .Select(m => m.Groups[1].Value.TrimEnd('.').ToLowerInvariant())
            .Distinct()
    ];

    public static IReadOnlyList<string> Tags(string plainText) =>
    [
        .. TagPattern().Matches(plainText).Select(m => m.Groups[1].Value.ToLowerInvariant()).Distinct()
    ];

    public static bool IsValidTag(string name) => TagName().IsMatch(name);

    // Turns known @mentions and #tags into internal links
    public static string Decorate(string html, IReadOnlyDictionary<string, int> userIdsByName)
    {
        var document = new HtmlParser().ParseDocument(html);
        var body = document.Body!;
        var textNodes = body.Descendants<IText>()
            .Where(node => !HasAncestor(node, "a", "code", "pre"))
            .ToList();

        foreach (var node in textNodes)
        {
            var text = node.Data;
            var replacements = new List<INode>();
            var position = 0;

            foreach (Match match in LinkablePattern().Matches(text))
            {
                var value = match.Value.TrimEnd('.');
                var name = value[1..].ToLowerInvariant();
                var href = value[0] == '#'
                    ? $"/search?q=%23{name}"
                    : userIdsByName.TryGetValue(name, out var userId) ? $"/users/{userId}" : null;
                if (href is null)
                {
                    continue;
                }

                replacements.Add(document.CreateTextNode(text[position..match.Index]));
                var anchor = document.CreateElement("a");
                anchor.SetAttribute("href", href);
                anchor.TextContent = value;
                replacements.Add(anchor);
                position = match.Index + value.Length;
            }

            if (replacements.Count == 0)
            {
                continue;
            }

            replacements.Add(document.CreateTextNode(text[position..]));
            foreach (var replacement in replacements)
            {
                node.Parent!.InsertBefore(replacement, node);
            }

            node.Parent!.RemoveChild(node);
        }

        return body.InnerHtml.Trim();
    }

    private static bool HasAncestor(INode node, params string[] names)
    {
        for (var parent = node.ParentElement; parent is not null; parent = parent.ParentElement)
        {
            if (names.Contains(parent.LocalName))
            {
                return true;
            }
        }

        return false;
    }

    private static HtmlSanitizer CreateSanitizer()
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.UnionWith(AllowedTags);
        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.Add("href");
        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedAtRules.Clear();
        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.UnionWith(["http", "https", "mailto"]);
        sanitizer.PostProcessNode += (_, args) =>
        {
            if (args.Node is not IElement { LocalName: "a" } anchor || anchor.GetAttribute("href") is not { } href)
            {
                return;
            }

            if (Uri.TryCreate(href, UriKind.Absolute, out var uri) && !uri.IsFile)
            {
                anchor.SetAttribute("target", "_blank");
                anchor.SetAttribute("rel", "noopener noreferrer nofollow");
            }
            else if (!InternalLink().IsMatch(href))
            {
                anchor.RemoveAttribute("href");
            }
        };

        return sanitizer;
    }

    [GeneratedRegex(@"</(p|li|h2|h3|blockquote|pre)>|<br\s*/?>", RegexOptions.IgnoreCase)]
    private static partial Regex BlockEnd();

    [GeneratedRegex(@"\n\s*\n+")]
    private static partial Regex BlankLines();

    [GeneratedRegex(@"(?<![A-Za-z0-9._@/])@([A-Za-z0-9._]{3,40})")]
    private static partial Regex MentionPattern();

    [GeneratedRegex(@"(?<![A-Za-z0-9_#&/])#([A-Za-z][A-Za-z0-9_-]{1,29})")]
    private static partial Regex TagPattern();

    [GeneratedRegex(@"(?<![A-Za-z0-9._@/#&])@[A-Za-z0-9._]{3,40}|(?<![A-Za-z0-9_#&/@])#[A-Za-z][A-Za-z0-9_-]{1,29}")]
    private static partial Regex LinkablePattern();

    [GeneratedRegex(@"^[a-z][a-z0-9_-]{1,29}$")]
    private static partial Regex TagName();

    [GeneratedRegex(@"^/(users/\d+|search\?q=%23[a-z0-9_-]+)$")]
    private static partial Regex InternalLink();
}
