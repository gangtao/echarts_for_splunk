/*
 * Visualization source
 */
define([
        'jquery',
        'underscore',
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        // Add required assets to this list
        'echarts',
        'd3'
    ],
    function(
        $,
        _,
        SplunkVisualizationBase,
        vizUtils,
        echarts,
        d3
    ) {

        // Extend from SplunkVisualizationBase
        return SplunkVisualizationBase.extend({

            initialize: function() {
                SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
                // Save this.$el for convenience
                this.$el = $(this.el);
                // Initialization logic goes here
            },

            // Optionally implement to format data returned from search. 
            // The returned object will be passed to updateView as 'data'
            formatData: function(data) {
                // Format data 
                console.log("Formatting data");

                if (data.fields.length == 0) {
                    return undefined;
                }

                var config = this.getCurrentConfig();
                console.log(data);
                var option = {
                    title: {},
                    toolbox: {
                        feature: {
                            magicType: {
                                type: ['stack', 'tiled']
                            },
                            dataZoom: {
                                yAxisIndex: 'none'
                            },
                            restore: {},
                            saveAsImage: {}
                        },
                        left: 'left',
                        top: 'middle',
                        orient: 'vertical'
                    },
                    dataZoom: [],
                    visualMap: [],
                    tooltip: {},
                    legend: {
                        data: []
                    },
                    series: []
                };

                return this._buildXYOption(data, config, option);
            },

            // Implement updateView to render a visualization.
            //  'data' will be the data object returned from formatData or from the search
            //  'config' will be the configuration property object
            updateView: function(data, config) {
                if (data == undefined) {
                    return;
                }

                var myChart = echarts.init(this.el);
                // 使用刚指定的配置项和数据显示图表。
                myChart.setOption(data);
            },

            // Search data params
            getInitialDataParams: function() {
                return ({
                    outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                    count: 10000
                });
            },

            // Override to respond to re-sizing events
            reflow: function() {},

            // convert text to an array of index numbers
            _text2binding: function(text) {
                if (text.trim().length == 0) {
                    return [];
                }

                var list = text.split(",");
                var result = [];
                list.map(function(t) {
                    result.push(parseInt(t));
                });
                return result
            },

            _buildXYOption: function(data, config, option) {
                option.xAxis = {};
                option.yAxis = {};

                var xBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.xBinding"]);
                var xType = config["display.visualizations.custom.echarts_app.echarts.xAxisType"];
                var xShow = (config["display.visualizations.custom.echarts_app.echarts.xAxisShow"] == "true");

                var yBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.yBinding"]);
                var yType = config["display.visualizations.custom.echarts_app.echarts.yAxisType"];
                var yShow = (config["display.visualizations.custom.echarts_app.echarts.yAxisShow"] == "true");

                var xZoom = (config["display.visualizations.custom.echarts_app.echarts.xAxisZoom"] == "true");
                var yZoom = (config["display.visualizations.custom.echarts_app.echarts.yAxisZoom"] == "true");

                var dataBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataBinding"]);
                var dataType = config["display.visualizations.custom.echarts_app.echarts.dataType"];
                var dataLabelBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataLabelBinding"]);
                var dataSizeBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataSizeBinding"]);
                var dataColorBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataColorBinding"]);

                var showArea = config["display.visualizations.custom.echarts_app.echarts.showArea"];

                var categoricalColor = d3.scaleOrdinal(d3.schemeCategory10);
                var linearColor = d3.scaleLinear()
                    .interpolate(d3.interpolateHcl)
                    .range([d3.rgb("#fff"), d3.rgb('#000')]);

                if (xBinding.length > 0) {
                    option.xAxis.data = data.columns[xBinding[0]];
                    option.xAxis.name = data.fields[xBinding[0]].name;
                    option.xAxis.nameLocation = "middle";
                }
                option.xAxis.type = xType;
                option.xAxis.show = xShow;

                if (yBinding.length > 0) {
                    option.yAxis.data = data.columns[yBinding[0]];
                    option.yAxis.name = data.fields[yBinding[0]].name;
                }
                option.yAxis.type = yType;
                option.yAxis.show = yShow;

                if (xZoom) {
                    option.dataZoom.push({
                        type: 'slider',
                        show: true,
                        xAxisIndex: [0],
                        start: 1,
                        end: 10
                    });
                }

                if (yZoom) {
                    option.dataZoom.push({
                        type: 'slider',
                        show: true,
                        yAxisIndex: [0],
                        left: '93%',
                        start: 1,
                        end: 10
                    });
                }

                if (dataType == "scatter") {
                    var col = {};
                    col.data = [];
                    col.type = dataType;
                    // for scatter case, x,y must bing to some col
                    var i = 0,
                        length = data.columns[xBinding[0]].length;
                    for (; i < length; i++) {
                        var points = dataBinding.map(function(bindIndex) {
                            return data.columns[bindIndex][i];
                        });
                        col.data.push(points);
                    }

                    if (dataLabelBinding.length > 0) {
                        col.label = {
                            emphasis: {
                                show: true,
                                formatter: function(param) {
                                    return param.data[dataLabelBinding[0]];
                                },
                                position: 'top'
                            }
                        };
                    }
                    if (dataSizeBinding.length > 0) {
                        var map = {};
                        map.min = parseFloat(d3.min(data.columns[dataSizeBinding[0]]));
                        map.max = parseFloat(d3.max(data.columns[dataSizeBinding[0]]));
                        map.range = [map.min, map.max];
                        map.calculable = true;
                        map.realtime = true;
                        map.dimension = dataSizeBinding[0];
                        map.inRange = { symbolSize: [30, 100] };
                        map.left = "right";
                        map.top = "top";
                        option.visualMap.push(map);
                    }

                    if (dataColorBinding.length > 0) {
                        if ($.isNumeric(data.columns[
                                dataColorBinding[0]][0])) {
                            var map = {};
                            map.dimension = dataColorBinding[0];
                            map.min = parseFloat(d3.min(data.columns[dataColorBinding[0]]));
                            map.max = parseFloat(d3.max(data.columns[dataColorBinding[0]]));
                            map.range = [map.min, map.max];
                            map.calculable = true;
                            map.realtime = true;
                            map.inRange = { color: ['#ccc', '#888', '#222'] };
                            map.left = "right";
                            map.top = "bottom";
                            option.visualMap.push(map);
                        } else {
                            if (false) {
                                colorScale = categoricalColor;
                                col.itemStyle = {
                                    normal: {
                                        color: function(param) {
                                            return colorScale(param.data[dataColorBinding[0]]);
                                        }
                                    }
                                };
                            } else {
                                function onlyUnique(value, index, self) {
                                    return self.indexOf(value) === index;
                                }

                                var map = {};
                                map.dimension = dataColorBinding[0];
                                map.categories = data.columns[dataColorBinding[0]].filter(onlyUnique);
                                map.inRange = { color: d3.schemeCategory10 };
                                map.left = "right";
                                map.top = "bottom";
                                option.visualMap.push(map);
                            }

                            //TODO : no legend here 
                            //use visual map will cause some strange conflict
                        }
                    }
                    option.series.push(col);
                } else {
                    dataBinding.map(function(bindIndex) {
                        var col = {};
                        col.name = [data.fields[bindIndex].name];
                        col.type = dataType;
                        if (showArea == "true") {
                            col.areaStyle = { normal: {} };
                        }
                        option.legend.data.push({ "name": data.fields[bindIndex].name });

                        if (dataLabelBinding.length > 0) {
                            col.data = [];
                            var i = 0,
                                length = data.columns[bindIndex].length;
                            for (; i < length; i++) {
                                var item = {};
                                item.value = data.columns[bindIndex][i];
                                item.name = data.columns[dataLabelBinding[0]][i]
                                col.data.push(item);
                            }
                        } else {
                            col.data = data.columns[bindIndex];
                        }
                        option.series.push(col);
                    });

                    //TODO : handle data size and color binding
                }

                // TODO : pie chart is not applied for xy chart
                if (dataType == "pie") {
                    delete option["xAxis"];
                    delete option["yAxis"];
                }

                console.log(option);
                return option;
            }
        });
    });
