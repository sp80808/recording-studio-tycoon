using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic; // For GameState
using RecordingStudioTycoon.Systems.Project; // For ProjectManager
using RecordingStudioTycoon.UI; // For UIManager

namespace RecordingStudioTycoon.Systems.Relationship
{
    public class RelationshipManager : MonoBehaviour
    {
        public static RelationshipManager Instance { get; private set; }

        // Events for UI or other systems to subscribe to
        public static event Action<string, int> OnRelationshipChanged; // string for NPC ID, int for change amount
        public static event Action<string> OnNewContactUnlocked; // string for new contact ID

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

        private void Start()
        {
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. RelationshipManager requires GameManager to be initialized.");
                return;
            }
            if (ProjectManager.Instance == null)
            {
                Debug.LogError("ProjectManager not found. RelationshipManager requires ProjectManager to be initialized.");
                return;
            }

            // Initialize relationships if not loaded from save
            // For now, assume GameState handles persistence of relationship levels
            // Example: GameManager.Instance.GameState.relationships = new Dictionary<string, int>();
        }

        /// <summary>
        /// Adjusts the relationship level with a specific NPC.
        /// </summary>
        /// <param name="npcId">The ID of the NPC.</param>
        /// <param name="amount">The amount to change the relationship by (positive for improvement, negative for worsening).</param>
        public void AdjustRelationship(string npcId, int amount)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return;

            if (!GameManager.Instance.GameState.relationships.ContainsKey(npcId))
            {
                GameManager.Instance.GameState.relationships[npcId] = 0; // Initialize if not exists
            }

            GameManager.Instance.GameState.relationships[npcId] += amount;
            // Clamp relationship value if needed (e.g., between -100 and 100)
            GameManager.Instance.GameState.relationships[npcId] = Mathf.Clamp(GameManager.Instance.GameState.relationships[npcId], -100, 100);

            Debug.Log($"Relationship with {npcId} changed by {amount}. New level: {GameManager.Instance.GameState.relationships[npcId]}");
            OnRelationshipChanged?.Invoke(npcId, GameManager.Instance.GameState.relationships[npcId]);
            GameManager.Instance.OnGameDataChanged?.Invoke(); // Notify UI of state changes
            GameManager.Instance.SaveGameData(); // Save game after relationship change

            CheckRelationshipEffects(npcId, GameManager.Instance.GameState.relationships[npcId]);
        }

        /// <summary>
        /// Retrieves the current relationship level with a specific NPC.
        /// </summary>
        /// <param name="npcId">The ID of the NPC.</param>
        /// <returns>The current relationship level, or 0 if the NPC is not found.</returns>
        public int GetRelationshipLevel(string npcId)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return 0;
            
            if (GameManager.Instance.GameState.relationships.TryGetValue(npcId, out int level))
            {
                return level;
            }
            return 0; // Default if no relationship exists yet
        }

        /// <summary>
        /// Checks for and applies effects based on relationship levels.
        /// </summary>
        /// <param name="npcId">The ID of the NPC.</param>
        /// <param name="currentLevel">The current relationship level.</param>
        private void CheckRelationshipEffects(string npcId, int currentLevel)
        {
            // Example: Unlock new projects at certain relationship thresholds
            if (npcId == "clientA" && currentLevel >= 50 && !GameManager.Instance.GameState.unlockedContacts.Contains("clientA_highTier"))
            {
                GameManager.Instance.GameState.unlockedContacts.Add("clientA_highTier");
                OnNewContactUnlocked?.Invoke("clientA_highTier");
                UIManager.Instance?.ShowNotification($"Unlocked new projects with Client A!", NotificationType.Info);
                Debug.Log($"New contact/project tier unlocked for {npcId}.");
            }
            // Add more complex logic for different NPCs and thresholds
            // e.g., better deals, unique events, negative consequences for low relationships
        }

        /// <summary>
        /// Simulates a project success affecting client relationships.
        /// </summary>
        /// <param name="clientId">The ID of the client for the project.</param>
        /// <param name="successAmount">The degree of success (e.g., 1 for minor, 5 for major).</param>
        public void OnProjectSuccess(string clientId, int successAmount)
        {
            int relationshipChange = successAmount * 5; // Example: 5 points per success amount
            AdjustRelationship(clientId, relationshipChange);
            UIManager.Instance?.ShowNotification($"Relationship with {clientId} improved due to project success!", NotificationType.Info);
        }

        /// <summary>
        /// Simulates a project failure affecting client relationships.
        /// </summary>
        /// <param name="clientId">The ID of the client for the project.</param>
        /// <param name="failureAmount">The degree of failure.</param>
        public void OnProjectFailure(string clientId, int failureAmount)
        {
            int relationshipChange = -failureAmount * 10; // Example: -10 points per failure amount
            AdjustRelationship(clientId, relationshipChange);
            UIManager.Instance?.ShowNotification($"Relationship with {clientId} worsened due to project failure.", NotificationType.Error);
        }

        // You might also have methods for:
        // - Triggering unique events based on relationship levels
        // - Offering special deals
        // - Handling minigame performance impact on relationships
    }
}