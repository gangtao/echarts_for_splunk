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
                } else if (coordinatesType == "single") {
                    return this._buildSingleAxisOption(data, config, option);
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

                var dataType = config["display.visualizations.custom.echarts_app.echarts.dataType"];
                var dataLabelBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataLabelBinding"]);
                var dataSizeBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataSizeBinding"]);
                var dataColorBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataColorBinding"]);

                var showArea = config["display.visualizations.custom.echarts_app.echarts.showArea"];

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

                    var i = 0,
                        length = data.columns[xBinding[0]].length;

                    var dataLabelBindingIndex = undefined;
                    var dataSizeBindingIndex = undefined;
                    var dataColorBindingIndex = undefined;

                    //Caculating binding indexes
                    var index = 2;
                    if (dataLabelBinding.length > 0) {
                        dataLabelBindingIndex = index;
                        index = index + 1;
                    }
                    if (dataSizeBinding.length > 0) {
                        dataSizeBindingIndex = index;
                        index = index + 1;
                    }
                    if (dataColorBinding.length > 0) {
                        dataColorBindingIndex = index;
                        index = index + 1;
                    }

                    // Make data points
                    for (; i < length; i++) {
                        var points = [];
                        points.push(data.columns[xBinding[0]][i]);
                        points.push(data.columns[yBinding[0]][i]);

                        if (dataLabelBinding.length > 0) {
                            points.push(data.columns[dataLabelBinding[0]][i]);
                        }

                        if (dataSizeBinding.length > 0) {
                            points.push(data.columns[dataSizeBinding[0]][i]);
                        }

                        if (dataColorBinding.length > 0) {
                            points.push(data.columns[dataColorBinding[0]][i]);
                        }

                        col.data.push(points);
                    }

                    if (dataLabelBinding.length > 0) {
                        this._bindLabel(dataLabelBindingIndex, col);
                    }

                    if (dataSizeBinding.length > 0) {
                        this._bindSize(dataSizeBindingIndex, data.columns[dataSizeBinding[0]], option, config);
                    }

                    if (dataColorBinding.length > 0) {
                        this._bindColor(dataColorBindingIndex, data.columns[dataColorBinding[0]], option, config);
                    }
                    option.series.push(col);

                } else {
                    // for bar and line
                    if (xType == "category" && yType == "category") {
                        console.log("x and y are both category which is not supported now!");
                        return;
                    }

                    var valueBindAxis = undefined;
                    if (xType != "category") {
                        valueBindAxis = xBinding;
                    } else {
                        valueBindAxis = yBinding;
                    }

                    option.legend = {};
                    option.legend.data = [];

                    valueBindAxis.map(function(bindIndex) {
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
                //console.log(option);
                return option;
            },

            _buildGeoOption: function(data, config, option) {
                var mapType = config["display.visualizations.custom.echarts_app.echarts.mapType"];

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
                    if (locationBinding.length != 2) {
                        console.log("scatter on geo need longtitue and latitude bindings");
                        return option;
                    }
                    option.geo = { "map": map, roam: true };
                    var col = {};
                    col.data = [];
                    col.type = dataType;
                    col.coordinateSystem = "geo";

                    var dataSizeBindingIndex = undefined;
                    var dataColorBindingIndex = undefined;

                    //Caculating binding indexes, default already bind to lang/lat of locationBinding
                    var index = 2;
                    if (dataSizeBinding.length > 0) {
                        dataSizeBindingIndex = index;
                        index = index + 1;
                    }
                    if (dataColorBinding.length > 0) {
                        dataColorBindingIndex = index;
                        index = index + 1;
                    }

                    var i = 0,
                        length = data.columns[locationBinding[0]].length;
                    for (; i < length; i++) {
                        var location = [data.columns[locationBinding[0]][i], data.columns[locationBinding[1]][i]];
                        var values = [];
                        if (dataSizeBinding.length > 0) {
                            values.push(data.columns[dataSizeBinding[0]][i]);
                        }

                        if (dataColorBinding.length > 0) {
                            values.push(data.columns[dataColorBinding[0]][i]);
                        }

                        var item = location.concat(values);
                        col.data.push(item);
                    }

                    if (dataSizeBinding.length > 0) {
                        this._bindSize(dataSizeBindingIndex, data.columns[dataSizeBinding[0]], option, config);
                    }

                    if (dataColorBinding.length > 0) {
                        this._bindColor(dataColorBindingIndex, data.columns[dataColorBinding[0]], option, config);
                    }

                    option.series.push(col);
                } else {
                    // databinding 1 required
                    // geoname binding 1 required

                    var col = {};
                    col.name = data.fields[dataColorBinding[0]].name;
                    col.type = dataType; // map type here
                    col.map = map;

                    col.data = [];
                    col.roam = true;
                    option.series.push(col);

                    if (dataColorBinding.length != 1 || geoNameBinding.length != 1) {
                        console.log("map type need 1 geoname binding and 1 color binding");
                        return option;
                    }

                    var i = 0,
                        length = data.columns[dataColorBinding[0]].length;

                    for (; i < length; i++) {
                        var item = {};
                        item.name = data.columns[geoNameBinding[0]][i];
                        item.value = parseFloat(data.columns[dataColorBinding[0]][i]);
                        col.data.push(item);
                    }

                    if (dataColorBinding.length > 0) {
                        this._bindColor(0, data.columns[dataColorBinding[0]], option, config);
                    }
                }
                return option;
            },

            _buildSingleAxisOption: function(data, config, option) {
                var axisBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.axisBinding"]);
                var dataType = config["display.visualizations.custom.echarts_app.echarts.dataType"];
                var dataLabelBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataLabelBinding"]);
                var dataSizeBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataSizeBinding"]);
                var dataColorBinding = this._text2binding(config["display.visualizations.custom.echarts_app.echarts.dataColorBinding"]);

                if (dataType == "pie") {
                    option.legend = {};
                    option.legend.data = data.columns[axisBinding[0]];

                    if (dataColorBinding.length != 1) {
                        return option;
                    }

                    var col = {};
                    col.data = [];
                    col.type = dataType;
                    option.series.push(col);

                    var i = 0,
                        length = data.columns[axisBinding[0]].length;

                    for (; i < length; i++) {
                        var item = {};
                        item.value = data.columns[dataColorBinding[0]][i];
                        item.name = data.columns[axisBinding[0]][i]
                        col.data.push(item);
                    }

                } else if (dataType == "scatter") {
                    option.singleAxis = [];
                    option.singleAxis.push({
                        type: 'category',
                        data: data.columns[axisBinding[0]]
                    });

                    var dataSizeBindingIndex = undefined;
                    var dataColorBindingIndex = undefined;

                    //Caculating binding indexes, default already bind to lang/lat of locationBinding
                    var index = 0;
                    if (dataSizeBinding.length > 0) {
                        dataSizeBindingIndex = index;
                        index = index + 1;
                    }
                    if (dataColorBinding.length > 0) {
                        dataColorBindingIndex = index;
                        index = index + 1;
                    }

                    var col = {};
                    col.data = [];
                    col.coordinateSystem = 'singleAxis';
                    col.type = dataType;
                    option.series.push(col);

                    var i = 0,
                        length = data.columns[axisBinding[0]].length;

                    for (; i < length; i++) {
                        var item = [];
                        if (dataSizeBinding.length > 0) {
                            item.push(parseFloat(data.columns[dataSizeBinding[0]][i]));
                        }
                        if (dataColorBinding.length > 0) {
                            item.push(parseFloat(data.columns[dataColorBinding[0]][i]));
                        }
                        col.data.push(item);
                    }

                    if (dataSizeBinding.length > 0) {
                        this._bindSize(dataSizeBindingIndex, data.columns[dataSizeBinding[0]], option, config);
                    }

                    if (dataColorBinding.length > 0) {
                        this._bindColor(dataColorBindingIndex, data.columns[dataColorBinding[0]], option, config);
                    }

                } else {
                    console.log("Single Axis only support Pie or Scatter");
                }

                return option;
            },

            _bindLabel: function(bindIndex, col) {
                col.label = {
                    emphasis: {
                        show: true,
                        formatter: function(param) {
                            return param.data[bindIndex];
                        },
                        position: 'top'
                    }
                };
            },

            _bindSize: function(bindIndex, data, option, config) {
                var sizeMax = parseInt(config["display.visualizations.custom.echarts_app.echarts.dataSizeMax"]);
                var sizeMin = parseInt(config["display.visualizations.custom.echarts_app.echarts.dataSizeMin"]);

                var map = {};
                map.min = d3.min(data.map(function(item) {
                    return parseFloat(item);
                }));
                map.max = d3.max(data.map(function(item) {
                    return parseFloat(item);
                }));
                map.range = [map.min, map.max];
                map.calculable = true;
                map.realtime = true;
                map.dimension = bindIndex;
                map.inRange = { symbolSize: [sizeMin, sizeMax] };
                map.left = "right";
                map.top = "top";
                option.visualMap.push(map);
            },

            _bindColor: function(bindIndex, data, option, config) {
                var colorHigh = config["display.visualizations.custom.echarts_app.echarts.colorHigh"];
                var colorMedium = config["display.visualizations.custom.echarts_app.echarts.colorMedium"];
                var colorLow = config["display.visualizations.custom.echarts_app.echarts.colorLow"];

                if ($.isNumeric(data[0])) {
                    var map = {};
                    map.dimension = bindIndex;
                    map.min = d3.min(data.map(function(item) {
                        return parseFloat(item);
                    }));
                    map.max = d3.max(data.map(function(item) {
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
                    map.dimension = bindIndex;
                    map.categories = data.filter(function(value, index, self) {
                        return self.indexOf(value) === index;
                    });
                    map.inRange = { color: d3.schemeCategory10 };
                    map.left = "right";
                    map.top = "bottom";
                    option.visualMap.push(map);
                }
            }
        });
    });
