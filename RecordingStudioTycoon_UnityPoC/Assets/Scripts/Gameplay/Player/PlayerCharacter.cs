using UnityEngine;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Gameplay.Environment; // For Interactable
using RecordingStudioTycoon.Core; // For GameManager.Instance (placeholder)
using RecordingStudioTycoon.UI; // For UIManager.Instance (placeholder)

namespace RecordingStudioTycoon.Gameplay.Player
{
    /// <summary>
    /// Controls the player character's movement, animation, and interaction.
    /// Assumes a CharacterController component is attached.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerCharacter : MonoBehaviour
    {
        [Header("Movement Settings")]
        [SerializeField] private float moveSpeed = 5.0f;
        [SerializeField] private float rotationSpeed = 500.0f;

        [Header("Interaction Settings")]
        [SerializeField] private float interactionDistance = 3.0f;
        [SerializeField] private LayerMask interactableLayer; // Layer for interactable objects

        private CharacterController _characterController;
        private Animator _animator;
        private Vector3 _moveDirection = Vector3.zero;

        // Animator parameters
        private static readonly int IsWalking = Animator.StringToHash("IsWalking");
        private static readonly int IsRunning = Animator.StringToHash("IsRunning"); // New parameter

        private void Awake()
        {
            _characterController = GetComponent<CharacterController>();
            _animator = GetComponent<Animator>();

            if (_characterController == null)
            {
                Debug.LogError("PlayerCharacter: CharacterController not found on this GameObject.");
            }
            if (_animator == null)
            {
                Debug.LogWarning("PlayerCharacter: Animator not found on this GameObject. Animations will not play.");
            }
        }

        private void OnEnable()
        {
            PlayerInput.OnMoveInput += HandleMoveInput;
            GameManager.OnGameStateChanged += HandleGameStateChanged; // Subscribe to game state changes
        }

        private void OnDisable()
        {
            PlayerInput.OnMoveInput -= HandleMoveInput;
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
        }

        private void HandleMoveInput(Vector2 input)
        {
            _moveDirection = new Vector3(input.x, 0, input.y).normalized;
        }

        private void HandleGameStateChanged(GameStateEnum previousState, GameStateEnum newState)
        {
            // Potentially adjust player behavior based on game state (e.g., disable movement in menus)
            if (newState != GameStateEnum.InGame)
            {
                _moveDirection = Vector3.zero; // Stop movement if not in game
                UpdateAnimation(); // Update animations to idle
            }
        }

        private void Update()
        {
            if (GameManager.Instance.CurrentGameState == GameStateEnum.InGame) // Only apply movement/animation in InGame state
            {
                ApplyMovement();
                UpdateAnimation();
            }
        }

        private void ApplyMovement()
        {
            if (_moveDirection.magnitude > 0.1f)
            {
                // Rotate towards movement direction
                Quaternion targetRotation = Quaternion.LookRotation(_moveDirection);
                transform.rotation = Quaternion.RotateTowards(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);

                // Move the character
                _characterController.Move(transform.forward * moveSpeed * Time.deltaTime);
            }
        }

        private void UpdateAnimation()
        {
            if (_animator != null)
            {
                bool isMoving = _moveDirection.magnitude > 0.1f;
                _animator.SetBool(IsWalking, isMoving);
                _animator.SetBool(IsRunning, isMoving && Input.GetKey(KeyCode.LeftShift)); // Example: Shift for running
                // The IsInteractingAnim parameter will be set by PlayerInteraction.cs
            }
        }
    }
}