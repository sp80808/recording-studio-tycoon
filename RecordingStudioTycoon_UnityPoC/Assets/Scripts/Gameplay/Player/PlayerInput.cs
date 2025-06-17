using UnityEngine;
using System;

namespace RecordingStudioTycoon.Gameplay.Player
{
    /// <summary>
    /// Handles player input and translates it into game actions.
    /// This script uses Unity's legacy Input Manager for simplicity.
    /// </summary>
    public class PlayerInput : MonoBehaviour
    {
        // Movement Events
        public static event Action<Vector2> OnMoveInput;
        // Interaction Events
        public static event Action OnInteractInput;
        // Other potential input events (e.g., pause, menu)
        public static event Action OnPauseInput;

        private void Update()
        {
            ProcessMovementInput();
            ProcessInteractionInput();
            ProcessPauseInput();
        }

        private void ProcessMovementInput()
        {
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");
            Vector2 moveInput = new Vector2(horizontal, vertical);

            if (moveInput != Vector2.zero)
            {
                OnMoveInput?.Invoke(moveInput);
            }
        }

        private void ProcessInteractionInput()
        {
            // E key for interaction
            if (Input.GetKeyDown(KeyCode.E))
            {
                OnInteractInput?.Invoke();
            }
            // Left mouse button for interaction (e.g., clicking on objects)
            if (Input.GetMouseButtonDown(0))
            {
                // This could be used for UI clicks or direct world interaction
                // For now, we'll keep it simple and just invoke the event
                OnInteractInput?.Invoke();
            }
        }

        private void ProcessPauseInput()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                OnPauseInput?.Invoke();
            }
        }
    }
}