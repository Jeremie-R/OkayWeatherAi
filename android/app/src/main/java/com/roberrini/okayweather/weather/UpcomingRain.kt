package com.roberrini.okayweather.weather

import kotlin.math.max
import kotlin.math.roundToInt

/** One entry of OpenWeatherMap's minutely forecast: unix seconds and mm/h. */
data class MinutelyPrecip(val dt: Long, val mm: Double)

/** A minute offset from "now" (0..60) and its precipitation in mm/h. */
data class RainPoint(val minute: Int, val mm: Double)

data class UpcomingRain(
    val hasRain: Boolean,
    val points: List<RainPoint>,
    val summary: String,
    val peakMm: Double,
) {
    companion object {
        val NONE = UpcomingRain(hasRain = false, points = emptyList(), summary = "", peakMm = 0.0)
    }
}

/** Anything at/above this is "real" rain (mm/h). Below = sensor noise. */
private const val RAIN_FLOOR = 0.05

/**
 * Port of src/lib/upcomingRain.ts — keep the two in sync so the widget flips
 * to its rain card exactly when the app shows its "Upcoming rain" section.
 */
fun buildUpcomingRain(minutely: List<MinutelyPrecip>, nowDt: Long): UpcomingRain {
    if (minutely.isEmpty()) return UpcomingRain.NONE

    // Map to 0..60 minute offsets from `nowDt`. Drop negatives and > 60.
    val points = minutely
        .mapNotNull { m ->
            val offset = ((m.dt - nowDt) / 60.0).roundToInt()
            if (offset < 0 || offset > 60) null else RainPoint(offset, max(0.0, m.mm))
        }
        .sortedBy { it.minute }
    if (points.isEmpty()) return UpcomingRain.NONE

    val peakMm = points.maxOf { it.mm }
    if (peakMm < RAIN_FLOOR) return UpcomingRain.NONE

    val startMin = points.first { it.mm >= RAIN_FLOOR }.minute
    val endMin = points.last { it.mm >= RAIN_FLOOR }.minute
    val rainingNow = points[0].mm >= RAIN_FLOOR

    val intensity = when {
        peakMm < 0.5 -> "Light"
        peakMm < 2.5 -> "Moderate"
        else -> "Heavy"
    }

    val summary = when {
        !rainingNow -> "Starts in ~$startMin min" + (if (endMin < 60) ", eases by +$endMin" else "")
        endMin >= 60 -> "$intensity rain for the next hour"
        endMin <= 5 -> "Easing off now"
        else -> "$intensity rain, eases in ~$endMin min"
    }

    return UpcomingRain(hasRain = true, points = points, summary = summary, peakMm = peakMm)
}
