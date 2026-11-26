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

    private sealed record FileType(string ContentType, bool IsImage, Func<Stream, byte[], bool> Matches);

    private static readonly Dictionary<string, FileType> Supported = new(StringComparer.OrdinalIgnoreCase)
    {
        [".png"] = new("image/png", true, (_, h) => h.AsSpan().StartsWith((ReadOnlySpan<byte>)[0x89, 0x50, 0x4E, 0x47])),
        [".jpg"] = new("image/jpeg", true, IsJpeg),
        [".jpeg"] = new("image/jpeg", true, IsJpeg),
        [".gif"] = new("image/gif", true, (_, h) => h.AsSpan().StartsWith("GIF8"u8)),
        [".webp"] = new("image/webp", true, (_, h) =>
            h.Length > 11 && h.AsSpan().StartsWith("RIFF"u8) && h.AsSpan(8, 4).SequenceEqual("WEBP"u8)),
        [".pdf"] = new("application/pdf", false, (_, h) => h.AsSpan().StartsWith("%PDF"u8)),
        [".docx"] = new(OfficeType + "wordprocessingml.document", false, (s, _) => IsOfficeDocument(s, "word/")),
        [".pptx"] = new(OfficeType + "presentationml.presentation", false, (s, _) => IsOfficeDocument(s, "ppt/")),
        [".xlsx"] = new(OfficeType + "spreadsheetml.sheet", false, (s, _) => IsOfficeDocument(s, "xl/")),
        [".txt"] = new("text/plain", false, (_, h) => !h.Contains((byte)0))
    };

    public static bool IsImage(string extension) =>
        Supported.TryGetValue(extension, out var type) && type.IsImage;

    public static IReadOnlyList<string> AllowedExtensions(FileUploadOptions options) =>
        options.AllowedFileTypes.Length == 0
            ? [.. Supported.Keys]
            :
            [
                .. options.AllowedFileTypes
                    .Select(e => e.ToLowerInvariant())
                    .Where(Supported.ContainsKey)
                    .Distinct()
            ];

    public static async Task<ValidatedFile> ValidateAsync(
        FileUpload file, FileUploadOptions options, bool imageOnly, CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            throw Invalid("The file is empty.");
        }

        if (file.Length > options.EffectiveMaxFileSize)
        {
            throw Invalid($"Files must be {options.EffectiveMaxFileSize / (1024 * 1024)} MB or smaller.");
        }

        var name = SafeDisplayName(file.FileName);
        var extension = Path.GetExtension(name).ToLowerInvariant();
        if (!AllowedExtensions(options).Contains(extension))
        {
            throw Invalid("This file type is not allowed.");
        }

        var type = Supported[extension];
        if (imageOnly && !type.IsImage)
        {
            throw Invalid("Choose a PNG, JPEG, GIF or WebP image.");
        }

        if (!string.IsNullOrEmpty(file.ContentType)
            && !file.ContentType.Equals(GenericContentType, StringComparison.OrdinalIgnoreCase)
            && !file.ContentType.Equals(type.ContentType, StringComparison.OrdinalIgnoreCase))
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
