using UnityEngine;
using System.Collections.Generic;

[CreateAssetMenu(fileName = "EquipmentData", menuName = "Game Data/Equipment Data")]
public class EquipmentData : ScriptableObject
{
    public List<Equipment> AllEquipment;

    public Equipment GetEquipmentById(string id)
    {
        return AllEquipment.Find(e => e.Id == id);
    }
}