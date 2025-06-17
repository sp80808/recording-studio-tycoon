using UnityEngine;
using RecordingStudioTycoon.GameLogic; // For GameManager
using RecordingStudioTycoon.Systems.BandAndSong; // For BandAndSongManager
using RecordingStudioTycoon.Systems.Market; // For MarketManager
using RecordingStudioTycoon.UI; // For UIManager
using System.Linq; // For LINQ operations

namespace RecordingStudioTycoon.Gameplay.Enemy
{
    /// <summary>
    /// Implements basic "rival studio" AI behavior for a tycoon context.
    /// </summary>
    public class EnemyAI : MonoBehaviour
    {
        [Header("AI Settings")]
        [SerializeField] private float actionIntervalSeconds = 60f; // How often the AI takes an action
        [SerializeField] private float artistStealChance = 0.1f; // Chance to attempt to steal an artist (0-1)
        [SerializeField] private float marketInfluenceStrength = 0.05f; // How much AI negatively influences market (0-1)

        private float _timer;

        private void Start()
        {
            _timer = actionIntervalSeconds; // Initialize timer
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnDayAdvanced += HandleDayAdvanced;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnDayAdvanced -= HandleDayAdvanced;
            }
        }

        private void Update()
        {
            // This AI will primarily act on a daily basis, but a timer can be used for more frequent actions if needed.
            // For now, we'll rely on the OnDayAdvanced event.
        }

        private void HandleDayAdvanced()
        {
            Debug.Log("EnemyAI: Performing daily rival actions.");
            PerformRivalAction();
        }

        private void PerformRivalAction()
        {
            // Attempt to sign artists from player's roster
            if (UnityEngine.Random.value < artistStealChance)
            {
                AttemptStealArtist();
            }

            // Influence market trends negatively
            InfluenceMarketTrends();
        }

        private void AttemptStealArtist()
        {
            if (BandAndSongManager.Instance != null && BandAndSongManager.Instance.ActiveBands.Any())
            {
                // Select a random band from the player's active bands
                var targetBand = BandAndSongManager.Instance.ActiveBands[UnityEngine.Random.Range(0, BandAndSongManager.Instance.ActiveBands.Count)];
                
                // In a real scenario, you'd pick a specific artist from the band
                // For now, just simulate the attempt
                Debug.Log($"EnemyAI: Rival studio attempting to poach an artist from {targetBand.Name}!");
                UIManager.Instance?.ShowNotification($"Rival studio attempting to poach from {targetBand.Name}!", NotificationType.Warning);

                // Implement success/failure logic here, potentially based on player's relationship with band,
                // band's reputation, player's studio prestige, etc.
                // For now, it's just a notification.
            }
            else
            {
                Debug.Log("EnemyAI: No active bands for rival to poach from.");
            }
        }

        private void InfluenceMarketTrends()
        {
            if (MarketManager.Instance != null)
            {
                // This is a placeholder. MarketManager would need a method to be influenced.
                // Example: MarketManager.Instance.ApplyNegativeMarketInfluence(marketInfluenceStrength);
                Debug.Log($"EnemyAI: Rival studio negatively influencing market trends by {marketInfluenceStrength * 100}% (placeholder).");
                UIManager.Instance?.ShowNotification($"Rival studio negatively impacting market!", NotificationType.Warning);
            }
            else
            {
                Debug.LogWarning("EnemyAI: MarketManager instance not found. Cannot influence market trends.");
            }
        }
    }
}