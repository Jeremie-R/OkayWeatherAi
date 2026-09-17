package com.roberrini.okayweather.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import com.roberrini.okayweather.weather.WeatherRefresh

/**
 * AppWidgetProvider entry point registered in AndroidManifest.xml. Glance does
 * the RemoteViews translation; this class only owns the refresh schedule.
 */
class WeatherWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = WeatherWidget()

    /** First instance placed: start the 30-minute cycle and fetch right away. */
    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        WeatherRefresh.schedule(context)
        WeatherRefresh.refreshNow(context)
    }

    /** Last instance removed: stop polling OpenWeatherMap. */
    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        WeatherRefresh.cancel(context)
    }

    /** Also fires after reboot / launcher restarts — make sure the schedule survived. */
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        WeatherRefresh.schedule(context)
        WeatherRefresh.refreshNow(context)
    }
}
