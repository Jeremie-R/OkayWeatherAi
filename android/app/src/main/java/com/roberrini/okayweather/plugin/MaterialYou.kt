package com.roberrini.okayweather.plugin

import android.content.Context
import android.os.Build
import androidx.annotation.ColorInt
import androidx.annotation.RequiresApi

/**
 * Reads Android's wallpaper-derived palette (Material You, Android 12+).
 *
 * The system exposes it as plain colour resources — `system_accent1_600` and
 * friends — so there's nothing to compute here; we just hand the WebView the
 * shades the stylesheet needs.
 */
object MaterialYou {
    /** Shades we map onto CSS variables. Android publishes 0,10,50,100..900,1000. */
    private val SHADES = intArrayOf(0, 10, 50, 100, 200, 300, 600, 700, 800, 900)

    val isSupported: Boolean get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

    /** Map of e.g. "accent1_600" -> "#aabbcc", or null below Android 12. */
    fun palette(context: Context): Map<String, String>? {
        if (!isSupported) return null
        return buildMap {
            putRamp(context, "accent1", android.R.color.system_accent1_0)
            putRamp(context, "accent2", android.R.color.system_accent2_0)
            putRamp(context, "accent3", android.R.color.system_accent3_0)
            putRamp(context, "neutral1", android.R.color.system_neutral1_0)
            putRamp(context, "neutral2", android.R.color.system_neutral2_0)
        }
    }

    /**
     * The ramp resource ids are consecutive in shade order, so the first id
     * plus an index gives the rest — which avoids naming all 13 per ramp.
     */
    @RequiresApi(Build.VERSION_CODES.S)
    private fun MutableMap<String, String>.putRamp(context: Context, name: String, firstId: Int) {
        val order = intArrayOf(0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)
        for (shade in SHADES) {
            val index = order.indexOf(shade)
            if (index < 0) continue
            val color = context.getColor(firstId + index)
            put("${name}_$shade", hex(color))
        }
    }

    private fun hex(@ColorInt color: Int): String = String.format("#%06X", 0xFFFFFF and color)
}
