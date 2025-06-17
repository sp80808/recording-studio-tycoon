using UnityEngine;
using UnityEngine.UI;
using TMPro;
using RecordingStudioTycoon.DataModels.UI;
using System;

namespace RecordingStudioTycoon.UI.Modals
{
    public class GameModalsManager : MonoBehaviour
    {
        [Header("Review Modal Components")]
        [SerializeField] private GameObject reviewModalPanel;
        [SerializeField] private TextMeshProUGUI projectTitleText;
        [SerializeField] private TextMeshProUGUI creativityPointsText;
        [SerializeField] private TextMeshProUGUI technicalPointsText;
        [SerializeField] private TextMeshProUGUI qualityScoreText;
        [SerializeField] private TextMeshProUGUI paymentText;
        [SerializeField] private TextMeshProUGUI reputationText;
        [SerializeField] private TextMeshProUGUI experienceText;
        [SerializeField] private Button closeButton;

        [Header("Animation Settings")]
        [SerializeField] private float fadeInDuration = 0.3f;
        [SerializeField] private float fadeOutDuration = 0.2f;

        private ReviewData currentReviewData;
        private CanvasGroup reviewModalCanvasGroup;

        public static GameModalsManager Instance { get; private set; }

        public event Action OnReviewModalClosed;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeComponents();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeComponents()
        {
            // Get or add CanvasGroup for fade animations
            if (reviewModalPanel != null)
            {
                reviewModalCanvasGroup = reviewModalPanel.GetComponent<CanvasGroup>();
                if (reviewModalCanvasGroup == null)
                {
                    reviewModalCanvasGroup = reviewModalPanel.AddComponent<CanvasGroup>();
                }
            }

            // Setup close button
            if (closeButton != null)
            {
                closeButton.onClick.AddListener(CloseReviewModal);
            }

            // Initially hide all modals
            HideAllModals();
        }

        public void ShowReviewModal(ReviewData reviewData)
        {
            if (reviewData == null || reviewModalPanel == null) return;

            currentReviewData = reviewData;
            UpdateReviewModalData();
            
            reviewModalPanel.SetActive(true);
            StartCoroutine(FadeInModal(reviewModalCanvasGroup));
        }

        public void CloseReviewModal()
        {
            if (reviewModalPanel == null) return;

            StartCoroutine(FadeOutAndHide(reviewModalCanvasGroup, reviewModalPanel));
            OnReviewModalClosed?.Invoke();
        }

        private void UpdateReviewModalData()
        {
            if (currentReviewData == null) return;

            // Update project title
            if (projectTitleText != null)
            {
                projectTitleText.text = currentReviewData.projectTitle;
            }

            // Update creativity points
            if (creativityPointsText != null)
            {
                creativityPointsText.text = currentReviewData.creativityPoints.ToString();
            }

            // Update technical points
            if (technicalPointsText != null)
            {
                technicalPointsText.text = currentReviewData.technicalPoints.ToString();
            }

            // Update quality score
            if (qualityScoreText != null)
            {
                qualityScoreText.text = $"Quality Score: {currentReviewData.qualityScore}%";
            }

            // Update payment
            if (paymentText != null)
            {
                paymentText.text = $"${currentReviewData.payout:N0}";
                paymentText.color = Color.green;
            }

            // Update reputation gain
            if (reputationText != null)
            {
                reputationText.text = $"+{currentReviewData.repGain}";
                reputationText.color = new Color(0.3f, 0.7f, 1f); // Light blue
            }

            // Update experience gain
            if (experienceText != null)
            {
                experienceText.text = $"+{currentReviewData.xpGain} XP";
                experienceText.color = new Color(0.8f, 0.4f, 1f); // Purple
            }
        }

        private void HideAllModals()
        {
            if (reviewModalPanel != null)
            {
                reviewModalPanel.SetActive(false);
            }
        }

        private System.Collections.IEnumerator FadeInModal(CanvasGroup canvasGroup)
        {
            if (canvasGroup == null) yield break;

            canvasGroup.alpha = 0f;
            canvasGroup.interactable = true;
            canvasGroup.blocksRaycasts = true;

            float elapsedTime = 0f;
            while (elapsedTime < fadeInDuration)
            {
                elapsedTime += Time.deltaTime;
                canvasGroup.alpha = Mathf.Clamp01(elapsedTime / fadeInDuration);
                yield return null;
            }

            canvasGroup.alpha = 1f;
        }

        private System.Collections.IEnumerator FadeOutAndHide(CanvasGroup canvasGroup, GameObject panel)
        {
            if (canvasGroup == null) yield break;

            canvasGroup.interactable = false;
            canvasGroup.blocksRaycasts = false;

            float elapsedTime = 0f;
            float startAlpha = canvasGroup.alpha;

            while (elapsedTime < fadeOutDuration)
            {
                elapsedTime += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(startAlpha, 0f, elapsedTime / fadeOutDuration);
                yield return null;
            }

            canvasGroup.alpha = 0f;
            panel.SetActive(false);
        }

        // Public method for external scripts to check if any modal is open
        public bool IsAnyModalOpen()
        {
            return reviewModalPanel != null && reviewModalPanel.activeInHierarchy;
        }

        // Method to get current review data
        public ReviewData GetCurrentReviewData()
        {
            return currentReviewData;
        }

        private void OnDestroy()
        {
            if (closeButton != null)
            {
                closeButton.onClick.RemoveAllListeners();
            }
        }
    }
}
