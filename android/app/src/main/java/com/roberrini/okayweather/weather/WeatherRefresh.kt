package com.roberrini.okayweather.weather

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.roberrini.okayweather.widget.WeatherWidget
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Fetches the current weather, stores it and re-renders every widget.
 * Scheduled by [WeatherRefresh]; never runs on the main thread.
 */
class WeatherRefreshWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val location = WidgetLocation.resolve(applicationContext)
        val snapshot = try {
            withContext(Dispatchers.IO) { WeatherApi.fetchCurrent(location.lat, location.lon) }
        } catch (e: IOException) {
            Log.w(TAG, "Weather fetch failed (attempt ${runAttemptCount + 1})", e)
            return if (runAttemptCount < MAX_RETRIES) Result.retry() else Result.failure()
        } catch (e: JSONException) {
            Log.e(TAG, "Unexpected OpenWeatherMap payload", e)
            return Result.failure()
        }

        WeatherStore.save(applicationContext, snapshot)
        WeatherWidget.publish(applicationContext, snapshot)

        // Rain within the hour: "starts in ~12 min" goes stale fast, so follow
        // up well before the regular 30-minute cycle.
        if (snapshot.upcomingRain().hasRain) {
            WeatherRefresh.followUp(applicationContext, RAIN_FOLLOW_UP_MINUTES)
        }
        return Result.success()
    }

    private companion object {
        const val TAG = "WeatherRefresh"
        const val MAX_RETRIES = 3
        const val RAIN_FOLLOW_UP_MINUTES = 10L
    }
}

/** Scheduling entry points. All work is unique so repeated calls never pile up. */
object WeatherRefresh {
    private const val PERIODIC = "okayweather.refresh.periodic"
    private const val NOW = "okayweather.refresh.now"
    private const val FOLLOW_UP = "okayweather.refresh.followup"

    /** OpenWeatherMap's free tier is generous, but 30 min keeps it comfortable. */
    private const val PERIOD_MINUTES = 30L

    private val online = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /** Idempotent: keeps an existing periodic job (and its timing) if one is queued. */
    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<WeatherRefreshWorker>(PERIOD_MINUTES, TimeUnit.MINUTES)
            .setConstraints(online)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(PERIODIC, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    fun cancel(context: Context) {
        WorkManager.getInstance(context).apply {
            cancelUniqueWork(PERIODIC)
            cancelUniqueWork(NOW)
            cancelUniqueWork(FOLLOW_UP)
        }
    }

    /** Refresh as soon as the network allows (widget placed, app opened, ...). */
    @JvmStatic // called from MainActivity.java
    fun refreshNow(context: Context) {
        val request = OneTimeWorkRequestBuilder<WeatherRefreshWorker>()
            .setConstraints(online)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(NOW, ExistingWorkPolicy.REPLACE, request)
    }

    /**
     * Refresh again in [minutes]. APPEND_OR_REPLACE chains a new run after the
     * current one instead of cancelling it, so a worker may safely call this
     * about itself; the chain simply stops once the rain has passed.
     */
    fun followUp(context: Context, minutes: Long) {
        val request = OneTimeWorkRequestBuilder<WeatherRefreshWorker>()
            .setConstraints(online)
            .setInitialDelay(minutes, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(FOLLOW_UP, ExistingWorkPolicy.APPEND_OR_REPLACE, request)
    }
}
