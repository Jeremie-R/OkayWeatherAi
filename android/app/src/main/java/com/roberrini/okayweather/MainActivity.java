package com.roberrini.okayweather;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.roberrini.okayweather.plugin.OkayWeatherPlugin;
import com.roberrini.okayweather.weather.WeatherRefresh;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be registered before super.onCreate() builds the bridge.
        registerPlugin(OkayWeatherPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Opening the app is a good moment to freshen the home-screen widget —
        // and, if the user just granted location, to move it off the default city.
        WeatherRefresh.refreshNow(this);
    }
}
