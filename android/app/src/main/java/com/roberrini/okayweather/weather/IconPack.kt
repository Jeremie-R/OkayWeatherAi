package com.roberrini.okayweather.weather

/**
 * The icon sets the app ships. Kept in sync with IconPack in
 * src/lib/settings.ts — the widget follows whatever the app is set to.
 */
enum class IconPack(val id: String) {
    MODERN("modern"),
    CANDY("candy"),
    CLASSIC("classic");

    companion object {
        fun from(id: String?): IconPack = entries.firstOrNull { it.id == id } ?: MODERN
    }
}
