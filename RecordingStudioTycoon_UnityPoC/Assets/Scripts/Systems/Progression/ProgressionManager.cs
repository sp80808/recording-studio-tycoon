using UnityEngine;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Systems.Progression
{
    public class ProgressionManager : MonoBehaviour
    {
        public static ProgressionManager Instance { get; private set; }

        [SerializeField] private ProgressionData progressionData;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void AddXP(int amount)
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;
            gameState.playerData.xp += amount;

            // Check for level up
            CheckForLevelUp(gameState);

            Debug.Log($"Added {amount} XP. Total: {gameState.playerData.xp}");
        }

        private void CheckForLevelUp(GameState gameState)
        {
            if (progressionData == null) return;

            int currentLevel = gameState.playerData.level;
            int requiredXP = progressionData.CalculateXPToNextLevel(currentLevel);

            if (gameState.playerData.xp >= requiredXP)
            {
                // Level up!
                gameState.playerData.level++;
                gameState.playerData.xp -= requiredXP;
                gameState.playerData.attributePoints += 2; // Give attribute points on level up
                gameState.playerData.perkPoints += 1; // Give perk points on level up

                // Create level up details
                var levelUpDetails = new LevelUpDetails
                {
                    newLevel = gameState.playerData.level,
                    attributePointsGained = 2,
                    perkPointsGained = 1,
                    unlockedFeatures = new System.Collections.Generic.List<string>()
                };

                // Check for unlocked features based on level
                CheckForUnlockedFeatures(levelUpDetails);

                // Trigger level up event
                GameManager.OnPlayerLevelUp?.Invoke(levelUpDetails);

                Debug.Log($"Player leveled up to level {gameState.playerData.level}!");

                // Update XP to next level
                gameState.playerData.xpToNextLevel = progressionData.CalculateXPToNextLevel(gameState.playerData.level);
            }
            else
            {
                gameState.playerData.xpToNextLevel = requiredXP - gameState.playerData.xp;
            }
        }

        private void CheckForUnlockedFeatures(LevelUpDetails levelUpDetails)
        {
            // Add unlocked features based on level
            switch (levelUpDetails.newLevel)
            {
                case 3:
                    levelUpDetails.unlockedFeatures.Add("Staff Hiring");
                    break;
                case 5:
                    levelUpDetails.unlockedFeatures.Add("Equipment Upgrades");
                    break;
                case 10:
                    levelUpDetails.unlockedFeatures.Add("Studio Expansions");
                    break;
                case 15:
                    levelUpDetails.unlockedFeatures.Add("Advanced Mixing");
                    break;
                case 20:
                    levelUpDetails.unlockedFeatures.Add("Label Management");
                    break;
            }
        }

        public void AddAttributePoints(PlayerAttributeType attributeType)
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;
            if (gameState.playerData.attributePoints <= 0) return;

            gameState.playerData.attributePoints--;

            switch (attributeType)
            {
                case PlayerAttributeType.FocusMastery:
                    gameState.playerData.attributes.focusMastery++;
                    break;
                case PlayerAttributeType.CreativeIntuition:
                    gameState.playerData.attributes.creativeIntuition++;
                    break;
                case PlayerAttributeType.TechnicalAptitude:
                    gameState.playerData.attributes.technicalAptitude++;
                    break;
                case PlayerAttributeType.BusinessAcumen:
                    gameState.playerData.attributes.businessAcumen++;
                    break;
                case PlayerAttributeType.Creativity:
                    gameState.playerData.attributes.creativity++;
                    break;
                case PlayerAttributeType.Technical:
                    gameState.playerData.technical++;
                    break;
                case PlayerAttributeType.Business:
                    gameState.playerData.attributes.business++;
                    break;
                case PlayerAttributeType.Charisma:
                    gameState.playerData.attributes.charisma++;
                    break;
                case PlayerAttributeType.Luck:
                    gameState.playerData.attributes.luck++;
                    break;
            }

            Debug.Log($"Added point to {attributeType}. Remaining points: {gameState.playerData.attributePoints}");
        }

        public void AddSkillXP(StudioSkillType skillType, int amount)
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;
            if (!gameState.studioSkills.ContainsKey(skillType))
            {
                gameState.studioSkills[skillType] = new StudioSkill { skillType = skillType, level = 1, experience = 0 };
            }

            var skill = gameState.studioSkills[skillType];
            skill.experience += amount;

            // Check for skill level up
            CheckForSkillLevelUp(skill);

            Debug.Log($"Added {amount} XP to {skillType}. Current XP: {skill.experience}");
        }

        private void CheckForSkillLevelUp(StudioSkill skill)
        {
            if (progressionData == null) return;

            int requiredXP = progressionData.CalculateSkillXPToNextLevel(skill.level);
            if (skill.experience >= requiredXP)
            {
                skill.level++;
                skill.experience -= requiredXP;
                Debug.Log($"{skill.skillType} leveled up to level {skill.level}!");
            }
        }

        public void AddPerkPoint()
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;
            gameState.playerData.perkPoints++;

            Debug.Log($"Added perk point. Total: {gameState.playerData.perkPoints}");
        }

        public void TriggerEraTransition(string newEraId)
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;
            gameState.currentEra = newEraId;

            Debug.Log($"Era transitioned to: {newEraId}");
        }
    }
}
