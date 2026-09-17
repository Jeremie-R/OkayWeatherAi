package com.roberrini.okayweather.weather

import android.content.Context
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/**
 * What the widget needs from one OpenWeatherMap "One Call" response. Stored
 * as JSON in SharedPreferences by the refresh worker and read back by the
 * widget, so rendering never touches the network.
 */
data class WeatherSnapshot(
    /** Current temperature, °C (the app uses units=metric too). */
    val tempC: Double,
    /** OWM icon code, e.g. "02d" — maps 1:1 onto src/assets/weather-icons. */
    val icon: String,
    /** OWM weather[0].main, e.g. "Rain". Used as the icon's content description. */
    val condition: String,
    /** OWM current.dt (unix seconds). */
    val dt: Long,
    /** Wall clock at fetch time (ms). */
    val fetchedAt: Long,
    val lat: Double,
    val lon: Double,
    /** Next-hour minutely precipitation, absolute timestamps. */
    val minutely: List<MinutelyPrecip>,
) {
    /** Rain outlook relative to *now*, not to fetch time — offsets shrink as minutes pass. */
    fun upcomingRain(nowSec: Long = System.currentTimeMillis() / 1000): UpcomingRain =
        buildUpcomingRain(minutely, nowSec)

    fun toJson(): String = JSONObject().apply {
        put("tempC", tempC)
        put("icon", icon)
        put("condition", condition)
        put("dt", dt)
        put("fetchedAt", fetchedAt)
        put("lat", lat)
        put("lon", lon)
        put("minutely", JSONArray().apply {
            minutely.forEach { put(JSONObject().put("dt", it.dt).put("mm", it.mm)) }
        })
    }.toString()

    companion object {
        fun fromJson(raw: String): WeatherSnapshot? = try {
            val o = JSONObject(raw)
            val arr = o.optJSONArray("minutely") ?: JSONArray()
            WeatherSnapshot(
                tempC = o.getDouble("tempC"),
                icon = o.getString("icon"),
                condition = o.getString("condition"),
                dt = o.getLong("dt"),
                fetchedAt = o.getLong("fetchedAt"),
                lat = o.getDouble("lat"),
                lon = o.getDouble("lon"),
                minutely = List(arr.length()) { i ->
                    val p = arr.getJSONObject(i)
                    MinutelyPrecip(p.getLong("dt"), p.getDouble("mm"))
                },
            )
        } catch (e: JSONException) {
            null
        }
    }
}

/** SharedPreferences-backed store for the last snapshot. */
object WeatherStore {
    private const val PREFS = "okayweather.widget"
    private const val KEY_SNAPSHOT = "snapshot"

    fun load(context: Context): WeatherSnapshot? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_SNAPSHOT, null)
            ?.let(WeatherSnapshot::fromJson)

    fun save(context: Context, snapshot: WeatherSnapshot) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_SNAPSHOT, snapshot.toJson())
            .apply()
    }
}
