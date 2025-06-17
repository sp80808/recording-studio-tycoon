using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace RecordingStudioTycoon.UI
{
    public class TutorialOverlay : MonoBehaviour
    {
        [Header("Overlay Elements")]
        [SerializeField] private Image dimBackground;
        [SerializeField] private RectTransform highlightRect;
        [SerializeField] private Image highlightImage;
        [SerializeField] private RectTransform tooltipRect;
        [SerializeField] private TextMeshProUGUI tooltipTitle;
        [SerializeField] private TextMeshProUGUI tooltipContent;
        [SerializeField] private Button nextButton;
        [SerializeField] private Button prevButton;
        [SerializeField] private Button closeButton;

        private Canvas canvas;

        private void Awake()
        {
            canvas = GetComponentInParent<Canvas>();
            if (nextButton) nextButton.onClick.AddListener(OnNextClicked);
            if (prevButton) prevButton.onClick.AddListener(OnPrevClicked);
            if (closeButton) closeButton.onClick.AddListener(OnCloseClicked);
            Hide();
        }

        public void Show(string title, string content, RectTransform target, bool highlight)
        {
            gameObject.SetActive(true);
            if (tooltipTitle) tooltipTitle.text = title;
            if (tooltipContent) tooltipContent.text = content;
            if (highlight && target != null)
            {
                highlightRect.gameObject.SetActive(true);
                PositionHighlight(target);
            }
            else
            {
                highlightRect.gameObject.SetActive(false);
            }
            PositionTooltip(target);
        }

        public void Hide()
        {
            gameObject.SetActive(false);
        }

        private void PositionHighlight(RectTransform target)
        {
            Vector3[] worldCorners = new Vector3[4];
            target.GetWorldCorners(worldCorners);
            Vector3 min = worldCorners[0];
            Vector3 max = worldCorners[2];
            Vector2 size = max - min;
            Vector2 pos = min;
            highlightRect.position = pos;
            highlightRect.sizeDelta = size;
        }

        private void PositionTooltip(RectTransform target)
        {
            if (target != null)
            {
                Vector3[] worldCorners = new Vector3[4];
                target.GetWorldCorners(worldCorners);
                Vector3 above = (worldCorners[1] + worldCorners[2]) / 2f;
                tooltipRect.position = above + new Vector3(0, 40, 0); // Offset above
            }
            else
            {
                tooltipRect.position = new Vector3(Screen.width / 2, Screen.height / 2, 0);
            }
        }

        private void OnNextClicked()
        {
            Systems.Tutorial.TutorialManager.Instance?.NextStep();
        }

        private void OnPrevClicked()
        {
            Systems.Tutorial.TutorialManager.Instance?.PrevStep();
        }

        private void OnCloseClicked()
        {
            Systems.Tutorial.TutorialManager.Instance?.CompleteTutorial();
            Hide();
        }
    }
} 