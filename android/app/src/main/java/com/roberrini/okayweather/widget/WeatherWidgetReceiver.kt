package com.roberrini.okayweather.widget

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

/**
 * AppWidgetProvider entry point registered in AndroidManifest.xml.
 * Glance does the RemoteViews translation; nothing else lives here.
 *
 * TODO(refresh): override onEnabled()/onDisabled() to enqueue / cancel the
 * WorkManager periodic refresh described in WORK.md.
 */
class WeatherWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = WeatherWidget()
}
