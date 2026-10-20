package com.roberrini.okayweather.weather

import android.content.Context

/**
 * User-tunable widget behaviour, stored in SharedPreferences. Written by the
 * app's Settings screen (through the Capacitor bridge) and read by the
 * refresh scheduler and the widget renderer.
 */
object WidgetSettings {
    private const val PREFS = "okayweather.widget"
    private const val KEY_INTERVAL = "refreshIntervalMinutes"

    /** Keep in sync with the Settings screen's options. */
    val INTERVAL_CHOICES = listOf(15L, 30L, 60L, 180L)
    const val DEFAULT_INTERVAL_MINUTES = 15L

    /**
     * How often to try to refresh. 15 min is ~96 OpenWeatherMap calls a day,
     * comfortably inside the free tier's 1000/day.
     */
    fun refreshIntervalMinutes(context: Context): Long {
        val stored = prefs(context).getLong(KEY_INTERVAL, DEFAULT_INTERVAL_MINUTES)
        return if (stored in INTERVAL_CHOICES) stored else DEFAULT_INTERVAL_MINUTES
    }

    fun setRefreshIntervalMinutes(context: Context, minutes: Long) {
        prefs(context).edit().putLong(KEY_INTERVAL, minutes).apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
