using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace CampusConnect.Infrastructure.Security;

public sealed class EncryptionOptions
{
    public const string SectionName = "Encryption";

    public string? Key { get; set; }
}

public interface IFieldCipher
{
    string Encrypt(string value);
    string Decrypt(string value);
}

// AES-256-GCM encryption at rest for user content and personal text
public sealed class AesFieldCipher : IFieldCipher
{
    public const string Prefix = "enc:v1:";
    private const int KeySize = 32;
    private const int NonceSize = 12;
    private const int TagSize = 16;

    private readonly byte[] _key;

    public AesFieldCipher(IOptions<EncryptionOptions> options)
    {
        var configured = options.Value.Key;
        var key = new byte[KeySize];
        if (string.IsNullOrWhiteSpace(configured)
            || !Convert.TryFromBase64String(configured, key, out var length)
            || length != KeySize)
        {
            throw new InvalidOperationException(
                "Encryption:Key must be a base64 encoded 32-byte key. See docs/SETUP.md.");
        }

        _key = key;
    }

    public string Encrypt(string value)
    {
        var plain = Encoding.UTF8.GetBytes(value);
        var payload = new byte[NonceSize + TagSize + plain.Length];
        var nonce = payload.AsSpan(0, NonceSize);
        RandomNumberGenerator.Fill(nonce);

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plain, payload.AsSpan(NonceSize + TagSize), payload.AsSpan(NonceSize, TagSize));
        return Prefix + Convert.ToBase64String(payload);
    }

    // Values written before encryption was enabled are returned as they are
    public string Decrypt(string value)
    {
        if (!value.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return value;
        }

        var payload = Convert.FromBase64String(value[Prefix.Length..]);
        var plain = new byte[payload.Length - NonceSize - TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(
            payload.AsSpan(0, NonceSize),
            payload.AsSpan(NonceSize + TagSize),
            payload.AsSpan(NonceSize, TagSize),
            plain);
        return Encoding.UTF8.GetString(plain);
    }
}
