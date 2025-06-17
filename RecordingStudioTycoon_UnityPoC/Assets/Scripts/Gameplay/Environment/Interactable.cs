using UnityEngine;
using RecordingStudioTycoon.Core; // For GameManager.Instance, AudioManager.Instance
using RecordingStudioTycoon.UI; // For UIManager.Instance
using RecordingStudioTycoon.Systems.Project; // For ProjectManager
using RecordingStudioTycoon.Systems.StudioUpgrade; // For StudioUpgradeManager
using UnityEngine.Events; // For custom UnityEvents

namespace RecordingStudioTycoon.Gameplay.Environment
{
    public enum InteractionType
    {
        None,
        UseEquipment,
        OpenDoor,
        UpgradeStudio,
        StartProject,
        HireStaff,
        TrainStaff,
        ManageBand,
        AdvanceDay, // For objects like a calendar
        AccessComputer, // For managing projects, staff, etc.
        CollectMoney, // For objects like a cash register
        InteractWithNPC // For future NPC interactions
    }

    /// <summary>
    /// Base class for interactive environmental objects.
    /// Provides generic interaction method and visual feedback.
    /// </summary>
    public class Interactable : MonoBehaviour
    {
        [Header("Interaction Settings")]
        [SerializeField] private string interactionPrompt = "Interact";
        [SerializeField] private Color highlightColor = Color.yellow;
        [SerializeField] private InteractionType _interactionType = InteractionType.None;
        [SerializeField] private string _interactionTargetId; // e.g., Equipment ID, Project ID, Upgrade ID

        [Header("Visual Feedback")]
        [SerializeField] private GameObject _visualEffectPrefab; // e.g., particle system for interaction
        [SerializeField] private AudioClip _interactionSound; // Sound effect for interaction

        private Color _originalColor;
        private Renderer _renderer;
        private Animator _animator; // For door animations, etc.

        protected virtual void Awake()
        {
            _renderer = GetComponent<Renderer>();
            if (_renderer != null)
            {
                _originalColor = _renderer.material.color;
            }
            _animator = GetComponent<Animator>();
        }

        /// <summary>
        /// This method is called when the player interacts with the object.
        /// Override this in derived classes for specific interaction logic.
        /// </summary>
        public virtual void Interact()
        {
            Debug.Log($"Interacted with {gameObject.name}. Type: {_interactionType}, Target: {_interactionTargetId}");
            
            // Trigger appropriate game actions based on interaction type
            // Play interaction sound
            if (_interactionSound != null)
            {
                AudioManager.Instance?.PlaySFX(_interactionSound);
            }
            // Instantiate visual effect
            if (_visualEffectPrefab != null)
            {
                Instantiate(_visualEffectPrefab, transform.position, Quaternion.identity);
            }

            switch (_interactionType)
            {
                case InteractionType.UseEquipment:
                    // Simulate equipment usage, potentially affecting project quality or staff skills
                    // This assumes ProjectManager has a method to apply equipment effects
                    ProjectManager.Instance?.ApplyEquipmentEffect(_interactionTargetId);
                    UIManager.Instance?.ShowNotification($"Using equipment: {_interactionTargetId}", NotificationType.Info);
                    break;
                case InteractionType.OpenDoor:
                    // Implement a simple animation or state change for a door object
                    if (_animator != null)
                    {
                        _animator.SetTrigger("OpenDoor"); // Assuming an "OpenDoor" trigger in Animator
                        Debug.Log($"Door {_interactionTargetId} opened.");
                    }
                    UIManager.Instance?.ShowNotification($"Opening door to: {_interactionTargetId}", NotificationType.Info);
                    break;
                case InteractionType.UpgradeStudio:
                    // Trigger the StudioUpgradeManager UI method
                    StudioUpgradeManager.Instance?.ShowUpgradeOptions(); // Assuming this method exists
                    UIManager.Instance?.ShowNotification($"Accessing studio upgrades.", NotificationType.Info);
                    break;
                case InteractionType.StartProject:
                    ProjectManager.Instance?.StartProject(_interactionTargetId); // Assuming this method exists
                    UIManager.Instance?.ShowNotification($"Starting project: {_interactionTargetId}", NotificationType.Info);
                    break;
                case InteractionType.HireStaff:
                    UIManager.Instance?.ShowNotification($"Accessing staff recruitment.", NotificationType.Info);
                    break;
                case InteractionType.TrainStaff:
                    UIManager.Instance?.ShowNotification($"Accessing staff training.", NotificationType.Info);
                    break;
                case InteractionType.ManageBand:
                    UIManager.Instance?.ShowNotification($"Managing band: {_interactionTargetId}", NotificationType.Info);
                    break;
                case InteractionType.AdvanceDay:
                    GameManager.Instance?.AdvanceDay();
                    UIManager.Instance?.ShowNotification($"Day advanced!", NotificationType.Info);
                    break;
                case InteractionType.AccessComputer:
                    UIManager.Instance?.ShowNotification($"Accessing computer interface.", NotificationType.Info);
                    break;
                case InteractionType.CollectMoney:
                    GameManager.Instance?.AddMoney(100); // Example: Collect 100 money
                    UIManager.Instance?.ShowNotification($"Collected money!", NotificationType.Success);
                    break;
                case InteractionType.InteractWithNPC:
                    UIManager.Instance?.ShowNotification($"Interacting with NPC: {_interactionTargetId}", NotificationType.Info);
                    break;
                case InteractionType.None:
                default:
                    UIManager.Instance?.ShowNotification($"Nothing specific happens when interacting with {gameObject.name}.", NotificationType.Info);
                    break;
            }
        }

        // Basic visual feedback on hover/selection
        private void OnMouseEnter()
        {
            if (_renderer != null)
            {
                _renderer.material.color = highlightColor;
                Debug.Log($"Hovering over {gameObject.name}. Prompt: {interactionPrompt}");
                // Potentially show UI prompt here
            }
        }

        private void OnMouseExit()
        {
            if (_renderer != null)
            {
                _renderer.material.color = _originalColor;
                // Potentially hide UI prompt here
            }
        }

        // Optional: Method to show/hide interaction prompt UI
        public string GetInteractionPrompt()
        {
            return interactionPrompt;
        }

        public InteractionType GetInteractionType()
        {
            return _interactionType;
        }

        public string GetInteractionTargetId()
        {
            return _interactionTargetId;
        }
    }
}