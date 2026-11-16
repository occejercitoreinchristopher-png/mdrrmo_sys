<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Retrieve system notifications for the authenticated responder
     */
    public function index(Request $request)
    {
        $notifications = SystemNotification::where('user_id', $request->user()->id)
            ->with(['incident.incidentType', 'dispatch'])
            ->latest()
            ->paginate(30);

        $unreadCount = SystemNotification::where('user_id', $request->user()->id)
            ->where('status', 'unread')
            ->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications->items(),
            'total' => $notifications->total(),
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a specific notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = SystemNotification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated responder
     */
    public function markAllAsRead(Request $request)
    {
        SystemNotification::where('user_id', $request->user()->id)
            ->where('status', 'unread')
            ->update([
                'status' => 'read',
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}
