# Xunet.Hangfire

Timing scheduling library based on hangfire for .NET

Support .NET 6.0、.NET 7.0、.NET 8.0

[![Nuget](https://img.shields.io/nuget/v/Xunet.Hangfire.svg?style=flat-square)](https://www.nuget.org/packages/Xunet.Hangfire)
[![Downloads](https://img.shields.io/nuget/dt/Xunet.Hangfire.svg?style=flat-square)](https://www.nuget.org/stats/packages/Xunet.Hangfire?groupby=Version)
[![License](https://img.shields.io/github/license/shelley-xl/Xunet.Hangfire.svg)](https://github.com/shelley-xl/Xunet.Hangfire/blob/master/LICENSE)
![Vistors](https://visitor-badge.laobi.icu/badge?page_id=https://github.com/shelley-xl/Xunet.Hangfire)

## 安装

Xunet.Hangfire 以 NuGet 包的形式提供。您可以使用 NuGet 包控制台窗口安装它：

```
PM> Install-Package Xunet.Hangfire
```

## 使用

Program.cs

```c#
using Hangfire;
using Hangfire.MySql;
using Hangfire.Console;
using Hangfire.Heartbeat;
using Hangfire.Tags.MySql;
using Hangfire.RecurringJobAdmin;
using Hangfire.Heartbeat.Server;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new ArgumentException("connectionString");

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

WorkService.cs

```c#
public class WorkService(IPerformContextAccessor context)
{
    readonly IPerformContextAccessor _context = context;

    PerformContext Context => _context.PerformingContext;

    [Tag("工作标签")]
    [Queue("default")]
    [JobDisplayName("工作作业")]
    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [15, 30, 60])]
    [RecurringJob("1000", "0 10 * * *", "China Standard Time", "default")]
    public void DoWork()
    {
        Context.WriteLine("work执行开始");

        Thread.Sleep(3000);

        Context.WriteLine("work执行结束");
    }
}
```

## 特性

- 定时作业基础功能：队列作业、延期作业、周期作业

- 服务器心跳检测：显示服务运行状态，包括CPU、内存等

- 数据持久化存储：采用MySqlStorage

- 作业管理功能：添加作业、编辑作业、停止/运行作业

- 作业标签功能：可对作业进行分类、分组管理

- 作业筛选功能：可根据作业编号、名称对作业进行筛选

## 感谢

- [Hangfire](https://github.com/HangfireIO/Hangfire)

- [Hangfire.Console](https://github.com/pieceofsummer/Hangfire.Console)

- [Hangfire.Heartbeat](https://github.com/ahydrax/Hangfire.Heartbeat)

- [Hangfire.MySqlStorage](https://github.com/arnoldasgudas/Hangfire.MySqlStorage)

- [Hangfire.RecurringJobAdmin](https://github.com/bamotav/Hangfire.RecurringJobAdmin)

- [Hangfire.Tags](https://github.com/face-it/Hangfire.Tags)

- [Hangfire.PerformContextAccessor](https://github.com/meriturva/Hangfire.PerformContextAccessor)