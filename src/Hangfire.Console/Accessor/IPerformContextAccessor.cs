using Hangfire.Server;

namespace Hangfire.Console.Accessor;

public interface IPerformContextAccessor
{
    PerformContext PerformingContext { get; set; }
}
