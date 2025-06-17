using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections.Generic;

namespace RecordingStudioTycoon.Core
{
    /// <summary>
    /// Manages input handling for the game using Unity's Input System
    /// </summary>
    public class InputManager : MonoBehaviour
    {
        [Header("Input Settings")]
        [SerializeField] private bool enableInput = true;
        [SerializeField] private float mouseWheelSensitivity = 1f;

        // Input Actions
        private PlayerInput playerInput;
        private InputActionMap gameplayMap;
        private InputActionMap uiMap;

        // Input Actions References
        private InputAction clickAction;
        private InputAction rightClickAction;
        private InputAction mousePositionAction;
        private InputAction scrollAction;
        private InputAction escapeAction;
        private InputAction submitAction;
        private InputAction cancelAction;

        // Events
        public static System.Action<Vector2> OnClick;
        public static System.Action<Vector2> OnRightClick;
        public static System.Action<Vector2> OnMouseMove;
        public static System.Action<float> OnScroll;
        public static System.Action OnEscape;
        public static System.Action OnSubmit;
        public static System.Action OnCancel;

        // Singleton
        public static InputManager Instance { get; private set; }

        // Properties
        public Vector2 MousePosition { get; private set; }
        public bool IsInputEnabled => enableInput;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeInput();
        }

        private void OnEnable()
        {
            EnableInput();
        }

        private void OnDisable()
        {
            DisableInput();
        }

        private void InitializeInput()
        {
            playerInput = GetComponent<PlayerInput>();
            if (playerInput == null)
            {
                playerInput = gameObject.AddComponent<PlayerInput>();
            }

            // Get action maps
            var inputActions = playerInput.actions;
            gameplayMap = inputActions.FindActionMap("Gameplay");
            uiMap = inputActions.FindActionMap("UI");

            // Get individual actions
            clickAction = gameplayMap?.FindAction("Click");
            rightClickAction = gameplayMap?.FindAction("RightClick");
            mousePositionAction = gameplayMap?.FindAction("MousePosition");
            scrollAction = gameplayMap?.FindAction("Scroll");
            
            escapeAction = uiMap?.FindAction("Escape");
            submitAction = uiMap?.FindAction("Submit");
            cancelAction = uiMap?.FindAction("Cancel");

            // Subscribe to actions
            SubscribeToActions();
        }

        private void SubscribeToActions()
        {
            if (clickAction != null)
            {
                clickAction.performed += OnClickPerformed;
            }

            if (rightClickAction != null)
            {
                rightClickAction.performed += OnRightClickPerformed;
            }

            if (mousePositionAction != null)
            {
                mousePositionAction.performed += OnMousePositionChanged;
            }

            if (scrollAction != null)
            {
                scrollAction.performed += OnScrollPerformed;
            }

            if (escapeAction != null)
            {
                escapeAction.performed += OnEscapePerformed;
            }

            if (submitAction != null)
            {
                submitAction.performed += OnSubmitPerformed;
            }

            if (cancelAction != null)
            {
                cancelAction.performed += OnCancelPerformed;
            }
        }

        private void UnsubscribeFromActions()
        {
            if (clickAction != null)
            {
                clickAction.performed -= OnClickPerformed;
            }

            if (rightClickAction != null)
            {
                rightClickAction.performed -= OnRightClickPerformed;
            }

            if (mousePositionAction != null)
            {
                mousePositionAction.performed -= OnMousePositionChanged;
            }

            if (scrollAction != null)
            {
                scrollAction.performed -= OnScrollPerformed;
            }

            if (escapeAction != null)
            {
                escapeAction.performed -= OnEscapePerformed;
            }

            if (submitAction != null)
            {
                submitAction.performed -= OnSubmitPerformed;
            }

            if (cancelAction != null)
            {
                cancelAction.performed -= OnCancelPerformed;
            }
        }

        #region Input Callbacks

        private void OnClickPerformed(InputAction.CallbackContext context)
        {
            if (!enableInput) return;
            OnClick?.Invoke(MousePosition);
        }

        private void OnRightClickPerformed(InputAction.CallbackContext context)
        {
            if (!enableInput) return;
            OnRightClick?.Invoke(MousePosition);
        }

        private void OnMousePositionChanged(InputAction.CallbackContext context)
        {
            MousePosition = context.ReadValue<Vector2>();
            OnMouseMove?.Invoke(MousePosition);
        }

        private void OnScrollPerformed(InputAction.CallbackContext context)
        {
            if (!enableInput) return;
            float scrollValue = context.ReadValue<Vector2>().y * mouseWheelSensitivity;
            OnScroll?.Invoke(scrollValue);
        }

        private void OnEscapePerformed(InputAction.CallbackContext context)
        {
            if (!enableInput) return;
            OnEscape?.Invoke();
        }

        private void OnSubmitPerformed(InputAction.CallbackContext context)
        {
            if (!enableInput) return;
            OnSubmit?.Invoke();
        }

        private void OnCancelPerformed(InputAction.CallbackContext context)
        {
            if (!enableInput) return;
            OnCancel?.Invoke();
        }

        #endregion

        #region Public Methods

        public void EnableInput()
        {
            enableInput = true;
            if (playerInput != null)
            {
                playerInput.enabled = true;
            }
        }

        public void DisableInput()
        {
            enableInput = false;
            if (playerInput != null)
            {
                playerInput.enabled = false;
            }
        }

        public void SwitchToGameplayControls()
        {
            if (gameplayMap != null)
            {
                gameplayMap.Enable();
            }
            if (uiMap != null)
            {
                uiMap.Disable();
            }
        }

        public void SwitchToUIControls()
        {
            if (uiMap != null)
            {
                uiMap.Enable();
            }
            if (gameplayMap != null)
            {
                gameplayMap.Disable();
            }
        }

        public void EnableAllControls()
        {
            if (gameplayMap != null)
            {
                gameplayMap.Enable();
            }
            if (uiMap != null)
            {
                uiMap.Enable();
            }
        }

        public bool IsActionPressed(string actionName)
        {
            var action = playerInput.actions.FindAction(actionName);
            return action?.IsPressed() ?? false;
        }

        public Vector2 GetMouseWorldPosition(Camera camera = null)
        {
            if (camera == null)
            {
                camera = Camera.main;
            }

            if (camera != null)
            {
                return camera.ScreenToWorldPoint(MousePosition);
            }

            return MousePosition;
        }

        #endregion

        #region Legacy Input Support (Fallback)

        private void Update()
        {
            // Fallback for when Input System is not properly configured
            if (playerInput == null || playerInput.actions == null)
            {
                HandleLegacyInput();
            }
        }

        private void HandleLegacyInput()
        {
            if (!enableInput) return;

            // Mouse position
            Vector2 mousePos = Input.mousePosition;
            if (mousePos != MousePosition)
            {
                MousePosition = mousePos;
                OnMouseMove?.Invoke(MousePosition);
            }

            // Mouse clicks
            if (Input.GetMouseButtonDown(0))
            {
                OnClick?.Invoke(MousePosition);
            }

            if (Input.GetMouseButtonDown(1))
            {
                OnRightClick?.Invoke(MousePosition);
            }

            // Scroll wheel
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (scroll != 0)
            {
                OnScroll?.Invoke(scroll * mouseWheelSensitivity);
            }

            // Keyboard
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                OnEscape?.Invoke();
            }

            if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
            {
                OnSubmit?.Invoke();
            }

            if (Input.GetKeyDown(KeyCode.Escape))
            {
                OnCancel?.Invoke();
            }
        }

        #endregion

        private void OnDestroy()
        {
            UnsubscribeFromActions();
        }
    }
}
