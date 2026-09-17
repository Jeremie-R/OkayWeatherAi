package com.roberrini.okayweather.weather

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.core.content.ContextCompat

/**
 * Where to fetch weather for. Mirrors the web app: device location when the
 * user has granted it (the WebView's geolocation prompt grants the same
 * Android permission), otherwise the app's default city.
 */
object WidgetLocation {
    data class LatLon(val lat: Double, val lon: Double)

    /** Same default as src/routes/_tabs.index.tsx (Amsterdam). */
    val DEFAULT = LatLon(52.3676, 4.9041)

    fun resolve(context: Context): LatLon {
        val granted = listOf(
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ).any { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }
        if (!granted) return DEFAULT

        val lm = context.getSystemService(LocationManager::class.java) ?: return DEFAULT
        // Last known fix is enough for weather; no need to power up GPS from a worker.
        val best = try {
            lm.allProviders
                .mapNotNull { provider -> runCatching { lm.getLastKnownLocation(provider) }.getOrNull() }
                .maxByOrNull { it.time }
        } catch (e: SecurityException) {
            null
        }
        return best?.let { LatLon(it.latitude, it.longitude) } ?: DEFAULT
    }
}
