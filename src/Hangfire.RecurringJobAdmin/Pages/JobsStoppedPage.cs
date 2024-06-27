using Hangfire.Dashboard;
using Hangfire.Dashboard.Pages;
using Hangfire.RecurringJobAdmin.Core;

namespace Hangfire.RecurringJobAdmin.Pages
{
    internal sealed class JobsStoppedPage : PageBase
    {
        public const string Title = "已停止作业";
        public const string PageRoute = "/jobs/stopped";

        private static readonly string PageHtml;

        static JobsStoppedPage()
        {
            PageHtml = Utility.ReadStringResource($"{AppConfig.AppName}.Hangfire.RecurringJobAdmin.Dashboard.JobsStopped.html");
        }

        public override void Execute()
        {
            WriteEmptyLine();
            Layout = new LayoutPage(Title);
            WriteLiteralLine("<div class=\"row\">");

            WriteLiteralLine("<div class=\"col-md-3\">");
            Write(Html.JobsSidebar());
            WriteLiteralLine("</div>");

            WriteLiteralLine("<div class=\"col-md-9\">");
            WriteLiteralLine(PageHtml);
            WriteLiteralLine("</div>");

            WriteLiteralLine("</div>");
            WriteEmptyLine();
        }
    }
}
