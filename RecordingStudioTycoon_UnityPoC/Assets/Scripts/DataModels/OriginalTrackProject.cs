using System;
using System.Collections.Generic;

[System.Serializable]
public class OriginalTrackProject : Project // Inherit from Project
{
    public string SongTitle;
    public string SongGenre;
    public List<string> CollaboratorIds; // IDs of staff/session musicians collaborating
}