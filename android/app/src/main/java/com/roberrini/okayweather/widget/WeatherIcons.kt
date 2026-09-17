package com.roberrini.okayweather.widget

import androidx.annotation.DrawableRes
import com.roberrini.okayweather.R

/** OpenWeatherMap icon code -> vector drawable generated from src/assets/weather-icons. */
object WeatherIcons {
    private val byCode = mapOf(
        "01d" to R.drawable.wi_01d, "01n" to R.drawable.wi_01n,
        "02d" to R.drawable.wi_02d, "02n" to R.drawable.wi_02n,
        "03d" to R.drawable.wi_03d, "03n" to R.drawable.wi_03n,
        "04d" to R.drawable.wi_04d, "04n" to R.drawable.wi_04n,
        "09d" to R.drawable.wi_09d, "09n" to R.drawable.wi_09n,
        "10d" to R.drawable.wi_10d, "10n" to R.drawable.wi_10n,
        "11d" to R.drawable.wi_11d, "11n" to R.drawable.wi_11n,
        "13d" to R.drawable.wi_13d, "13n" to R.drawable.wi_13n,
        "50d" to R.drawable.wi_50d, "50n" to R.drawable.wi_50n,
    )

    /** Same fallback as src/components/WeatherIcon.tsx: unknown/absent -> clear day. */
    @DrawableRes
    fun drawableFor(code: String?): Int = byCode[code] ?: R.drawable.wi_01d
}
