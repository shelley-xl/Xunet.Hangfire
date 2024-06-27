using Hangfire.Dashboard;
using Hangfire.Dashboard.Pages;
using Hangfire.RecurringJobAdmin.Core;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Hangfire.RecurringJobAdmin.Pages
{
    internal sealed class JobExtensionPage : PageBase
    {
        public const string Title = "作业管理";
        public const string PageRoute = "/JobConfiguration";

        private static readonly string PageHtml;

        static JobExtensionPage()
        {
            PageHtml = Utility.ReadStringResource($"{AppConfig.AppName}.Hangfire.RecurringJobAdmin.Dashboard.JobExtension.html");
        }

        public override void Execute()
        {
            WriteEmptyLine();
            Layout = new LayoutPage(Title);
            if (IsReadOnly)
            {
                var html = Regex.Replace(PageHtml, $"<button[^>]*?>.*?</button>", string.Empty, RegexOptions.IgnoreCase);
                WriteLiteralLine(html);
            }
            else
            {
                WriteLiteralLine(PageHtml);
            }
            WriteEmptyLine();
        }
    }
}
