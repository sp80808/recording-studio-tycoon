using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class GameNotification
    {
        public string Id;
        public string Type;
        public string Message;
        public DateTime Timestamp;
        public bool IsRead;

        public GameNotification()
        {
            Id = Guid.NewGuid().ToString();
            Type = "Info";
            Message = "";
            Timestamp = DateTime.Now;
            IsRead = false;
        }
    }
}

public enum NotificationType
{
    Info, Warning, Error, Success
}