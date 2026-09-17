package com.roberrini.okayweather.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import com.roberrini.okayweather.MainActivity
import com.roberrini.okayweather.R
import com.roberrini.okayweather.weather.UpcomingRain
import com.roberrini.okayweather.weather.WeatherSnapshot
import com.roberrini.okayweather.weather.WeatherStore
import kotlin.math.roundToInt

/**
 * Okay Weather home-screen widget (2x2, Jetpack Glance).
 *
 * Two looks, picked at render time from the stored [WeatherSnapshot]:
 *  - [TemperaturePill]: a 45° capsule with the condition icon and the current
 *    temperature — the Material You showcase look.
 *  - [RainCard]: when rain is due within the hour (same rule as the app's
 *    "Upcoming rain" section) the widget squares off and shows the summary
 *    plus the next-hour rain chart.
 *
 * Data comes from WeatherRefreshWorker; tapping anywhere opens the app.
 */
class WeatherWidget : GlanceAppWidget() {

    // Exact size so the layout can position the pill contents in dp.
    override val sizeMode: SizeMode = SizeMode.Exact

    // Per-widget DataStore state. Reading the snapshot from here (rather than
    // once in provideGlance) is what makes updateAll() recompose with fresh
    // data while a Glance session is still open.
    override val stateDefinition = PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // A freshly placed widget has empty state; seed it from the shared
        // cache so it doesn't sit on the placeholder until the next fetch.
        WeatherStore.load(context)?.let { cached ->
            updateAppWidgetState(context, id) { prefs ->
                if (prefs[SNAPSHOT_KEY] == null) prefs[SNAPSHOT_KEY] = cached.toJson()
            }
        }
        provideContent {
            // No explicit colors = Material You dynamic colors (Android 12+).
            GlanceTheme {
                WeatherWidgetContent()
            }
        }
    }

    companion object {
        val SNAPSHOT_KEY = stringPreferencesKey("snapshot")

        /** Push [snapshot] into every placed widget's state and re-render them. */
        suspend fun publish(context: Context, snapshot: WeatherSnapshot) {
            val json = snapshot.toJson()
            val manager = GlanceAppWidgetManager(context)
            manager.getGlanceIds(WeatherWidget::class.java).forEach { id ->
                updateAppWidgetState(context, id) { prefs -> prefs[SNAPSHOT_KEY] = json }
            }
            WeatherWidget().updateAll(context)
        }
    }
}

@Composable
private fun WeatherWidgetContent() {
    val snapshot = currentState<Preferences>()[WeatherWidget.SNAPSHOT_KEY]?.let(WeatherSnapshot::fromJson)
    val openApp = actionStartActivity<MainActivity>()
    val rain = snapshot?.upcomingRain()
    if (snapshot != null && rain != null && rain.hasRain) {
        RainCard(snapshot, rain, openApp)
    } else {
        TemperaturePill(snapshot, openApp)
    }
}

/*
 * Pill geometry, as fractions of S = the square the capsule is fitted into
 * (see res/drawable/widget_pill_45.xml). Measured from the design mock:
 * temperature centred on the top-right lobe, icon on the bottom-left lobe.
 */
private const val TEMP_BOX_LEFT = 0.43f
private const val TEMP_BOX_TOP = 0.235f
private const val TEMP_BOX_WIDTH = 0.42f
private const val TEMP_FONT = 0.21f
private const val ICON_LEFT = 0.20f
private const val ICON_TOP = 0.38f
private const val ICON_SIZE = 0.42f

@Composable
private fun TemperaturePill(snapshot: WeatherSnapshot?, onClick: Action) {
    val context = LocalContext.current
    val cell = LocalSize.current
    val s = min(cell.width, cell.height)
    // The pill is Fit-scaled and centred in the cell; offset content to match.
    val ox = (cell.width - s) / 2
    val oy = (cell.height - s) / 2

    Box(modifier = GlanceModifier.fillMaxSize().clickable(onClick)) {
        Image(
            provider = ImageProvider(R.drawable.widget_pill_45),
            contentDescription = null,
            modifier = GlanceModifier.fillMaxSize(),
            contentScale = ContentScale.Fit,
            // Neutral surface (near-white / near-black by theme) rather than the
            // accent container: the icons' purples and yellows clash with lavender.
            colorFilter = ColorFilter.tint(GlanceTheme.colors.surface),
        )
        Box(modifier = GlanceModifier.padding(start = ox + s * TEMP_BOX_LEFT, top = oy + s * TEMP_BOX_TOP)) {
            Text(
                text = snapshot?.let { "${it.tempC.roundToInt()}°" }
                    ?: context.getString(R.string.widget_temp_placeholder),
                modifier = GlanceModifier.width(s * TEMP_BOX_WIDTH),
                style = TextStyle(
                    color = GlanceTheme.colors.onSurface,
                    fontSize = (s.value * TEMP_FONT).sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                ),
                maxLines = 1,
            )
        }
        Box(modifier = GlanceModifier.padding(start = ox + s * ICON_LEFT, top = oy + s * ICON_TOP)) {
            Image(
                provider = ImageProvider(WeatherIcons.drawableFor(snapshot?.icon)),
                contentDescription = snapshot?.condition ?: context.getString(R.string.widget_no_data),
                modifier = GlanceModifier.size(s * ICON_SIZE),
            )
        }
    }
}

private val CARD_PADDING = 14.dp
private val CARD_RADIUS = 28.dp
private val CARD_ICON = 36.dp
private val CARD_SUMMARY_HEIGHT = 34.dp
private val CARD_GAP = 6.dp

@Composable
private fun RainCard(snapshot: WeatherSnapshot, rain: UpcomingRain, onClick: Action) {
    val context = LocalContext.current
    val cell = LocalSize.current
    val onSurface = GlanceTheme.colors.onSurface

    // Chart bitmap sized to whatever is left under the header, in real pixels.
    val density = context.resources.displayMetrics.density
    val chartWidth = cell.width - CARD_PADDING * 2
    val chartHeight = cell.height - CARD_PADDING * 2 - CARD_ICON - CARD_SUMMARY_HEIGHT - CARD_GAP * 2
    val chart = RainChart.render(
        points = rain.points,
        widthPx = (chartWidth.value * density).roundToInt(),
        heightPx = (maxOf(chartHeight.value, 32f) * density).roundToInt(),
        density = density,
        lineColor = RAIN_LINE_COLOR,
        labelColor = onSurface.getColor(context).copy(alpha = 0.6f).toArgb(),
    )

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.surface)
            .cornerRadius(CARD_RADIUS)
            .clickable(onClick)
            .padding(CARD_PADDING),
    ) {
        Column(modifier = GlanceModifier.fillMaxSize()) {
            Row(
                modifier = GlanceModifier.fillMaxWidth().height(CARD_ICON),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Image(
                    provider = ImageProvider(WeatherIcons.drawableFor(snapshot.icon)),
                    contentDescription = snapshot.condition,
                    modifier = GlanceModifier.size(CARD_ICON),
                )
                Spacer(modifier = GlanceModifier.width(8.dp))
                Text(
                    text = "${snapshot.tempC.roundToInt()}°",
                    style = TextStyle(color = onSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold),
                    maxLines = 1,
                )
            }
            Spacer(modifier = GlanceModifier.height(CARD_GAP))
            Text(
                text = context.getString(R.string.widget_rain_summary, rain.summary),
                modifier = GlanceModifier.fillMaxWidth().height(CARD_SUMMARY_HEIGHT),
                style = TextStyle(color = onSurface, fontSize = 12.sp, fontWeight = FontWeight.Medium),
                maxLines = 2,
            )
            Spacer(modifier = GlanceModifier.height(CARD_GAP))
            Image(
                provider = ImageProvider(chart),
                contentDescription = null,
                modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
                contentScale = ContentScale.Fit,
            )
        }
    }
}

/** The app's --chart-rain (oklch 0.68 0.15 240) in sRGB; kept brand-blue in both themes. */
private const val RAIN_LINE_COLOR = 0xFF1AA2EB.toInt()
