namespace Hangfire;

public static class AppConfig
{
    public static string AppName => typeof(AppConfig).Assembly.GetName().Name!;
}
