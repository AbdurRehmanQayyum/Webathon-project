using System.IO.Compression;
using CampusConnect.Application.Common.Exceptions;

namespace CampusConnect.Application.Features.Files;

public sealed record ValidatedFile(string DisplayName, string Extension, string ContentType);

// Safe upload validation: size, extension, declared MIME type and file signature.
// Executables and SVG are never accepted because they have no entry here.
public static class FileValidation
{
    private const string Field = "file";
    private const int HeaderLength = 4096;
    private const string GenericContentType = "application/octet-stream";
    private const string OfficeType = "application/vnd.openxmlformats-officedocument.";

    private sealed record FileType(
        string ContentType, FileKind Kind, Func<Stream, byte[], bool> Matches, string[]? Aliases = null);

    private static readonly Dictionary<string, FileType> Supported = new(StringComparer.OrdinalIgnoreCase)
    {
        [".png"] = new("image/png", FileKind.Image,
            (_, h) => h.AsSpan().StartsWith((ReadOnlySpan<byte>)[0x89, 0x50, 0x4E, 0x47])),
        [".jpg"] = new("image/jpeg", FileKind.Image, IsJpeg),
        [".jpeg"] = new("image/jpeg", FileKind.Image, IsJpeg),
        [".gif"] = new("image/gif", FileKind.Image, (_, h) => h.AsSpan().StartsWith("GIF8"u8)),
        [".webp"] = new("image/webp", FileKind.Image, (_, h) => IsRiff(h, "WEBP"u8)),
        [".mp4"] = new("video/mp4", FileKind.Video, IsIsoMedia),
        [".webm"] = new("video/webm", FileKind.Video,
            (_, h) => h.AsSpan().StartsWith((ReadOnlySpan<byte>)[0x1A, 0x45, 0xDF, 0xA3]), ["audio/webm"]),
        [".mp3"] = new("audio/mpeg", FileKind.Audio, IsMp3, ["audio/mp3"]),
        [".wav"] = new("audio/wav", FileKind.Audio, (_, h) => IsRiff(h, "WAVE"u8),
            ["audio/x-wav", "audio/wave"]),
        [".ogg"] = new("audio/ogg", FileKind.Audio, (_, h) => h.AsSpan().StartsWith("OggS"u8),
            ["application/ogg", "video/ogg"]),
        [".m4a"] = new("audio/mp4", FileKind.Audio, IsIsoMedia, ["audio/x-m4a", "audio/m4a"]),
        [".pdf"] = new("application/pdf", FileKind.Document, (_, h) => h.AsSpan().StartsWith("%PDF"u8)),
        [".docx"] = new(OfficeType + "wordprocessingml.document", FileKind.Document,
            (s, _) => IsOfficeDocument(s, "word/")),
        [".pptx"] = new(OfficeType + "presentationml.presentation", FileKind.Document,
            (s, _) => IsOfficeDocument(s, "ppt/")),
        [".xlsx"] = new(OfficeType + "spreadsheetml.sheet", FileKind.Document,
            (s, _) => IsOfficeDocument(s, "xl/")),
        [".txt"] = new("text/plain", FileKind.Document, (_, h) => !h.Contains((byte)0))
    };

    public static bool IsImage(string extension) =>
        Supported.TryGetValue(extension, out var type) && type.Kind == FileKind.Image;

    // Types a browser can show safely in place
    public static bool IsPreviewable(string extension) =>
        Supported.TryGetValue(extension, out var type)
        && (type.Kind != FileKind.Document || extension is ".pdf" or ".txt");

    public static IReadOnlyList<FileTypeDto> AllowedTypes(FileUploadOptions options)
    {
        var allowed = options.AllowedFileTypes.Length == 0
            ? Supported.Keys.AsEnumerable()
            : options.AllowedFileTypes.Select(e => e.ToLowerInvariant()).Where(Supported.ContainsKey).Distinct();

        return
        [
            .. allowed.Select(extension => new FileTypeDto(
                extension, Supported[extension].Kind, options.LimitFor(Supported[extension].Kind)))
        ];
    }

    public static async Task<ValidatedFile> ValidateAsync(
        FileUpload file, FileUploadOptions options, bool imageOnly, CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            throw Invalid("The file is empty.");
        }

        var name = SafeDisplayName(file.FileName);
        var extension = Path.GetExtension(name).ToLowerInvariant();
        if (AllowedTypes(options).All(t => t.Extension != extension))
        {
            throw Invalid("This file type is not allowed.");
        }

        var type = Supported[extension];
        if (imageOnly && type.Kind != FileKind.Image)
        {
            throw Invalid("Choose a PNG, JPEG, GIF or WebP image.");
        }

        var limit = options.LimitFor(type.Kind);
        if (file.Length > limit)
        {
            var kind = type.Kind.ToString().ToLowerInvariant();
            throw Invalid($"The {kind} limit is {limit / (1024 * 1024)} MB.");
        }

        var declared = file.ContentType?.Split(';')[0].Trim();
        if (!string.IsNullOrEmpty(declared)
            && !declared.Equals(GenericContentType, StringComparison.OrdinalIgnoreCase)
            && !declared.Equals(type.ContentType, StringComparison.OrdinalIgnoreCase)
            && type.Aliases?.Contains(declared, StringComparer.OrdinalIgnoreCase) != true)
        {
            throw Invalid("The file type does not match its extension.");
        }

        var buffer = new byte[HeaderLength];
        var read = await file.Content.ReadAtLeastAsync(buffer, HeaderLength, false, cancellationToken);
        file.Content.Position = 0;

        var matches = type.Matches(file.Content, buffer[..read]);
        file.Content.Position = 0;

        return matches
            ? new ValidatedFile(name, extension, type.ContentType)
            : throw Invalid("The file content does not match its extension.");
    }

    private static string SafeDisplayName(string fileName)
    {
        var name = Path.GetFileName(fileName.Replace('\\', '/'));
        name = new string([.. name.Where(c => !char.IsControl(c))]);
        return name.Length <= 255 ? name : name[^255..];
    }

    private static bool IsJpeg(Stream stream, byte[] header) =>
        header.AsSpan().StartsWith((ReadOnlySpan<byte>)[0xFF, 0xD8, 0xFF]);

    private static bool IsIsoMedia(Stream stream, byte[] header) =>
        header.Length > 11 && header.AsSpan(4, 4).SequenceEqual("ftyp"u8);

    private static bool IsMp3(Stream stream, byte[] header) =>
        header.AsSpan().StartsWith("ID3"u8)
        || (header.Length > 1 && header[0] == 0xFF && (header[1] & 0xE0) == 0xE0);

    private static bool IsRiff(byte[] header, ReadOnlySpan<byte> format) =>
        header.Length > 11 && header.AsSpan().StartsWith("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual(format);

    private static bool IsOfficeDocument(Stream content, string folder)
    {
        try
        {
            using var archive = new ZipArchive(content, ZipArchiveMode.Read, leaveOpen: true);
            return archive.GetEntry("[Content_Types].xml") is not null
                && archive.Entries.Any(e => e.FullName.StartsWith(folder, StringComparison.Ordinal))
                && !archive.Entries.Any(e => e.Name.Equals("vbaProject.bin", StringComparison.OrdinalIgnoreCase));
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private static RequestValidationException Invalid(string message) => new(Field, message);
}
