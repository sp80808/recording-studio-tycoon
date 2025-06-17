using System;

namespace RecordingStudioTycoon.DataModels.Notifications
{
    public enum NotificationType
    {
        Info,
        Warning,
        Error,
        Success,
        Event,
        Achievement
    }

    public enum NotificationCategory
    {
        General,
        Project,
        Staff,
        Finance,
        Market,
        Equipment,
        Studio,
        Progression
    }

    [System.Serializable]
    public class GameNotification
    {
        public string Id;
        public string Title;
        public string Message;
        public NotificationType Type;
        public NotificationCategory Category;
        public bool IsRead;
        public bool IsCleared;
        public DateTime Timestamp;
        public string RelatedEntityId; // e.g., project ID, staff ID
        public string ActionText; // e.g., "View Details"
        public string ActionCommand; // e.g., "open_project_details:proj_123"
        public int DurationSeconds; // How long to display (0 for persistent until dismissed)

        public GameNotification()
        {
            Id = Guid.NewGuid().ToString();
            Title = "Notification";
            Message = "Something happened in the game.";
            Type = NotificationType.Info;
            Category = NotificationCategory.General;
            IsRead = false;
            IsCleared = false;
            Timestamp = DateTime.Now;
            RelatedEntityId = "";
            ActionText = "";
            ActionCommand = "";
            DurationSeconds = 5;
        }

        public GameNotification(string title, string message, NotificationType type, NotificationCategory category, string relatedId = "", string actionText = "", string actionCommand = "", int duration = 5)
        {
            Id = Guid.NewGuid().ToString();
            Title = title;
            Message = message;
            Type = type;
            Category = category;
            IsRead = false;
            IsCleared = false;
            Timestamp = DateTime.Now;
            RelatedEntityId = relatedId;
            ActionText = actionText;
            ActionCommand = actionCommand;
            DurationSeconds = duration;
        }

        public void MarkAsRead()
        {
            IsRead = true;
        }

        public void Clear()
        {
            IsCleared = true;
        }
    }
}
