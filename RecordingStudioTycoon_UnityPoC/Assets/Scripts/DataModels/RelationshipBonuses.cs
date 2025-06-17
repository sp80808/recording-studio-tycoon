using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class RelationshipBonuses
    {
        public float ContractValueIncrease;
        public float ProjectQualityBonus;
        public float StaffAttractionBonus;
        public float EquipmentDiscount;
        public float ResearchSpeedBonus;

        public RelationshipBonuses()
        {
            ContractValueIncrease = 0f;
            ProjectQualityBonus = 0f;
            StaffAttractionBonus = 0f;
            EquipmentDiscount = 0f;
            ResearchSpeedBonus = 0f;
        }

        public RelationshipBonuses(float contractValueIncrease, float projectQualityBonus, float staffAttractionBonus, float equipmentDiscount, float researchSpeedBonus)
        {
            ContractValueIncrease = contractValueIncrease;
            ProjectQualityBonus = projectQualityBonus;
            StaffAttractionBonus = staffAttractionBonus;
            EquipmentDiscount = equipmentDiscount;
            ResearchSpeedBonus = researchSpeedBonus;
        }
    }
}