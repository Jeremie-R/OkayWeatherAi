package com.roberrini.okayweather.plugin

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.roberrini.okayweather.weather.WeatherAlarm
import com.roberrini.okayweather.weather.WeatherRefresh
import com.roberrini.okayweather.weather.WidgetSettings

/**
 * The web app's window onto the things only the native shell knows:
 * the Material You palette, and the home-screen widget's configuration.
 *
 * Registered in MainActivity. On the web build these calls simply don't
 * exist — see src/lib/native.ts, which degrades to "not available".
 */
@CapacitorPlugin(name = "OkayWeatherNative")
class OkayWeatherPlugin : Plugin() {

    /** `{ available: boolean, colors?: { accent1_600: "#...", ... } }` */
    @PluginMethod
    fun getMaterialYouPalette(call: PluginCall) {
        val colors = MaterialYou.palette(context)
        val result = JSObject().put("available", colors != null)
        if (colors != null) {
            val obj = JSObject()
            colors.forEach { (key, value) -> obj.put(key, value) }
            result.put("colors", obj)
        }
        call.resolve(result)
    }

    @PluginMethod
    fun getWidgetConfig(call: PluginCall) {
        call.resolve(
            JSObject()
                .put("refreshIntervalMinutes", WidgetSettings.refreshIntervalMinutes(context))
                .put("useDeviceLocation", WidgetSettings.useDeviceLocation(context))
                .put("placeName", WidgetSettings.placeName(context))
                .put("hasWidget", WeatherAlarm.hasWidgets(context)),
        )
    }

    /**
     * Any subset of the config. Each applied field re-arms the schedule and
     * kicks off a refresh so the widget reflects the change immediately
     * rather than at the next tick.
     */
    @PluginMethod
    fun setWidgetConfig(call: PluginCall) {
        call.getInt("refreshIntervalMinutes")?.let {
            WidgetSettings.setRefreshIntervalMinutes(context, it.toLong())
        }
        // A pinned place needs all three values; anything else means "follow
        // the device", which is also what clears a previously pinned place.
        val useDevice = call.getBoolean("useDeviceLocation")
        val lat = call.getDouble("lat")
        val lon = call.getDouble("lon")
        val name = call.getString("placeName")
        if (useDevice == true) {
            WidgetSettings.useDeviceLocation(context, true)
        } else if (lat != null && lon != null && name != null) {
            WidgetSettings.setPlace(context, lat, lon, name)
        }

        WeatherRefresh.schedule(context)
        WeatherAlarm.arm(context)
        WeatherRefresh.refreshNow(context)
        call.resolve(JSObject().put("ok", true))
    }
}
