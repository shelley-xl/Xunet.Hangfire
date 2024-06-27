# Xunet.Hangfire

Timing scheduling library based on hangfire for .NET

Support .NET 6.0/7.0/8.0

[![Nuget](https://img.shields.io/nuget/v/Xunet.Hangfire.svg?style=flat-square)](https://www.nuget.org/packages/Xunet.Hangfire)
[![Downloads](https://img.shields.io/nuget/dt/Xunet.Hangfire.svg?style=flat-square)](https://www.nuget.org/stats/packages/Xunet.Hangfire?groupby=Version)
[![License](https://img.shields.io/github/license/shelley-xl/Xunet.Hangfire.svg)](https://github.com/shelley-xl/Xunet.Hangfire/blob/master/LICENSE)
![Vistors](https://visitor-badge.laobi.icu/badge?page_id=https://github.com/shelley-xl/Xunet.Hangfire)

## 安装

使用NuGet Package 控制台窗口安装它：

```
PM> Install-Package Xunet.Hangfire
```

## 使用

Program.cs

```c#
var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (connectionString == null) throw new ArgumentNullException(nameof(connectionString));

var sqlOptions = new MySqlStorageOptions()
{
    TablesPrefix = "Hangfire_"
};
var storage = new MySqlStorage(connectionString, sqlOptions);

builder.Services.AddHangfire((a, x) =>
{
    x.UseStorage(storage: storage).WithJobExpirationTimeout(timeout: TimeSpan.FromDays(7));
    x.UseConsole();
    x.UseHeartbeatPage(checkInterval: TimeSpan.FromSeconds(2));
    x.UseTagsWithMySql(sqlOptions: sqlOptions);
    x.UseRecurringJobAdmin(Assembly.GetExecutingAssembly());
});

builder.Services.AddHangfireServer(optionsAction: (provider, options) =>
{
    options.WorkerCount = 40;
    options.Queues = ["default"];
}
, storage: storage, additionalProcesses: new[]
{
    new ProcessMonitor(checkInterval: TimeSpan.FromSeconds(2))
});

var app = builder.Build();

app.MapHangfireDashboard(string.Empty, new DashboardOptions
{
    IsReadOnlyFunc = _ => false,
    DashboardTitle = "定时任务"
});

app.Run();
```

appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Kestrel": {
    "Endpoints": {
      "http": {
        "Url": "http://0.0.0.0:8888"
      }
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "server=127.0.0.1;uid=root;pwd=root;database=hangfire;Allow User Variables=True;"
  }
}
```