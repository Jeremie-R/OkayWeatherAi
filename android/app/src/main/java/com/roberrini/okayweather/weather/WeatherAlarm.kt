package com.roberrini.okayweather.weather

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.roberrini.okayweather.widget.WeatherWidgetReceiver

/**
 * A repeating alarm that keeps the widget current.
 *
 * Why not just WorkManager: its periodic work is subject to App Standby
 * buckets, so on a phone whose owner hasn't opened the app for a day or two a
 * "30 minute" job can slip to hours — which is exactly the "widget is stale
 * until I open the app" symptom. `setAndAllowWhileIdle` is the one scheduling
 * primitive that still fires during Doze (throttled to about once every 9
 * minutes, which is finer than any interval we offer), so it's the heartbeat
 * and WorkManager is the backstop.
 *
 * It is inexact on purpose — the system batches it with other wakeups, which
 * is much cheaper than `setExactAndAllowWhileIdle` and needs no
 * SCHEDULE_EXACT_ALARM permission.
 *
 * Alarms don't survive a reboot; the widget's own `onUpdate` re-arms it
 * (the OS re-delivers that after boot, see weather_widget_info.xml).
 */
object WeatherAlarm {
    private const val TAG = "WeatherAlarm"
    const val ACTION_TICK = "com.roberrini.okayweather.REFRESH_TICK"

    /** Arm the next tick, or cancel if no widget is on a home screen. */
    fun arm(context: Context) {
        if (!hasWidgets(context)) {
            cancel(context)
            return
        }
        val minutes = WidgetSettings.refreshIntervalMinutes(context)
        val am = context.getSystemService(AlarmManager::class.java) ?: return
        val triggerAt = System.currentTimeMillis() + minutes * 60_000L
        try {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent(context))
        } catch (e: SecurityException) {
            // Some OEM battery managers refuse alarms outright; WorkManager still covers us.
            Log.w(TAG, "Could not arm refresh alarm", e)
        }
    }

    fun cancel(context: Context) {
        context.getSystemService(AlarmManager::class.java)?.cancel(pendingIntent(context))
    }

    fun hasWidgets(context: Context): Boolean {
        val manager = AppWidgetManager.getInstance(context) ?: return false
        val provider = ComponentName(context, WeatherWidgetReceiver::class.java)
        return manager.getAppWidgetIds(provider).isNotEmpty()
    }

    private fun pendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, WeatherAlarmReceiver::class.java).setAction(ACTION_TICK)
        return PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}

/**
 * Receives [WeatherAlarm.ACTION_TICK]. Not exported: the only thing that can
 * reach it is our own PendingIntent.
 */
class WeatherAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != WeatherAlarm.ACTION_TICK) return
        WeatherRefresh.refreshNow(context)
        // Re-arm immediately: a one-shot alarm is spent once it fires, and if
        // the refresh itself fails we still want the next attempt scheduled.
        WeatherAlarm.arm(context)
    }
}
