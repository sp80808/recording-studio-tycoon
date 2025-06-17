using UnityEngine;
using RecordingStudioTycoon.Gameplay.Environment; // For Interactable
using RecordingStudioTycoon.Core; // For GameManager.Instance
using RecordingStudioTycoon.UI; // For UIManager.Instance

namespace RecordingStudioTycoon.Gameplay.Player
{
    /// <summary>
    /// Handles player interaction with Interactable objects in the environment.
    /// </summary>
    public class PlayerInteraction : MonoBehaviour
    {
        [Header("Interaction Settings")]
        [SerializeField] private float interactionDistance = 3.0f;
        [SerializeField] private LayerMask interactableLayer; // Layer for interactable objects
        [SerializeField] private GameObject _interactionPromptUI; // UI element to show interaction prompt
        [SerializeField] private Animator _playerAnimator; // Reference to the player's Animator

        private Interactable _currentInteractable;
        private static readonly int IsInteractingAnim = Animator.StringToHash("IsInteracting");

        private void OnEnable()
        {
            PlayerInput.OnInteractInput += HandleInteractInput;
        }

        private void OnDisable()
        {
            PlayerInput.OnInteractInput -= HandleInteractInput;
        }

        private void Update()
        {
            CheckForInteractable();
        }

        private void HandleInteractInput()
        {
            if (GameManager.Instance.CurrentGameState == GameStateEnum.InGame && _currentInteractable != null)
            {
                _currentInteractable.Interact();
                if (_playerAnimator != null)
                {
                    _playerAnimator.SetTrigger(IsInteractingAnim); // Trigger interaction animation
                }
            }
        }

        private void CheckForInteractable()
        {
            RaycastHit hit;
            // Cast a ray forward from the player to detect interactable objects
            if (Physics.Raycast(transform.position, transform.forward, out hit, interactionDistance, interactableLayer))
            {
                Interactable interactable = hit.collider.GetComponent<Interactable>();
                if (interactable != null && interactable != _currentInteractable)
                {
                    // New interactable found
                    _currentInteractable = interactable;
                    ShowInteractionPrompt(_currentInteractable.GetInteractionPrompt());
                    // Trigger visual highlight on the interactable object (handled by Interactable.cs OnMouseEnter)
                }
                else if (interactable == null && _currentInteractable != null)
                {
                    // Lost focus on interactable
                    ClearInteractionPrompt();
                    _currentInteractable = null;
                }
            }
            else
            {
                // No interactable in range
                if (_currentInteractable != null)
                {
                    ClearInteractionPrompt();
                    _currentInteractable = null;
                }
            }
        }

        private void ShowInteractionPrompt(string prompt)
        {
            if (_interactionPromptUI != null)
            {
                _interactionPromptUI.SetActive(true);
                // Assuming the UI has a TextMeshProUGUI component to display the prompt
                TMPro.TextMeshProUGUI promptText = _interactionPromptUI.GetComponentInChildren<TMPro.TextMeshProUGUI>();
                if (promptText != null)
                {
                    promptText.text = prompt;
                }
            }
            Debug.Log($"Showing interaction prompt: {prompt}");
        }

        private void ClearInteractionPrompt()
        {
            if (_interactionPromptUI != null)
            {
                _interactionPromptUI.SetActive(false);
            }
            Debug.Log("Clearing interaction prompt.");
        }
    }
}