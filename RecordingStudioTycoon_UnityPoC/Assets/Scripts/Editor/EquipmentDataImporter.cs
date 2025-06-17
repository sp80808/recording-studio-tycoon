using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Utils; // For SerializableDictionary
using System.Linq; // For LINQ operations

public class EquipmentDataImporter : EditorWindow
{
    private TextAsset _equipmentJsonFile;
    private EquipmentData _equipmentDataAsset;

    [MenuItem("Tools/Import Equipment Data")]
    public static void ShowWindow()
    {
        GetWindow<EquipmentDataImporter>("Equipment Importer");
    }

    private void OnGUI()
    {
        GUILayout.Label("Import Equipment Data from JSON", EditorStyles.boldLabel);

        _equipmentJsonFile = (TextAsset)EditorGUILayout.ObjectField("Equipment JSON", _equipmentJsonFile, typeof(TextAsset), false);
        _equipmentDataAsset = (EquipmentData)EditorGUILayout.ObjectField("Equipment Data Asset", _equipmentDataAsset, typeof(EquipmentData), false);

        if (GUILayout.Button("Import Data"))
        {
            if (_equipmentJsonFile == null)
            {
                EditorUtility.DisplayDialog("Error", "Please assign the Equipment JSON file.", "OK");
                return;
            }
            if (_equipmentDataAsset == null)
            {
                EditorUtility.DisplayDialog("Error", "Please assign the Equipment Data ScriptableObject asset.", "OK");
                return;
            }

            ImportEquipmentData();
        }
    }

    private void ImportEquipmentData()
    {
        string jsonContent = _equipmentJsonFile.text;
        
        // Unity's JsonUtility requires a root object for arrays.
        // We'll wrap the array in a simple class for deserialization.
        string wrappedJson = "{ \"items\": " + jsonContent + "}";
        EquipmentListWrapper wrapper = JsonUtility.FromJson<EquipmentListWrapper>(wrappedJson);

        if (wrapper == null || wrapper.items == null)
        {
            EditorUtility.DisplayDialog("Error", "Failed to parse JSON. Ensure it's a valid array of equipment.", "OK");
            return;
        }

        _equipmentDataAsset.AllEquipment = new List<Equipment>();

        foreach (var tsEquipment in wrapper.items)
        {
            Equipment newEquipment = new Equipment
            {
                Id = tsEquipment.id,
                Name = tsEquipment.name,
                Category = tsEquipment.category,
                Price = tsEquipment.price,
                Description = tsEquipment.description,
                Icon = tsEquipment.icon,
                Condition = tsEquipment.condition,
                AvailableFrom = tsEquipment.availableFrom,
                AvailableUntil = tsEquipment.availableUntil,
                EraDescription = tsEquipment.eraDescription,
                IsVintage = tsEquipment.isVintage
            };

            // Handle Bonuses (assuming it's a simple dictionary in TS)
            if (tsEquipment.bonuses != null)
            {
                newEquipment.Bonuses = new SerializableDictionary<string, float>();
                foreach (var bonus in tsEquipment.bonuses)
                {
                    newEquipment.Bonuses.Add(bonus.Key, bonus.Value);
                }
            }

            // Handle GenreBonuses (assuming it's a nested dictionary in TS)
            if (tsEquipment.genreBonus != null)
            {
                newEquipment.GenreBonuses = new SerializableDictionary<string, int>();
                foreach (var genreBonus in tsEquipment.genreBonus)
                {
                    newEquipment.GenreBonuses.Add(genreBonus.Key, genreBonus.Value);
                }
            }

            // Handle SkillRequirement
            if (tsEquipment.skillRequirement != null)
            {
                // Assuming StudioSkillType can be parsed from string
                StudioSkillType skillType;
                if (Enum.TryParse(tsEquipment.skillRequirement.skill, true, out skillType))
                {
                    newEquipment.SkillRequirement = new SkillRequirement
                    {
                        Skill = skillType,
                        Level = tsEquipment.skillRequirement.level
                    };
                }
                else
                {
                    Debug.LogWarning($"Could not parse skill type: {tsEquipment.skillRequirement.skill} for equipment {tsEquipment.id}");
                }
            }

            _equipmentDataAsset.AllEquipment.Add(newEquipment);
        }

        EditorUtility.SetDirty(_equipmentDataAsset); // Mark asset as dirty to save changes
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        EditorUtility.DisplayDialog("Import Complete", $"Successfully imported {wrapper.items.Count} equipment items.", "OK");
        Debug.Log($"Successfully imported {wrapper.items.Count} equipment items into {_equipmentDataAsset.name}");
    }

    // Helper class to deserialize the top-level JSON array
    [System.Serializable]
    private class EquipmentListWrapper
    {
        public List<TSEquipmentData> items;
    }

    // Intermediate class to match the TypeScript structure for deserialization
    [System.Serializable]
    private class TSEquipmentData
    {
        public string id;
        public string name;
        public string category;
        public int price;
        public string description;
        public Dictionary<string, float> bonuses; // Direct mapping for simple bonuses
        public Dictionary<string, int> genreBonus; // Direct mapping for genre bonuses
        public string icon;
        public TSSkillRequirement skillRequirement;
        public int condition;
        public int availableFrom;
        public int availableUntil;
        public string eraDescription;
        public bool isVintage;
    }

    [System.Serializable]
    private class TSSkillRequirement
    {
        public string skill; // Will be parsed to StudioSkillType
        public int level;
    }
}