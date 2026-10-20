package com.roberrini.okayweather.widget

import androidx.annotation.DrawableRes
import com.roberrini.okayweather.R
import com.roberrini.okayweather.weather.IconPack

/**
 * OpenWeatherMap icon code -> vector drawable, per pack.
 *
 * The drawables are generated from the app's SVGs by tools/svg_to_vector.py;
 * rerun it after changing anything in src/assets/weather-icons-*.
 */
object WeatherIcons {
    private val MODERN = mapOf(
        "01d" to R.drawable.wi_modern_01d, "01n" to R.drawable.wi_modern_01n, "02d" to R.drawable.wi_modern_02d,
        "02n" to R.drawable.wi_modern_02n, "03d" to R.drawable.wi_modern_03d, "03n" to R.drawable.wi_modern_03n,
        "04d" to R.drawable.wi_modern_04d, "04n" to R.drawable.wi_modern_04n, "09d" to R.drawable.wi_modern_09d,
        "09n" to R.drawable.wi_modern_09n, "10d" to R.drawable.wi_modern_10d, "10n" to R.drawable.wi_modern_10n,
        "11d" to R.drawable.wi_modern_11d, "11n" to R.drawable.wi_modern_11n, "13d" to R.drawable.wi_modern_13d,
        "13n" to R.drawable.wi_modern_13n, "50d" to R.drawable.wi_modern_50d, "50n" to R.drawable.wi_modern_50n,
    )

    private val CANDY = mapOf(
        "01d" to R.drawable.wi_candy_01d, "01n" to R.drawable.wi_candy_01n, "02d" to R.drawable.wi_candy_02d,
        "02n" to R.drawable.wi_candy_02n, "03d" to R.drawable.wi_candy_03d, "03n" to R.drawable.wi_candy_03n,
        "04d" to R.drawable.wi_candy_04d, "04n" to R.drawable.wi_candy_04n, "09d" to R.drawable.wi_candy_09d,
        "09n" to R.drawable.wi_candy_09n, "10d" to R.drawable.wi_candy_10d, "10n" to R.drawable.wi_candy_10n,
        "11d" to R.drawable.wi_candy_11d, "11n" to R.drawable.wi_candy_11n, "13d" to R.drawable.wi_candy_13d,
        "13n" to R.drawable.wi_candy_13n, "50d" to R.drawable.wi_candy_50d, "50n" to R.drawable.wi_candy_50n,
    )

    private val CLASSIC = mapOf(
        "01d" to R.drawable.wi_classic_01d, "01n" to R.drawable.wi_classic_01n, "02d" to R.drawable.wi_classic_02d,
        "02n" to R.drawable.wi_classic_02n, "03d" to R.drawable.wi_classic_03d, "03n" to R.drawable.wi_classic_03n,
        "04d" to R.drawable.wi_classic_04d, "04n" to R.drawable.wi_classic_04n, "09d" to R.drawable.wi_classic_09d,
        "09n" to R.drawable.wi_classic_09n, "10d" to R.drawable.wi_classic_10d, "10n" to R.drawable.wi_classic_10n,
        "11d" to R.drawable.wi_classic_11d, "11n" to R.drawable.wi_classic_11n, "13d" to R.drawable.wi_classic_13d,
        "13n" to R.drawable.wi_classic_13n, "50d" to R.drawable.wi_classic_50d, "50n" to R.drawable.wi_classic_50n,
    )

    private val BY_PACK: Map<IconPack, Map<String, Int>> = mapOf(
        IconPack.MODERN to MODERN,
        IconPack.CANDY to CANDY,
        IconPack.CLASSIC to CLASSIC,
    )

    /** Same fallback as src/components/WeatherIcon.tsx: unknown code -> clear day. */
    @DrawableRes
    fun drawableFor(pack: IconPack, code: String?): Int {
        val map = BY_PACK[pack] ?: MODERN
        return map[code] ?: map.getValue("01d")
    }
}
