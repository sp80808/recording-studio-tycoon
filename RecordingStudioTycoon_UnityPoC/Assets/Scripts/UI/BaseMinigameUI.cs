using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using RecordingStudioTycoon.Systems.Tutorial;

namespace RecordingStudioTycoon.UI
{
    public class BaseMinigameUI : MonoBehaviour
    {
        [Header("Core UI Elements")]
        [SerializeField] private Slider progressBar;
        [SerializeField] private TextMeshProUGUI timerText;
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI toolText;
        [SerializeField] private TextMeshProUGUI parameterText;

        [Header("Panels")]
        [SerializeField] private GameObject toolSelectionPanel;
        [SerializeField] private GameObject parameterPanel;
        [SerializeField] private GameObject helpPanel;
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private GameObject resultsPanel;

        [Header("Results Panel Elements")]
        [SerializeField] private TextMeshProUGUI finalScoreText;
        [SerializeField] private TextMeshProUGUI timeBonusText;
        [SerializeField] private TextMeshProUGUI accuracyText;
        [SerializeField] private Button continueButton;
        [SerializeField] private Button retryButton;

        [Header("Help Panel Elements")]
        [SerializeField] private TextMeshProUGUI helpTitleText;
        [SerializeField] private TextMeshProUGUI helpContentText;
        [SerializeField] private Button helpCloseButton;

        [Header("Pause Panel Elements")]
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button quitButton;

        [Header("Tutorial Elements")]
        [SerializeField] private TutorialOverlay tutorialOverlay;

        private Systems.Minigame.BaseMinigame currentMinigame;
        private bool isPaused;
        private bool isHelpVisible;

        private void Awake()
        {
            InitializeUI();
        }

        private void InitializeUI()
        {
            // Initialize button listeners
            if (continueButton) continueButton.onClick.AddListener(OnContinueClicked);
            if (retryButton) retryButton.onClick.AddListener(OnRetryClicked);
            if (helpCloseButton) helpCloseButton.onClick.AddListener(OnHelpCloseClicked);
            if (resumeButton) resumeButton.onClick.AddListener(OnResumeClicked);
            if (settingsButton) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (quitButton) quitButton.onClick.AddListener(OnQuitClicked);

            // Hide panels initially
            if (toolSelectionPanel) toolSelectionPanel.SetActive(false);
            if (parameterPanel) parameterPanel.SetActive(false);
            if (helpPanel) helpPanel.SetActive(false);
            if (pausePanel) pausePanel.SetActive(false);
            if (resultsPanel) resultsPanel.SetActive(false);
        }

        public void Initialize(Systems.Minigame.BaseMinigame minigame)
        {
            currentMinigame = minigame;
            UpdateUI();
        }

        private void Update()
        {
            if (currentMinigame != null && !isPaused)
            {
                UpdateUI();
            }
        }

        private void UpdateUI()
        {
            // Update progress
            if (progressBar)
            {
                progressBar.value = currentMinigame.progress;
            }

            // Update timer
            if (timerText)
            {
                timerText.text = FormatTime(currentMinigame.timeRemaining);
            }

            // Update score
            if (scoreText)
            {
                scoreText.text = $"Score: {currentMinigame.score}";
            }
        }

        public void ShowToolSelection(string[] tools, int selectedIndex)
        {
            if (toolSelectionPanel)
            {
                toolSelectionPanel.SetActive(true);
                // TODO: Populate tool selection UI
            }
        }

        public void ShowParameters(Dictionary<string, float> parameters)
        {
            if (parameterPanel)
            {
                parameterPanel.SetActive(true);
                // TODO: Populate parameter UI
            }
        }

        public void ShowHelp(string title, string content)
        {
            if (helpPanel)
            {
                helpPanel.SetActive(true);
                if (helpTitleText) helpTitleText.text = title;
                if (helpContentText) helpContentText.text = content;
                isHelpVisible = true;
            }
        }

        public void ShowPauseMenu()
        {
            if (pausePanel)
            {
                pausePanel.SetActive(true);
                isPaused = true;
                Time.timeScale = 0f;
            }
        }

        public void ShowResults(int finalScore, int timeBonus, float accuracy)
        {
            if (resultsPanel)
            {
                resultsPanel.SetActive(true);
                if (finalScoreText) finalScoreText.text = $"Final Score: {finalScore}";
                if (timeBonusText) timeBonusText.text = $"Time Bonus: {timeBonus}";
                if (accuracyText) accuracyText.text = $"Accuracy: {accuracy:F1}%";
            }
        }

        private string FormatTime(float timeInSeconds)
        {
            int minutes = Mathf.FloorToInt(timeInSeconds / 60f);
            int seconds = Mathf.FloorToInt(timeInSeconds % 60f);
            return string.Format("{0:00}:{1:00}", minutes, seconds);
        }

        #region Button Callbacks

        private void OnContinueClicked()
        {
            if (resultsPanel) resultsPanel.SetActive(false);
            // TODO: Handle continue logic
        }

        private void OnRetryClicked()
        {
            if (resultsPanel) resultsPanel.SetActive(false);
            if (currentMinigame != null)
            {
                currentMinigame.Initialize(currentMinigame.difficulty);
            }
        }

        private void OnHelpCloseClicked()
        {
            if (helpPanel)
            {
                helpPanel.SetActive(false);
                isHelpVisible = false;
            }
        }

        private void OnResumeClicked()
        {
            if (pausePanel)
            {
                pausePanel.SetActive(false);
                isPaused = false;
                Time.timeScale = 1f;
            }
        }

        private void OnSettingsClicked()
        {
            // TODO: Show settings panel
        }

        private void OnQuitClicked()
        {
            // TODO: Handle quit logic
            #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
            #else
            Application.Quit();
            #endif
        }

        #endregion

        private void OnEnable()
        {
            if (TutorialManager.Instance != null)
            {
                TutorialManager.Instance.OnStepChanged += HandleTutorialStep;
                TutorialManager.Instance.OnTutorialComplete += HideTutorialOverlay;
            }
        }

        private void OnDisable()
        {
            if (TutorialManager.Instance != null)
            {
                TutorialManager.Instance.OnStepChanged -= HandleTutorialStep;
                TutorialManager.Instance.OnTutorialComplete -= HideTutorialOverlay;
            }
        }

        private void HandleTutorialStep(TutorialStep step, int index, int total)
        {
            RectTransform target = FindTargetRect(step.targetElement);
            if (tutorialOverlay)
            {
                tutorialOverlay.Show(step.title, step.content, target, step.highlight);
            }
        }

        private void HideTutorialOverlay()
        {
            if (tutorialOverlay)
            {
                tutorialOverlay.Hide();
            }
        }

        private RectTransform FindTargetRect(string targetElement)
        {
            if (string.IsNullOrEmpty(targetElement)) return null;
            // Try to find by name
            var go = GameObject.Find(targetElement);
            if (go != null) return go.GetComponent<RectTransform>();
            // Try to find by tag
            var tagged = GameObject.FindGameObjectWithTag(targetElement);
            if (tagged != null) return tagged.GetComponent<RectTransform>();
            return null;
        }
    }
} 