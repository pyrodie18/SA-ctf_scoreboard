require([
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc',
    'underscore',
    'splunkjs/mvc/simplexml/ready!'],function(
    TableView,
    ChartView,
    SearchManager,
    mvc,
    _
    ){
    var EventSearchBasedRowExpansionRenderer = TableView.BaseRowExpansionRenderer.extend({
        initialize: function(args) {
            // initialize will run once, so we will set up a search and a chart to be reused.
            this._searchManager = new SearchManager({
                id: 'details-search-manager',
                preview: false
            });
            this._tableView = new TableView({
                managerid: 'details-search-manager',
                drilldown: 'none',
            });
        },
        canRender: function(rowData) {
            // Since more than one row expansion renderer can be registered we let each decide if they can handle that
            // data
            // Here we will always handle it.
            return true;
        },
        render: function($container, rowData) {
            // rowData contains information about the row that is expanded.  We can see the cells, fields, and values
            // We will find the Number cell to use its value
            var numberCell = _(rowData.cells).find(function (cell) {
               return cell.field === 'Number';
            });
            //update the search with the sourcetype that we are interested in
            this._searchManager.set({ search: 'earliest=0 index=scoreboard Result=* `get_user_info` \
                                              | getanswer \
                                              | search [ rest /services/authentication/current-context \
                                                         | rename username as user `get_user_info` \
                                                         | fields + user] \
                                                Number=' + numberCell.value + ' \
                                              | eval Time = strftime(_time, "%+") \
                                              | fillnull value=0 BasePointsAwarded \
                                              | fillnull value=0 SpeedBonusAwarded \
                                              | fillnull value=0 AdditionalBonusAwarded \
                                              | fillnull value=0 Penalty \
                                              | fillnull value=0 HintPenalty \
                                              | rename BasePointsAwarded as "Base Points" \
                                              | rename SpeedBonusAwarded as "Speed Bonus" \
                                              | rename AdditionalBonusAwarded as "Additional Bonus" \
                                              | rename Penalty as "Penalty Points"\
                                              | table Time Answer Result "Base Points" "Speed Bonus" "Additional Bonus" "Penalty Points" HintPenalty \
                                              | rename HintPenalty as "Hint Penalty" \
                                              '
                                            });
            // $container is the jquery object where we can put out content.
            // In this case we will render our chart and add it to the $container
            $container.append(this._tableView.render().el);
        }
    });
    var tableElement = mvc.Components.getInstance("table1");
    tableElement.getVisualization(function(tableView) {
        // Add custom cell renderer, the table will re-render automatically.
        tableView.addRowExpansionRenderer(new EventSearchBasedRowExpansionRenderer());
    });
});
