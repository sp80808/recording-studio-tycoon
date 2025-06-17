using System;
using System.Collections.Generic;

[System.Serializable]
public class Song
{
    public string Id;
    public string Title;
    public string Genre;
    public int Quality;
    public int ChartPosition;
    public long ReleaseDate;
    public string BandId; // ID of the band that created the song
}