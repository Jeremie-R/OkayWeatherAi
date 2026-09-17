package com.roberrini.okayweather.weather

import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/** OpenWeatherMap One Call 3.0 — the same endpoint src/lib/owm.ts uses. */
object WeatherApi {
    // Same public key as src/lib/owm.ts (it ships in the web bundle anyway).
    // If it gets rotated on openweathermap.org, update both places.
    private const val API_KEY = "1b749d41f9cb4c407684cc74a9c35dcc"
    private const val BASE = "https://api.openweathermap.org"

    /** Blocking; call off the main thread. */
    @Throws(IOException::class, JSONException::class)
    fun fetchCurrent(lat: Double, lon: Double): WeatherSnapshot {
        // The widget only needs `current` and the next-hour `minutely` block.
        val url = URL(
            "$BASE/data/3.0/onecall?lat=$lat&lon=$lon&units=metric" +
                "&exclude=hourly,daily,alerts&appid=$API_KEY",
        )
        val conn = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 10_000
            readTimeout = 15_000
        }
        try {
            if (conn.responseCode != HttpURLConnection.HTTP_OK) {
                throw IOException("OpenWeatherMap responded HTTP ${conn.responseCode}")
            }
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            return parse(body, lat, lon)
        } finally {
            conn.disconnect()
        }
    }

    @Throws(JSONException::class)
    internal fun parse(body: String, lat: Double, lon: Double): WeatherSnapshot {
        val json = JSONObject(body)
        val current = json.getJSONObject("current")
        val weather = current.getJSONArray("weather").getJSONObject(0)
        val minutely = json.optJSONArray("minutely")?.let { arr ->
            List(arr.length()) { i ->
                val m = arr.getJSONObject(i)
                MinutelyPrecip(m.getLong("dt"), m.optDouble("precipitation", 0.0))
            }
        } ?: emptyList()
        return WeatherSnapshot(
            tempC = current.getDouble("temp"),
            icon = weather.getString("icon"),
            condition = weather.getString("main"),
            dt = current.getLong("dt"),
            fetchedAt = System.currentTimeMillis(),
            lat = lat,
            lon = lon,
            minutely = minutely,
        )
    }
}
