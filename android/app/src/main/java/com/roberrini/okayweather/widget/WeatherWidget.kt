package com.roberrini.okayweather.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.roberrini.okayweather.R

/**
 * Home-screen widget for Okay Weather, built with Jetpack Glance.
 *
 * SCAFFOLD ONLY: renders a static placeholder pill. It has no data source
 * yet — see WORK.md at the repo root for the wiring plan (weather fetch in
 * Kotlin vs. a Capacitor plugin bridge from the WebView app, plus a
 * WorkManager periodic refresh). Keep the pill shape: the target design is
 * a single rounded capsule showing temperature + condition.
 */
class WeatherWidget : GlanceAppWidget() {

    // One layout regardless of the size the launcher gives us. Switch to
    // SizeMode.Responsive(setOf(...)) once the pill has variants (e.g. a
    // compact temp-only pill vs. temp + condition + location).
    override val sizeMode: SizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // TODO(data): load the latest WeatherSnapshot here (DataStore /
        // SharedPreferences written by the refresh worker or the WebView
        // bridge) and pass it into WeatherPill(). Until then it's static.
        provideContent {
            // GlanceTheme with no explicit colors = Material You dynamic
            // colors on Android 12+, a neutral static palette below that.
            GlanceTheme {
                WeatherPill()
            }
        }
    }
}

/** Capsule height. Launcher rows are taller than this (≈130dp on a Pixel), so
 *  the pill floats centered in a transparent cell instead of filling it. */
private val PillHeight = 56.dp

@Composable
private fun WeatherPill() {
    val context = LocalContext.current
    // Outer box = the launcher cell (transparent). Inner box = the pill, with a
    // fixed height so it stays a capsule whatever cell height the launcher gives.
    Box(
        modifier = GlanceModifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = GlanceModifier
                .fillMaxWidth()
                .height(PillHeight)
                .background(GlanceTheme.colors.primaryContainer)
                // Half the height = full capsule. No-op below Android 12
                // (RemoteViews can't clip there), where it's a plain rect.
                .cornerRadius(PillHeight / 2)
                .padding(horizontal = 20.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = context.getString(R.string.widget_placeholder),
                style = TextStyle(
                    color = GlanceTheme.colors.onPrimaryContainer,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                ),
                maxLines = 1,
            )
        }
    }
}
