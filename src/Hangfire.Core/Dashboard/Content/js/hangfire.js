(function (hangfire) {
    var changeDatasetColorScheme = function (newColorScheme) {
        this._chart.data.datasets[0].backgroundColor = COLORS[newColorScheme].failed.backgroundColor;
        this._chart.data.datasets[0].borderColor = COLORS[newColorScheme].failed.borderColor;

        this._chart.data.datasets[1].backgroundColor = COLORS[newColorScheme].deleted.backgroundColor;
        this._chart.data.datasets[1].borderColor = COLORS[newColorScheme].deleted.borderColor;

        this._chart.data.datasets[2].backgroundColor = COLORS[newColorScheme].succeeded.backgroundColor;
        this._chart.data.datasets[2].borderColor = COLORS[newColorScheme].succeeded.borderColor;

        this._chart.options.scales.xAxes[0].gridLines.color = COLORS[newColorScheme].cartesianColor;
        this._chart.options.scales.yAxes[0].gridLines.color = COLORS[newColorScheme].cartesianColor;

        this._chart.update();
    }

    var COLORS = {
        light: {
            cartesianColor: '#e5e5e5',
            failed: {
                backgroundColor: '#D55251',
                borderColor: null,
            },
            deleted: {
                backgroundColor: '#919191',
                borderColor: null,
            },
            succeeded: {
                backgroundColor: '#6FCD6D',
                borderColor: '#62B35F',
            },
        },
        dark: {
            cartesianColor: '#5f5f5f',
            failed: {
                backgroundColor: 'rgba(215, 58, 74, 0.4)',
            },
            deleted: {
                backgroundColor: 'rgba(204, 204, 204, 0.4)',
            },
            succeeded: {
                backgroundColor: 'rgba(87, 171, 90, 0.4)',
                borderColor: 'rgba(87, 171, 90, 1)',
            },
        },
    };

    hangfire.config = {
        pollInterval: $("#hangfireConfig").data("pollinterval"),
        pollUrl: $("#hangfireConfig").data("pollurl"),
        locale: document.documentElement.lang,
        darkMode: $("#hangfireConfig").data("darkmode")
    };

    var colorScheme = "light";

    if (hangfire.config.darkMode) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            colorScheme = "dark";
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            colorScheme = e.matches ? "dark" : "light";

            hangfire.page.realtimeGraph.changeDatasetColorScheme(colorScheme);
            hangfire.page.historyGraph.changeDatasetColorScheme(colorScheme);
        });
    }

    hangfire.ErrorAlert = (function () {
        function ErrorAlert(title, message) {
            this._errorAlert = $('#errorAlert');
            this._errorAlertTitle = $('#errorAlertTitle');
            this._errorAlertMessage = $('#errorAlertMessage');
            this._title = title;
            this._message = message;
        }

        ErrorAlert.prototype.show = function () {
            this._errorAlertTitle.html(this._title);
            this._errorAlertMessage.html(this._message);

            $('#errorAlert').show();
            var alertHeight = $('#errorAlert').outerHeight();
            $('#errorAlert').hide();

            $('#errorAlert').slideDown("fast");
            $('.js-page-container').animate({ 'padding-top': alertHeight + 'px' }, "fast");
        };

        return ErrorAlert;
    })();

    hangfire.Metrics = (function () {
        function Metrics() {
            this._metrics = {};
        }

        Metrics.prototype.addElement = function (name, element) {
            if (!(name in this._metrics)) {
                this._metrics[name] = [];
            }

            this._metrics[name].push(element);
        };

        Metrics.prototype.getElements = function (name) {
            if (!(name in this._metrics)) {
                return [];
            }

            return this._metrics[name];
        };

        Metrics.prototype.getNames = function () {
            var result = [];
            var metrics = this._metrics;

            for (var name in metrics) {
                if (metrics.hasOwnProperty(name)) {
                    result.push(name);
                }
            }

            return result;
        };

        return Metrics;
    })();

    hangfire.RealtimeGraph = (function () {
        function RealtimeGraph(element, succeeded, failed, deleted, succeededStr, failedStr, deletedStr, pollInterval) {
            this._succeeded = succeeded;
            this._failed = failed;
            this._deleted = deleted;
            this._last = Date.now();
            this._pollInterval = pollInterval;

            this._chart = new Chart(element, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: failedStr,
                            borderColor: COLORS[colorScheme].failed.borderColor,
                            backgroundColor: COLORS[colorScheme].failed.backgroundColor,
                            borderWidth: 2
                        },
                        {
                            label: deletedStr,
                            borderColor: COLORS[colorScheme].deleted.borderColor,
                            backgroundColor: COLORS[colorScheme].deleted.backgroundColor,
                            borderWidth: 2
                        },
                        {
                            label: succeededStr,
                            borderColor: COLORS[colorScheme].succeeded.borderColor,
                            backgroundColor: COLORS[colorScheme].succeeded.backgroundColor
                        },
                    ]
                },
                options: {
                    scales: {
                        xAxes: [{
                            gridLines: { color: COLORS[colorScheme].cartesianColor },
                            type: 'realtime',
                            realtime: { duration: 60 * 1000, delay: pollInterval },
                            time: { unit: 'second', tooltipFormat: 'LL LTS', displayFormats: { second: 'LTS', minute: 'LTS' } },
                            ticks: { maxRotation: 0 }
                        }],
                        yAxes: [{
                            gridLines: { color: COLORS[colorScheme].cartesianColor },
                            ticks: { beginAtZero: true, precision: 0, min: 0, maxTicksLimit: 6, suggestedMax: 10 },
                            stacked: true
                        }]
                    },
                    elements: { line: { tension: 0 }, point: { radius: 0 } },
                    animation: { duration: 0 },
                    hover: { animationDuration: 0 },
                    responsiveAnimationDuration: 0,
                    legend: { display: false },
                    tooltips: { mode: 'index', intersect: false }
                }
            });
        }

        RealtimeGraph.prototype.appendHistory = function (statistics) {
            var newFailed = parseInt(statistics["failed:count"].intValue);
            var newDeleted = parseInt(statistics["deleted:count"].intValue);
            var newSucceeded = parseInt(statistics["succeeded:count"].intValue);
            var now = Date.now();

            if (this._succeeded !== null && this._failed !== null && this._deleted !== null && (now - this._last < this._pollInterval * 2)) {
                var failed = Math.max(newFailed - this._failed, 0);
                var deleted = Math.max(newDeleted - this._deleted, 0);
                var succeeded = Math.max(newSucceeded - this._succeeded, 0);

                this._chart.data.datasets[0].data.push({ x: now, y: failed });
                this._chart.data.datasets[1].data.push({ x: now, y: deleted });
                this._chart.data.datasets[2].data.push({ x: now, y: succeeded });

                this._chart.update();
            }

            this._failed = newFailed;
            this._deleted = newDeleted;
            this._succeeded = newSucceeded;
            this._last = now;
        };

        RealtimeGraph.prototype.changeDatasetColorScheme = changeDatasetColorScheme;

        return RealtimeGraph;
    })();

    hangfire.HistoryGraph = (function () {
        function HistoryGraph(element, succeeded, failed, deleted, succeededStr, failedStr, deletedStr) {
            var timeOptions = $(element).data('period') === 'week'
                ? { unit: 'day', tooltipFormat: 'LL', displayFormats: { day: 'll' } }
                : { unit: 'hour', tooltipFormat: 'LLL', displayFormats: { hour: 'LT', day: 'll' } };

            this._chart = new Chart(element, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: failedStr,
                            borderColor: COLORS[colorScheme].failed.borderColor,
                            backgroundColor: COLORS[colorScheme].failed.backgroundColor,
                            borderWidth: 2,
                            data: failed,
                        },
                        {
                            label: deletedStr,
                            borderColor: COLORS[colorScheme].deleted.borderColor,
                            backgroundColor: COLORS[colorScheme].deleted.backgroundColor,
                            borderWidth: 2,
                            data: deleted,
                        },
                        {
                            label: succeededStr,
                            borderColor: COLORS[colorScheme].succeeded.borderColor,
                            backgroundColor: COLORS[colorScheme].succeeded.backgroundColor,
                            data: succeeded,
                        },
                    ]
                },
                options: {
                    scales: {
                        xAxes: [{ gridLines: { color: COLORS[colorScheme].cartesianColor }, type: 'time', time: timeOptions, ticks: { maxRotation: 0 } }],
                        yAxes: [{ gridLines: { color: COLORS[colorScheme].cartesianColor }, ticks: { beginAtZero: true, precision: 0, maxTicksLimit: 6 }, stacked: true }]
                    },
                    elements: { line: { tension: 0 }, point: { radius: 0 } },
                    legend: { display: false },
                    tooltips: { mode: 'index', intersect: false },
                    plugins: { streaming: false },
                }
            });

            HistoryGraph.prototype.changeDatasetColorScheme = changeDatasetColorScheme;

        }

        return HistoryGraph;
    })();

    hangfire.StatisticsPoller = (function () {
        function StatisticsPoller(metricsCallback, statisticsUrl, pollInterval) {
            this._metricsCallback = metricsCallback;
            this._listeners = [];
            this._statisticsUrl = statisticsUrl;
            this._pollInterval = pollInterval;
            this._timeoutId = null;
        }

        StatisticsPoller.prototype.start = function () {
            var self = this;

            var intervalFunc = function () {
                try {
                    $.post(self._statisticsUrl, { metrics: self._metricsCallback() })
                        .done(function (data) {
                            self._notifyListeners(data);
                            if (self._timeoutId !== null) {
                                self._timeoutId = setTimeout(intervalFunc, self._pollInterval);
                            }
                        })
                        .fail(function (xhr) {
                            var errorAlert = new Hangfire.ErrorAlert(
                                'Unable to refresh the statistics:',
                                'the server responded with ' + xhr.status + ' (' + xhr.statusText
                                + '). Try reloading the page manually, or wait for automatic reload that will happen in a minute.');

                            errorAlert.show();
                            self._timeoutId = null;
                            setTimeout(function () { window.location.reload(); }, 60 * 1000);
                        });
                } catch (e) {
                    console.log(e);
                }
            };

            this._timeoutId = setTimeout(intervalFunc, this._pollInterval);
        };

        StatisticsPoller.prototype.stop = function () {
            if (this._timeoutId !== null) {
                clearTimeout(this._timeoutId);
                this._timeoutId = null;
            }
        };

        StatisticsPoller.prototype.addListener = function (listener) {
            this._listeners.push(listener);
        };

        StatisticsPoller.prototype._notifyListeners = function (statistics) {
            var length = this._listeners.length;
            var i;

            for (i = 0; i < length; i++) {
                this._listeners[i](statistics);
            }
        };

        return StatisticsPoller;
    })();

    hangfire.Page = (function () {
        function Page(config) {
            this._metrics = new Hangfire.Metrics();

            var self = this;
            this._poller = new Hangfire.StatisticsPoller(
                function () { return self._metrics.getNames(); },
                config.pollUrl,
                config.pollInterval);

            this._initialize(config.locale);

            this.realtimeGraph = this._createRealtimeGraph('realtimeGraph', config.pollInterval);
            this.historyGraph = this._createHistoryGraph('historyGraph');

            this._poller.start();
        };

        Page.prototype._createRealtimeGraph = function (elementId, pollInterval) {
            var realtimeElement = document.getElementById(elementId);
            if (realtimeElement) {
                var succeeded = parseInt($(realtimeElement).data('succeeded'));
                var failed = parseInt($(realtimeElement).data('failed'));
                var deleted = parseInt($(realtimeElement).data('deleted'));

                var succeededStr = $(realtimeElement).data('succeeded-string');
                var failedStr = $(realtimeElement).data('failed-string');
                var deletedStr = $(realtimeElement).data('deleted-string');
                var realtimeGraph = new Hangfire.RealtimeGraph(realtimeElement, succeeded, failed, deleted, succeededStr, failedStr, deletedStr, pollInterval);

                this._poller.addListener(function (data) {
                    realtimeGraph.appendHistory(data);
                });

                return realtimeGraph;
            }

            return null;
        };

        Page.prototype._createHistoryGraph = function (elementId) {
            var historyElement = document.getElementById(elementId);
            if (historyElement) {
                var createSeries = function (obj) {
                    var series = [];
                    for (var date in obj) {
                        if (obj.hasOwnProperty(date)) {
                            var value = obj[date];
                            var point = { x: Date.parse(date), y: value };
                            series.unshift(point);
                        }
                    }
                    return series;
                };

                var succeeded = createSeries($(historyElement).data("succeeded"));
                var failed = createSeries($(historyElement).data("failed"));
                var deleted = createSeries($(historyElement).data("deleted"));

                var succeededStr = $(historyElement).data('succeeded-string');
                var failedStr = $(historyElement).data('failed-string');
                var deletedStr = $(historyElement).data('deleted-string');

                return new Hangfire.HistoryGraph(historyElement, succeeded, failed, deleted, succeededStr, failedStr, deletedStr);
            }

            return null;
        };

        Page.prototype._initialize = function (locale) {
            moment.locale(locale);
            var updateRelativeDates = function () {
                $('*[data-moment]').each(function () {
                    var $this = $(this);
                    var timestamp = $this.data('moment');

                    if (timestamp) {
                        var time = moment(timestamp, 'X');
                        $this.html(time.fromNow())
                            .attr('title', time.format('llll'))
                            .attr('data-container', 'body');
                    }
                });

                $('*[data-moment-title]').each(function () {
                    var $this = $(this);
                    var timestamp = $this.data('moment-title');

                    if (timestamp) {
                        var time = moment(timestamp, 'X');
                        $this.prop('title', time.format('llll'))
                            .attr('data-container', 'body');
                    }
                });

                $('*[data-moment-local]').each(function () {
                    var $this = $(this);
                    var timestamp = $this.data('moment-local');

                    if (timestamp) {
                        var time = moment(timestamp, 'X');
                        $this.html(time.format('l LTS'));
                    }
                });
            };

            updateRelativeDates();
            setInterval(updateRelativeDates, 30 * 1000);

            $('*[title]').tooltip();

            var self = this;
            $('*[data-metric]').each(function () {
                var name = $(this).data('metric');
                self._metrics.addElement(name, this);
            });

            this._poller.addListener(function (metrics) {
                for (var name in metrics) {
                    var elements = self._metrics.getElements(name);
                    for (var i = 0; i < elements.length; i++) {
                        var metric = metrics[name];
                        var metricClass = metric ? "metric-" + metric.style : "metric-null";
                        var highlighted = metric && metric.highlighted ? "highlighted" : null;
                        var value = metric ? metric.value : null;

                        $(elements[i])
                            .text(value)
                            .closest('.metric')
                            .removeClass()
                            .addClass(["metric", metricClass, highlighted].join(' '));
                    }
                }
            });

            var csrfHeader = $('meta[name="csrf-header"]').attr('content');
            var csrfToken = $('meta[name="csrf-token"]').attr('content');

            if (csrfToken && csrfHeader) {
                var headers = {};
                headers[csrfHeader] = csrfToken;

                $.ajaxSetup({ headers: headers });
            }

            $(document).on('click', '*[data-ajax]', function (e) {
                var $this = $(this);
                var confirmText = $this.data('confirm');

                if (!confirmText || confirm(confirmText)) {
                    $this.prop('disabled');
                    var loadingDelay = setTimeout(function () {
                        $this.button('loading');
                    }, 100);

                    $.post($this.data('ajax'), function () {
                        clearTimeout(loadingDelay);
                        window.location.reload();
                    });
                }

                e.preventDefault();
            });

            $(document).on('click', '.expander', function (e) {
                var $expander = $(this),
                    $expandable = $expander.closest('tr').next().find('.expandable');

                if (!$expandable.is(':visible')) {
                    $expander.text('Fewer details...');
                }

                $expandable.slideToggle(
                    150,
                    function () {
                        if (!$expandable.is(':visible')) {
                            $expander.text('More details...');
                        }
                    });
                e.preventDefault();
            });

            $('.js-jobs-list').each(function () {
                var container = this;

                var selectRow = function (row, isSelected) {
                    var $checkbox = $('.js-jobs-list-checkbox', row);
                    if ($checkbox.length > 0) {
                        $checkbox.prop('checked', isSelected);
                        $(row).toggleClass('highlight', isSelected);
                    }
                };

                var toggleRowSelection = function (row) {
                    var $checkbox = $('.js-jobs-list-checkbox', row);
                    if ($checkbox.length > 0) {
                        var isSelected = $checkbox.is(':checked');
                        selectRow(row, !isSelected);
                    }
                };

                var setListState = function (state) {
                    $('.js-jobs-list-select-all', container)
                        .prop('checked', state === 'all-selected')
                        .prop('indeterminate', state === 'some-selected');

                    $('.js-jobs-list-command', container)
                        .prop('disabled', state === 'none-selected');
                };

                var updateListState = function () {
                    var selectedRows = $('.js-jobs-list-checkbox', container).map(function () {
                        return $(this).prop('checked');
                    }).get();

                    var state = 'none-selected';

                    if (selectedRows.length > 0) {
                        state = 'some-selected';

                        if ($.inArray(false, selectedRows) === -1) {
                            state = 'all-selected';
                        } else if ($.inArray(true, selectedRows) === -1) {
                            state = 'none-selected';
                        }
                    }

                    setListState(state);
                };

                $(this).on('click', '.js-jobs-list-checkbox', function (e) {
                    selectRow(
                        $(this).closest('.js-jobs-list-row').first(),
                        $(this).is(':checked'));

                    updateListState();

                    e.stopPropagation();
                });

                $(this).on('click', '.js-jobs-list-row', function (e) {
                    if ($(e.target).is('a')) return;

                    toggleRowSelection(this);
                    updateListState();
                });

                $(this).on('click', '.js-jobs-list-select-all', function () {
                    var selectRows = $(this).is(':checked');

                    $('.js-jobs-list-row', container).each(function () {
                        selectRow(this, selectRows);
                    });

                    updateListState();
                });

                $(this).on('click', '.js-jobs-list-command', function (e) {
                    var $this = $(this);
                    var confirmText = $this.data('confirm');

                    var jobs = $("input[name='jobs[]']:checked", container).map(function () {
                        return $(this).val();
                    }).get();

                    if (!confirmText || confirm(confirmText)) {
                        $this.prop('disabled');
                        var loadingDelay = setTimeout(function () {
                            $this.button('loading');
                        }, 100);

                        $.post($this.data('url'), { 'jobs[]': jobs }, function () {
                            clearTimeout(loadingDelay);
                            window.location.reload();
                        });
                    }

                    e.preventDefault();
                });

                updateListState();
            });
        };

        return Page;
    })();

})(window.Hangfire = window.Hangfire || {});

$(function () {
    Hangfire.page = new Hangfire.Page(Hangfire.config);
});

// 搜索框拓展,在查找的记录中查询，无需查库
var jobSearcher = new function () {
    var createSearchBox = function () {
        $('#search-box').closest('div').remove();
        $('.js-jobs-list').prepend('<div class="form-group"><input class="form-control" type="text" id="search-box" placeholder="Search"></div>');
    };
    this.Init = function () {
        createSearchBox();
        if (location.search.indexOf('?search=') === 0) {
            var searchValue = location.search.replace('?search=', '');
            $('#search-box').val(searchValue);
            setTimeout(function () { FilterJobs(searchValue); }, 500);
        }
    };
    this.BindEvents = function () {
        $('#search-box').bind('change', function (e) {
            if (this.value.length === 0) window.location.reload();
            FilterJobs(this.value);
        });
    };
    function FilterJobs(keyword) {
        //非只读数据下,筛选数据
        $(".table-responsive table").load(window.location.href.split('?')[0] + "?from=0&count=1000 .table-responsive table",
            function () {
                var table = $('.table-responsive').find('table');
                if (keyword.indexOf('name:') == 0 && location.pathname.endsWith('/recurring')) {
                    var filtered = $(table).find('td.width-30:contains(' + keyword.substr(5) + ')').closest('tr');
                } else {
                    var filtered = (location.pathname.endsWith('/recurring')) ? $(table).find('input.js-jobs-list-checkbox[value*=' + keyword + ']').closest('tr') : $(table).find('a[class=job-method]:contains(' + keyword + ')').closest('tr');
                }
                $(table).find('tbody tr').remove();
                //如果是failed页面 需要在每个下面多加一个tr 否则会导致样式问题
                if (location.pathname.endsWith('jobs/failed')) {
                    for (var j = 0; j < filtered.length; j++) {
                        $(table).find('tbody').append(filtered[j]);
                        $(table).find('tbody').append('<tr></tr>');
                    }
                    $('.js-jobs-list .expander').remove();
                } else {
                    $(table).find('tbody').append(filtered);
                }
                //$('#total-items').text("Search Result: " + filtered.length);
                //$('#total-record-count').text(filtered.length);
            }
        );
    }
};
jobSearcher.Init();
jobSearcher.BindEvents();
