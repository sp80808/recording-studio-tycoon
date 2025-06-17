using UnityEngine;
using RecordingStudioTycoon.Core; // For GameManager.Instance, AudioManager.Instance
using RecordingStudioTycoon; // For RewardManager, RewardType

namespace RecordingStudioTycoon.Gameplay.Collectibles
{
    /// <summary>
    /// Defines properties and interaction logic for collectible items.
    /// </summary>
    public class Collectible : MonoBehaviour
    {
        public enum CollectibleType
        {
            Money,
            XP,
            Item,
            Resource
        }

        [Header("Collectible Properties")]
        [SerializeField] private CollectibleType type = CollectibleType.Money;
        [SerializeField] private float value = 10f; // Changed to float for XP/Money
        [SerializeField] private AudioClip collectSound; // Optional sound effect
        [SerializeField] private GameObject _particleEffectPrefab; // Optional particle effect prefab

        private void OnTriggerEnter(Collider other)
        {
            // Check if the collider belongs to the player character
            if (other.CompareTag("Player"))
            {
                Debug.Log($"Collectible: Player collected {type} with value {value}");

                ApplyEffect();
                PlayVisualAndAudioCues();

                // Destroy the collectible object after collection
                Destroy(gameObject);
            }
        }

        private void ApplyEffect()
        {
            switch (type)
            {
                case CollectibleType.Money:
                    Systems.Finance.FinanceManager.Instance?.AddMoney(value);
                    break;
                case CollectibleType.XP:
                    RewardManager.Instance?.GrantReward(RewardType.XP, value);
                    break;
                case CollectibleType.Item:
                    // For items, 'value' could be an item ID or quantity.
                    // RewardManager.Instance?.GrantReward(RewardType.Item, value);
                    Debug.Log($"Collected item with ID/quantity: {value} (Item collection not fully implemented)");
                    break;
                case CollectibleType.Resource:
                    // For resources, 'value' could be a resource ID or quantity.
                    Debug.Log($"Collected resource with ID/quantity: {value} (Resource collection not fully implemented)");
                    break;
                default:
                    Debug.LogWarning($"Unknown collectible type: {type}");
                    break;
            }
        }

        private void PlayVisualAndAudioCues()
        {
            // Play sound if available
            if (collectSound != null)
            {
                AudioManager.Instance?.PlaySFX(collectSound);
            }

            // Instantiate particle effect if available
            if (_particleEffectPrefab != null)
            {
                Instantiate(_particleEffectPrefab, transform.position, Quaternion.identity);
            }
        }

        // Optional: Method to set properties dynamically if spawning from code
        public void SetProperties(CollectibleType newType, int newValue, AudioClip sound = null)
        {
            type = newType;
            value = newValue;
            collectSound = sound;
        }
    }
}