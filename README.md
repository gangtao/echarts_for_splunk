# echarts_for_splunk
customer visualization for splunk using echarts
To install the app, follow below commands:
```
export SPLUNK_HOME
cp echarts_app $SPLUNK_HOME/etc/apps
cd $SPLUNK_HOME/etc/apps/echarts_app/appserver/static/visualizations
npm install
npm run build
```
