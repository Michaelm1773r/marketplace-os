import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 mt-1">Stay updated on your projects.</p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 ${n.read ? "" : "bg-blue-50/50"}`}>
                <p className="font-medium text-sm text-slate-900">{n.title}</p>
                {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
