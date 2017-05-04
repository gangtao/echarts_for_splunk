# echarts_for_splunk


### Installation and Build
Customer visualization for splunk using echarts, to install the app, run below commands:
```
export SPLUNK_HOME
cp echarts_app $SPLUNK_HOME/etc/apps
cd $SPLUNK_HOME/etc/apps/echarts_app/appserver/static/visualizations
npm install
npm run build
```

### Usage


#### Pie
   * SPL
		```
		source="drinks.csv" 
		| table country, wine_servings,  beer_servings, spirit_servings,total_litres_of_pure_alcohol 
		| head 5
		```
   * Coordinates -> Coordinates Type ＝ Single Axis
   * Single Axis -> Axis Binding = 0  (country)
   * Data Series -> Data Type = Pie
   * Data Series -> Data Color Binding = 1 (wine_servings)

![](https://static.oschina.net/uploads/space/2017/0502/114658_p5c6_1450051.png)

#### Single Axis Scatter
   * SPL
		```
		source="drinks.csv" 
		| table country, wine_servings,  beer_servings, spirit_servings, total_litres_of_pure_alcohol 
		```
   * Coordinates -> Coordinates Type ＝ Single Axis
   * Single Axis -> Axis Binding = 0  (country)
   * Data Series -> Data Type = Scatter
   * Data Series -> Data Color Binding = 1 (wine_servings)

![](https://static.oschina.net/uploads/space/2017/0502/120257_f5MC_1450051.png)

#### Column Chart
   * SPL
		```
		source="drinks.csv" 
		| table country, wine_servings,  beer_servings, spirit_servings, total_litres_of_pure_alcohol 
		| head 10
		```
   * Coordinates -> Coordinates Type ＝ X-Y
   * X-Y Axis -> X-Axis Binding = 0 (country)
   * X-Y Axis -> X-Axis Type = Category
   * X-Y Axis -> Y-Axis Binding = 1,2 (wine_servings,  beer_servings)
   * X-Y Axis -> Y-Axis Type = Value
   * Data Series -> Data Type = Bar

![](https://static.oschina.net/uploads/space/2017/0502/120629_DxeP_1450051.png)




