package com.roberrini.okayweather;

import com.getcapacitor.BridgeActivity;
import com.roberrini.okayweather.weather.WeatherRefresh;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        // Opening the app is a good moment to freshen the home-screen widget —
        // and, if the user just granted location, to move it off the default city.
        WeatherRefresh.refreshNow(this);
    }
}
