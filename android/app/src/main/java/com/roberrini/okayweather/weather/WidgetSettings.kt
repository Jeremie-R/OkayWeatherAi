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
    private const val KEY_USE_DEVICE = "useDeviceLocation"
    private const val KEY_PLACE_NAME = "placeName"
    private const val KEY_LAT = "placeLat"
    private const val KEY_LON = "placeLon"
    private const val KEY_ICON_PACK = "iconPack"

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
        val safe = if (minutes in INTERVAL_CHOICES) minutes else DEFAULT_INTERVAL_MINUTES
        prefs(context).edit().putLong(KEY_INTERVAL, safe).apply()
    }

    /** Icon set, mirroring the app's own choice. */
    fun iconPack(context: Context): IconPack =
        IconPack.from(prefs(context).getString(KEY_ICON_PACK, null))

    fun setIconPack(context: Context, id: String) {
        prefs(context).edit().putString(KEY_ICON_PACK, IconPack.from(id).id).apply()
    }

    /**
     * Whether the widget follows the device's location. False means a place
     * was pinned in Settings — see [place].
     */
    fun useDeviceLocation(context: Context): Boolean =
        prefs(context).getBoolean(KEY_USE_DEVICE, true)

    fun useDeviceLocation(context: Context, value: Boolean) {
        prefs(context).edit().putBoolean(KEY_USE_DEVICE, value).apply()
    }

    /** The pinned place, or null when following the device. */
    fun place(context: Context): Triple<Double, Double, String>? {
        val p = prefs(context)
        if (p.getBoolean(KEY_USE_DEVICE, true)) return null
        val name = p.getString(KEY_PLACE_NAME, null) ?: return null
        if (!p.contains(KEY_LAT) || !p.contains(KEY_LON)) return null
        return Triple(
            java.lang.Double.longBitsToDouble(p.getLong(KEY_LAT, 0L)),
            java.lang.Double.longBitsToDouble(p.getLong(KEY_LON, 0L)),
            name,
        )
    }

    fun placeName(context: Context): String? = place(context)?.third

    fun setPlace(context: Context, lat: Double, lon: Double, name: String) {
        prefs(context).edit()
            .putBoolean(KEY_USE_DEVICE, false)
            .putString(KEY_PLACE_NAME, name)
            // SharedPreferences has no putDouble; the raw bits round-trip exactly.
            .putLong(KEY_LAT, java.lang.Double.doubleToRawLongBits(lat))
            .putLong(KEY_LON, java.lang.Double.doubleToRawLongBits(lon))
            .apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
