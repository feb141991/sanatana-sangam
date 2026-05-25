import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "web-push";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase URL or Service Role Key");
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("Missing VAPID keys");
    }

    webpush.setVapidDetails(
      "mailto:support@sanatansangam.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch all users who have Japa reminders enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, timezone, japa_reminder_time")
      .eq("japa_reminder_enabled", true);

    if (usersError) throw usersError;

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const sentUsers: string[] = [];

    for (const user of users || []) {
      const userTimezone = user.timezone || "UTC";
      const userReminderTime = user.japa_reminder_time || "07:00";

      // Parse user reminder time (HH:MM)
      const [remHour, remMin] = userReminderTime.split(":").map(Number);

      // Get current hour and minute in the user's timezone
      let currentHour: number;
      try {
        const userTimeStr = new Date().toLocaleString("en-US", { timeZone: userTimezone });
        const userDate = new Date(userTimeStr);
        currentHour = userDate.getHours();
      } catch {
        // Fallback to UTC if timezone is invalid
        currentHour = new Date().getUTCHours();
      }

      // Check if current hour in user's timezone matches the Japa reminder hour
      if (currentHour !== remHour) {
        continue;
      }

      // Check if user has already completed Japa today
      const { data: sadhana, error: sadhanaError } = await supabase
        .from("daily_sadhana")
        .select("japa_done")
        .eq("user_id", user.id)
        .eq("date", todayDateStr)
        .maybeSingle();

      if (sadhanaError) {
        console.error(`Error checking sadhana for user ${user.id}:`, sadhanaError);
        continue;
      }

      if (sadhana?.japa_done) {
        // Already completed Japa today! Skip reminder.
        continue;
      }

      // Fetch user's push subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", user.id);

      if (subsError) {
        console.error(`Error fetching subscriptions for user ${user.id}:`, subsError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        continue;
      }

      // Send push notification to all subscriptions
      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          const payload = JSON.stringify({
            title: "🔔 Time for Japa",
            body: "Your daily Japa practice awaits. Keep your streak alive 🙏",
            icon: "/icons/icon-192x192.png",
          });

          await webpush.sendNotification(pushSubscription, payload);
          sentUsers.push(user.id);
        } catch (pushErr) {
          console.error(`Error sending push to subscription for user ${user.id}:`, pushErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, notified_users: sentUsers }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Japa reminder function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
