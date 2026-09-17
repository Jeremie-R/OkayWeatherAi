package com.roberrini.okayweather.widget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Shader
import com.roberrini.okayweather.weather.RainPoint
import kotlin.math.max
import kotlin.math.sqrt

/**
 * Renders the next-hour rain area chart to a bitmap (RemoteViews can't draw,
 * so Glance shows it as an Image). Mirrors UpcomingRainChart in
 * src/components/UpcomingRainSection.tsx: monotone curve, gradient fill,
 * "now / +15 / +30 / +45 / +60" axis, y domain 0..max+0.2.
 */
object RainChart {

    fun render(
        points: List<RainPoint>,
        widthPx: Int,
        heightPx: Int,
        density: Float,
        lineColor: Int,
        labelColor: Int,
    ): Bitmap {
        val w = max(widthPx, 1)
        val h = max(heightPx, 1)
        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val labelSize = 9f * density
        val plotTop = 3f * density
        val plotBottom = h - labelSize - 6f * density
        val plotH = max(plotBottom - plotTop, 1f)
        val maxMm = max(points.maxOfOrNull { it.mm } ?: 0.0, 0.0) + 0.2

        fun x(minute: Int) = minute / 60f * w
        fun y(mm: Double) = (plotBottom - (mm / maxMm) * plotH).toFloat()

        val xs = points.map { x(it.minute) }
        val ys = points.map { y(it.mm) }
        val line = monotonePath(xs, ys)

        if (points.size >= 2) {
            val area = Path(line).apply {
                lineTo(xs.last(), plotBottom)
                lineTo(xs.first(), plotBottom)
                close()
            }
            val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                shader = LinearGradient(
                    0f, plotTop, 0f, plotBottom,
                    withAlpha(lineColor, 0.55f), withAlpha(lineColor, 0.05f),
                    Shader.TileMode.CLAMP,
                )
            }
            canvas.drawPath(area, fill)
            val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 2f * density
                strokeJoin = Paint.Join.ROUND
                strokeCap = Paint.Cap.ROUND
                color = lineColor
            }
            canvas.drawPath(line, stroke)
        }

        val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = labelColor
            textSize = labelSize
        }
        val baseline = h - 2f * density
        for (minute in intArrayOf(0, 15, 30, 45, 60)) {
            text.textAlign = when (minute) {
                0 -> Paint.Align.LEFT
                60 -> Paint.Align.RIGHT
                else -> Paint.Align.CENTER
            }
            canvas.drawText(if (minute == 0) "now" else "+$minute", x(minute), baseline, text)
        }
        return bitmap
    }

    /** Fritsch–Carlson monotone cubic through the points: no overshoot below zero. */
    private fun monotonePath(xs: List<Float>, ys: List<Float>): Path {
        val path = Path()
        val n = xs.size
        if (n == 0) return path
        path.moveTo(xs[0], ys[0])
        if (n == 1) return path

        val d = FloatArray(n - 1) { i -> (ys[i + 1] - ys[i]) / max(xs[i + 1] - xs[i], 0.001f) }
        val m = FloatArray(n)
        m[0] = d[0]
        m[n - 1] = d[n - 2]
        for (i in 1 until n - 1) m[i] = if (d[i - 1] * d[i] <= 0f) 0f else (d[i - 1] + d[i]) / 2f
        for (i in 0 until n - 1) {
            if (d[i] == 0f) {
                m[i] = 0f
                m[i + 1] = 0f
            } else {
                val a = m[i] / d[i]
                val b = m[i + 1] / d[i]
                val s = a * a + b * b
                if (s > 9f) {
                    val t = 3f / sqrt(s)
                    m[i] = t * a * d[i]
                    m[i + 1] = t * b * d[i]
                }
            }
        }
        for (i in 0 until n - 1) {
            val dx = (xs[i + 1] - xs[i]) / 3f
            path.cubicTo(
                xs[i] + dx, ys[i] + m[i] * dx,
                xs[i + 1] - dx, ys[i + 1] - m[i + 1] * dx,
                xs[i + 1], ys[i + 1],
            )
        }
        return path
    }

    private fun withAlpha(color: Int, alpha: Float): Int =
        Color.argb((alpha * 255).toInt(), Color.red(color), Color.green(color), Color.blue(color))
}
