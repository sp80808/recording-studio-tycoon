using System.Collections.Generic;

public static class StaffUtils
{
    public static List<StaffMember> GenerateCandidates(int count, GameState gameState)
    {
        // Implement candidate generation logic
        return new List<StaffMember>();
    }

    // Extension method for SerializableDictionary to get value or default
    public static TValue GetValueOrDefault<TKey, TValue>(this SerializableDictionary<TKey, TValue> dictionary, TKey key, TValue defaultValue = default(TValue))
    {
        if (dictionary.TryGetValue(key, out TValue value))
        {
            return value;
        }
        return defaultValue;
    }
}