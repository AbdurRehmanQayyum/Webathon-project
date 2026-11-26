using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Common.Models;

public record PageQuery
{
    public const int MaxPageSize = 100;

    public int PageNumber { get; init => field = Math.Max(value, 1); } = 1;
    public int PageSize { get; init => field = Math.Clamp(value, 1, MaxPageSize); } = 10;
    public string? Search { get; init => field = string.IsNullOrWhiteSpace(value) ? null : value.Trim(); }
}

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int PageNumber, int PageSize, int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

// Pagination
public static class PagingExtensions
{
    public static Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, PageQuery page, CancellationToken cancellationToken) =>
        query.ToPagedResultAsync(page, items => items, cancellationToken);

    // Counts the source and projects only the requested page
    public static async Task<PagedResult<TResult>> ToPagedResultAsync<TSource, TResult>(
        this IQueryable<TSource> query,
        PageQuery page,
        Func<IQueryable<TSource>, IQueryable<TResult>> project,
        CancellationToken cancellationToken)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var window = query.Skip((page.PageNumber - 1) * page.PageSize).Take(page.PageSize);
        var items = await project(window).ToListAsync(cancellationToken);

        return new PagedResult<TResult>(items, page.PageNumber, page.PageSize, totalCount);
    }
}
