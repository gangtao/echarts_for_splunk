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
        'd3',
        'maps'
    ],
    function(
        $,
        _,
        SplunkVisualizationBase,
        vizUtils,
        echarts,
        d3,
        maps
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
                if (data.fields.length == 0) {
                    return undefined;
                }

                var config = this.getCurrentConfig();
                //console.log(data);
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
                    series: []
                };

                var coordinatesType = config["display.visualizations.custom.echarts_app.echarts.coordinatesType"];

                if (coordinatesType == "xy") {
                    return this._buildXYOption(data, config, option);
                } else if (coordinatesType == "geo") {
                    return this._buildGeoOption(data, config, option);
                } else {
                    console.log("Coordinates Not Supported!");
                }
                return option;
            },

            // Implement updateView to render a visualization.
            //  'data' will be the data object returned from formatData or from the search
            //  'config' will be the configuration property object
            updateView: function(data, config) {
                if (data == undefined) {
                    return;
                }

                console.log(data);
                console.log(JSON.stringify(data));

                var myChart = echarts.init(this.el);
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

                var colorHigh = config["display.visualizations.custom.echarts_app.echarts.colorHigh"];
                var colorMedium = config["display.visualizations.custom.echarts_app.echarts.colorMedium"];
                var colorLow = config["display.visualizations.custom.echarts_app.echarts.colorLow"];

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
                        map.min = d3.min(data.columns[dataSizeBinding[0]].map(function(item) {
                            return parseFloat(item);
                        }));
                        map.max = d3.max(data.columns[dataSizeBinding[0]].map(function(item) {
                            return parseFloat(item);
                        }));
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
                            map.min = d3.min(data.columns[dataColorBinding[0]].map(function(item) {
                                return parseFloat(item);
                            }));
                            map.max = d3.max(data.columns[dataColorBinding[0]].map(function(item) {
                                return parseFloat(item);
                            }));
                            map.range = [map.min, map.max];
                            map.calculable = true;
                            map.realtime = true;
                            map.inRange = { color: [colorLow, colorMedium, colorHigh] };
                            map.left = "right";
                            map.top = "bottom";
                            option.visualMap.push(map);
                        } else {
                            var map = {};
                            map.dimension = dataColorBinding[0];
                            map.categories = data.columns[dataColorBinding[0]].filter(function(value, index, self) {
                                return self.indexOf(value) === index;
                            });
                            map.inRange = { color: d3.schemeCategory10 };
                            map.left = "right";
                            map.top = "bottom";
                            option.visualMap.push(map);
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
                        option.legend = {};
                        option.legend.data = [];
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

                //console.log(option);
                return option;
            },

            _buildGeoOption: function(data, config, option) {
                var mapType = config["display.visualizations.custom.echarts_app.echarts.mapType"];

                var dataBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataBinding"]);
                var dataType = config["display.visualizations.custom.echarts_app.echarts.dataType"];
                var dataLabelBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataLabelBinding"]);
                var dataSizeBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataSizeBinding"]);
                var dataColorBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataColorBinding"]);

                var geoNameBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.geoNameBinding"]);
                var locationBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.locationBinding"]);

                var colorHigh = config["display.visualizations.custom.echarts_app.echarts.colorHigh"];
                var colorMedium = config["display.visualizations.custom.echarts_app.echarts.colorMedium"];
                var colorLow = config["display.visualizations.custom.echarts_app.echarts.colorLow"];

                if (dataType != "map" && dataType != "scatter") {
                    console.log("Only map or scatter is supported for geomap");
                    return option;
                }
                var map = "";

                if (mapType == "world") {
                    echarts.registerMap('World', maps.world, {});
                    map = "World";
                } else if (mapType == "china") {
                    echarts.registerMap('China', maps.china, {});
                    map = "China";
                } else if (mapType == "usa") {
                    echarts.registerMap('USA', maps.usa, {
                        Alaska: { // 把阿拉斯加移到美国主大陆左下方
                            left: -131,
                            top: 25,
                            width: 15
                        },
                        Hawaii: {
                            left: -110, // 夏威夷
                            top: 28,
                            width: 5
                        },
                        'Puerto Rico': { // 波多黎各
                            left: -76,
                            top: 26,
                            width: 2
                        }
                    });
                    map = "USA";
                } else {
                    console.log("map type " + mapType + " is not supported!");
                    return option;
                }

                if (dataType == "scatter") {
                    option.geo = { "map": map, roam: true };
                    var col = {};
                    col.data = [];
                    col.type = dataType;
                    col.coordinateSystem = "geo";

                    var i = 0,
                        length = data.columns[dataBinding[0]].length;
                    for (; i < length; i++) {
                        var location = [data.columns[locationBinding[0]][i], data.columns[locationBinding[1]][i]];
                        var values = dataBinding.map(function(bindIndex) {
                            return data.columns[bindIndex][i];
                        });

                        var item = location.concat(values);
                        col.data.push(item);
                    }
                    option.series.push(col);

                    // size binding and color binding code are duplicated, need refactory
                    if (dataSizeBinding.length > 0) {
                        var map = {};
                        map.min = d3.min(data.columns[dataSizeBinding[0]].map(function(item) {
                            return parseFloat(item);
                        }));
                        map.max = d3.max(data.columns[dataSizeBinding[0]].map(function(item) {
                            return parseFloat(item);
                        }));
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
                            map.min = d3.min(data.columns[dataColorBinding[0]].map(function(item) {
                                return parseFloat(item);
                            }));
                            map.max = d3.max(data.columns[dataColorBinding[0]].map(function(item) {
                                return parseFloat(item);
                            }));
                            map.range = [map.min, map.max];
                            map.calculable = true;
                            map.realtime = true;
                            map.inRange = { color: [colorLow, colorMedium, colorHigh] };
                            map.left = "right";
                            map.top = "bottom";
                            option.visualMap.push(map);
                        } else {
                            var map = {};
                            map.dimension = dataColorBinding[0];
                            map.categories = data.columns[dataColorBinding[0]].filter(function(value, index, self) {
                                return self.indexOf(value) === index;
                            });
                            map.inRange = { color: d3.schemeCategory10 };
                            map.left = "right";
                            map.top = "bottom";
                            option.visualMap.push(map);
                        }
                    }

                } else {
                    // databinding 1 required
                    // geoname binding 1 required

                    if (dataBinding.length != 1 || geoNameBinding.length != 1) {
                        console.log("map type need 1 geoname binding and 1 data binding");
                        return option;
                    }

                    var col = {};
                    col.name = data.fields[dataBinding[0]].name;
                    col.type = dataType; // map type here
                    col.map = map;

                    col.data = [];
                    col.roam = true;

                    var i = 0,
                        length = data.columns[dataBinding[0]].length;

                    for (; i < length; i++) {
                        var item = {};
                        item.name = data.columns[geoNameBinding[0]][i];
                        item.value = parseFloat(data.columns[dataBinding[0]][i]);
                        col.data.push(item);
                    }
                    option.series.push(col);

                    var vmap = {};
                    vmap.min = d3.min(data.columns[dataBinding[0]].map(function(item) {
                        return parseFloat(item);
                    }));
                    vmap.max = d3.max(data.columns[dataBinding[0]].map(function(item) {
                        return parseFloat(item);
                    }));
                    vmap.calculable = true;
                    vmap.text = ['High', 'Low'];
                    vmap.color = [colorHigh, colorMedium, colorLow];
                    vmap.left = "right";
                    vmap.top = "bottom";
                    option.visualMap.push(vmap);
                }
                return option;
            }
        });
    });
