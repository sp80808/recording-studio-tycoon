using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.IO;
using RecordingStudioTycoon.DataModels; // For Equipment
using RecordingStudioTycoon.ScriptableObjects; // For EquipmentData
using RecordingStudioTycoon.Utils; // For SerializableDictionary

public class EquipmentDataImporterEditor : EditorWindow
{
    private string equipmentJson = ""; // This will hold the JSON string of equipment data

    [MenuItem("Tools/Import/Import Equipment Data")]
    public static void ShowWindow()
    {
        GetWindow<EquipmentDataImporterEditor>("Equipment Importer");
    }

    private void OnGUI()
    {
        GUILayout.Label("Import Equipment Data from TypeScript", EditorStyles.boldLabel);

        EditorGUILayout.HelpBox("Paste the content of the 'availableEquipment' array from src/data/equipment.ts below. Ensure it's valid JSON.", MessageType.Info);

        equipmentJson = EditorGUILayout.TextArea(equipmentJson, GUILayout.Height(300));

        if (GUILayout.Button("Import Equipment"))
        {
            ImportEquipment();
        }
    }

    private void ImportEquipment()
    {
        if (string.IsNullOrEmpty(equipmentJson))
        {
            Debug.LogError("Equipment JSON is empty. Please paste the data.");
            return;
        }

        try
        {
            // Deserialize the JSON string into a list of Equipment objects
            // Need a wrapper class because JsonUtility cannot deserialize a direct array/list
            EquipmentListWrapper wrapper = JsonUtility.FromJson<EquipmentListWrapper>("{\"AllEquipment\":" + equipmentJson + "}");

            if (wrapper == null || wrapper.AllEquipment == null)
            {
                Debug.LogError("Failed to parse equipment JSON. Check format.");
                return;
            }

            // Find or create the EquipmentData ScriptableObject
            EquipmentData equipmentData = AssetDatabase.LoadAssetAtPath<EquipmentData>("Assets/ScriptableObjects/EquipmentData.asset");
            if (equipmentData == null)
            {
                equipmentData = ScriptableObject.CreateInstance<EquipmentData>();
                AssetDatabase.CreateAsset(equipmentData, "Assets/ScriptableObjects/EquipmentData.asset");
                Debug.Log("Created new EquipmentData ScriptableObject asset.");
            }

            // Populate the ScriptableObject
            equipmentData.AllEquipment = wrapper.AllEquipment;

            // Mark as dirty and save assets
            EditorUtility.SetDirty(equipmentData);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"Successfully imported {equipmentData.AllEquipment.Count} equipment items.");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error importing equipment data: {e.Message}\n{e.StackTrace}");
        }
    }

    // Helper class for JsonUtility to deserialize a list
    [System.Serializable]
    private class EquipmentListWrapper
    {
        public List<Equipment> AllEquipment;
    }
}