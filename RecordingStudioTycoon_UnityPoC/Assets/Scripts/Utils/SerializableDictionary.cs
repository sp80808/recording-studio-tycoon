using UnityEngine;
using System;
using System.Collections.Generic;

// This is a basic implementation of a SerializableDictionary.
// Unity's default serialization doesn't handle generic dictionaries well.
// For more robust solutions, consider third-party assets or more complex custom drawers.

[Serializable]
public class SerializableDictionary<TKey, TValue> : Dictionary<TKey, TValue>, ISerializationCallbackReceiver
{
    [SerializeField]
    private List<TKey> _keys = new List<TKey>();
    [SerializeField]
    private List<TValue> _values = new List<TValue>();

    // Save the dictionary to lists
    public void OnBeforeSerialize()
    {
        _keys.Clear();
        _values.Clear();
        foreach (KeyValuePair<TKey, TValue> pair in this)
        {
            _keys.Add(pair.Key);
            _values.Add(pair.Value);
        }
    }

    // Load the dictionary from lists
    public void OnAfterDeserialize()
    {
        this.Clear();
        if (_keys.Count != _values.Count)
        {
            Debug.LogError("There are " + _keys.Count + " keys and " + _values.Count + " values after deserialization. Make sure that key and value lists have the same size.");
        }
        for (int i = 0; i < _keys.Count; i++)
        {
            this.Add(_keys[i], _values[i]);
        }
    }
}