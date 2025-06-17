using DG.Tweening;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace RecordingStudioTycoon.UI.Animation
{
    /// <summary>
    /// Manages UI animations throughout the game using DOTween
    /// </summary>
    public class UIAnimationManager : MonoBehaviour
    {
        [Header("Animation Settings")]
        [SerializeField] private float defaultDuration = 0.3f;
        [SerializeField] private Ease defaultEase = Ease.OutQuad;
        [SerializeField] private float panelFadeDuration = 0.25f;
        [SerializeField] private float buttonScaleDuration = 0.1f;

        [Header("Modal Settings")]
        [SerializeField] private float modalBackgroundFadeDuration = 0.2f;
        [SerializeField] private Vector3 modalScaleStart = new Vector3(0.8f, 0.8f, 1f);
        [SerializeField] private float modalAnimationDuration = 0.3f;

        [Header("Notification Settings")]
        [SerializeField] private Vector3 notificationSlideDistance = new Vector3(300f, 0f, 0f);
        [SerializeField] private float notificationDuration = 0.4f;
        [SerializeField] private float notificationStayTime = 3f;

        [Header("Loading Settings")]
        [SerializeField] private float loadingRotationSpeed = 360f;
        [SerializeField] private float pulseScale = 1.1f;
        [SerializeField] private float pulseDuration = 1f;

        // Singleton
        public static UIAnimationManager Instance { get; private set; }

        // Animation sequences
        private Dictionary<string, Sequence> activeSequences = new Dictionary<string, Sequence>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            
            // Initialize DOTween settings
            DOTween.Init(false, true, LogBehaviour.ErrorsOnly);
        }

        private void OnDestroy()
        {
            // Kill all active sequences
            foreach (var sequence in activeSequences.Values)
            {
                sequence?.Kill();
            }
            activeSequences.Clear();
        }

        #region Panel Animations

        public void ShowPanel(GameObject panel, System.Action onComplete = null)
        {
            if (panel == null) return;

            string key = GetAnimationKey(panel, "show");
            KillSequence(key);

            CanvasGroup canvasGroup = GetOrAddCanvasGroup(panel);
            RectTransform rectTransform = panel.GetComponent<RectTransform>();

            // Set initial state
            canvasGroup.alpha = 0f;
            canvasGroup.interactable = false;
            canvasGroup.blocksRaycasts = false;
            rectTransform.localScale = modalScaleStart;

            panel.SetActive(true);

            // Create animation sequence
            Sequence sequence = DOTween.Sequence();
            sequence.Append(canvasGroup.DOFade(1f, panelFadeDuration));
            sequence.Join(rectTransform.DOScale(Vector3.one, panelFadeDuration).SetEase(Ease.OutBack));
            sequence.OnComplete(() =>
            {
                canvasGroup.interactable = true;
                canvasGroup.blocksRaycasts = true;
                onComplete?.Invoke();
            });

            activeSequences[key] = sequence;
        }

        public void HidePanel(GameObject panel, System.Action onComplete = null)
        {
            if (panel == null) return;

            string key = GetAnimationKey(panel, "hide");
            KillSequence(key);

            CanvasGroup canvasGroup = GetOrAddCanvasGroup(panel);
            RectTransform rectTransform = panel.GetComponent<RectTransform>();

            canvasGroup.interactable = false;
            canvasGroup.blocksRaycasts = false;

            Sequence sequence = DOTween.Sequence();
            sequence.Append(canvasGroup.DOFade(0f, panelFadeDuration));
            sequence.Join(rectTransform.DOScale(modalScaleStart, panelFadeDuration).SetEase(Ease.InBack));
            sequence.OnComplete(() =>
            {
                panel.SetActive(false);
                onComplete?.Invoke();
            });

            activeSequences[key] = sequence;
        }

        public void SlideInPanel(GameObject panel, Vector3 fromDirection, System.Action onComplete = null)
        {
            if (panel == null) return;

            string key = GetAnimationKey(panel, "slideIn");
            KillSequence(key);

            RectTransform rectTransform = panel.GetComponent<RectTransform>();
            CanvasGroup canvasGroup = GetOrAddCanvasGroup(panel);

            Vector3 originalPosition = rectTransform.anchoredPosition;
            rectTransform.anchoredPosition = originalPosition + fromDirection;
            canvasGroup.alpha = 0f;

            panel.SetActive(true);

            Sequence sequence = DOTween.Sequence();
            sequence.Append(rectTransform.DOAnchorPos(originalPosition, defaultDuration).SetEase(defaultEase));
            sequence.Join(canvasGroup.DOFade(1f, defaultDuration));
            sequence.OnComplete(() =>
            {
                canvasGroup.interactable = true;
                canvasGroup.blocksRaycasts = true;
                onComplete?.Invoke();
            });

            activeSequences[key] = sequence;
        }

        #endregion

        #region Button Animations

        public void AnimateButtonPress(Button button)
        {
            if (button == null) return;

            Transform buttonTransform = button.transform;
            string key = GetAnimationKey(button.gameObject, "press");
            KillSequence(key);

            Sequence sequence = DOTween.Sequence();
            sequence.Append(buttonTransform.DOScale(0.95f, buttonScaleDuration));
            sequence.Append(buttonTransform.DOScale(1f, buttonScaleDuration));

            activeSequences[key] = sequence;
        }

        public void AnimateButtonHover(Button button, bool isHovering)
        {
            if (button == null) return;

            Transform buttonTransform = button.transform;
            string key = GetAnimationKey(button.gameObject, "hover");
            KillSequence(key);

            float targetScale = isHovering ? 1.05f : 1f;
            buttonTransform.DOScale(targetScale, buttonScaleDuration).SetEase(Ease.OutQuad);
        }

        #endregion

        #region Modal Animations

        public void ShowModal(GameObject modal, GameObject background = null, System.Action onComplete = null)
        {
            if (modal == null) return;

            string key = GetAnimationKey(modal, "showModal");
            KillSequence(key);

            // Animate background if provided
            if (background != null)
            {
                CanvasGroup bgCanvasGroup = GetOrAddCanvasGroup(background);
                bgCanvasGroup.alpha = 0f;
                background.SetActive(true);
                bgCanvasGroup.DOFade(0.8f, modalBackgroundFadeDuration);
            }

            // Animate modal
            ShowPanel(modal, onComplete);
        }

        public void HideModal(GameObject modal, GameObject background = null, System.Action onComplete = null)
        {
            if (modal == null) return;

            string key = GetAnimationKey(modal, "hideModal");
            KillSequence(key);

            // Hide modal first
            HidePanel(modal, () =>
            {
                // Then hide background
                if (background != null)
                {
                    CanvasGroup bgCanvasGroup = GetOrAddCanvasGroup(background);
                    bgCanvasGroup.DOFade(0f, modalBackgroundFadeDuration).OnComplete(() =>
                    {
                        background.SetActive(false);
                        onComplete?.Invoke();
                    });
                }
                else
                {
                    onComplete?.Invoke();
                }
            });
        }

        #endregion

        #region Notification Animations

        public void ShowNotification(GameObject notification, System.Action onComplete = null)
        {
            if (notification == null) return;

            string key = GetAnimationKey(notification, "notification");
            KillSequence(key);

            RectTransform rectTransform = notification.GetComponent<RectTransform>();
            CanvasGroup canvasGroup = GetOrAddCanvasGroup(notification);

            Vector3 originalPosition = rectTransform.anchoredPosition;
            rectTransform.anchoredPosition = originalPosition + notificationSlideDistance;
            canvasGroup.alpha = 0f;

            notification.SetActive(true);

            Sequence sequence = DOTween.Sequence();
            // Slide in
            sequence.Append(rectTransform.DOAnchorPos(originalPosition, notificationDuration).SetEase(Ease.OutBack));
            sequence.Join(canvasGroup.DOFade(1f, notificationDuration));
            // Stay visible
            sequence.AppendInterval(notificationStayTime);
            // Slide out
            sequence.Append(rectTransform.DOAnchorPos(originalPosition + notificationSlideDistance, notificationDuration).SetEase(Ease.InBack));
            sequence.Join(canvasGroup.DOFade(0f, notificationDuration));
            sequence.OnComplete(() =>
            {
                notification.SetActive(false);
                onComplete?.Invoke();
            });

            activeSequences[key] = sequence;
        }

        #endregion

        #region Loading Animations

        public void StartLoadingAnimation(GameObject loadingIcon)
        {
            if (loadingIcon == null) return;

            string key = GetAnimationKey(loadingIcon, "loading");
            KillSequence(key);

            Transform iconTransform = loadingIcon.transform;
            iconTransform.DORotate(new Vector3(0, 0, 360), 1f, RotateMode.FastBeyond360)
                .SetLoops(-1, LoopType.Restart)
                .SetEase(Ease.Linear);
        }

        public void StopLoadingAnimation(GameObject loadingIcon)
        {
            if (loadingIcon == null) return;

            string key = GetAnimationKey(loadingIcon, "loading");
            KillSequence(key);
        }

        public void StartPulseAnimation(GameObject target)
        {
            if (target == null) return;

            string key = GetAnimationKey(target, "pulse");
            KillSequence(key);

            Transform targetTransform = target.transform;
            targetTransform.DOScale(pulseScale, pulseDuration)
                .SetLoops(-1, LoopType.Yoyo)
                .SetEase(Ease.InOutSine);
        }

        public void StopPulseAnimation(GameObject target)
        {
            if (target == null) return;

            string key = GetAnimationKey(target, "pulse");
            KillSequence(key);
            
            target.transform.DOScale(Vector3.one, 0.2f);
        }

        #endregion

        #region Text Animations

        public void AnimateTextValue(TextMeshProUGUI text, int fromValue, int toValue, float duration = 1f, System.Action onComplete = null)
        {
            if (text == null) return;

            string key = GetAnimationKey(text.gameObject, "textValue");
            KillSequence(key);

            DOTween.To(() => fromValue, x => {
                text.text = x.ToString("N0");
            }, toValue, duration)
            .SetEase(Ease.OutQuad)
            .OnComplete(() => onComplete?.Invoke());
        }

        public void AnimateTextValue(TextMeshProUGUI text, float fromValue, float toValue, float duration = 1f, string format = "F2", System.Action onComplete = null)
        {
            if (text == null) return;

            string key = GetAnimationKey(text.gameObject, "textValue");
            KillSequence(key);

            DOTween.To(() => fromValue, x => {
                text.text = x.ToString(format);
            }, toValue, duration)
            .SetEase(Ease.OutQuad)
            .OnComplete(() => onComplete?.Invoke());
        }

        public void TypewriterEffect(TextMeshProUGUI text, string targetText, float charactersPerSecond = 30f, System.Action onComplete = null)
        {
            if (text == null) return;

            string key = GetAnimationKey(text.gameObject, "typewriter");
            KillSequence(key);

            text.text = "";
            float duration = targetText.Length / charactersPerSecond;

            DOTween.To(() => 0, x => {
                int characterCount = Mathf.FloorToInt(x);
                text.text = targetText.Substring(0, Mathf.Min(characterCount, targetText.Length));
            }, targetText.Length, duration)
            .SetEase(Ease.Linear)
            .OnComplete(() => {
                text.text = targetText;
                onComplete?.Invoke();
            });
        }

        #endregion

        #region Progress Bar Animations

        public void AnimateProgressBar(Slider progressBar, float targetValue, float duration = 1f, System.Action onComplete = null)
        {
            if (progressBar == null) return;

            string key = GetAnimationKey(progressBar.gameObject, "progress");
            KillSequence(key);

            progressBar.DOValue(targetValue, duration)
                .SetEase(Ease.OutQuad)
                .OnComplete(() => onComplete?.Invoke());
        }

        public void AnimateProgressBarWithText(Slider progressBar, TextMeshProUGUI text, float targetValue, float duration = 1f, System.Action onComplete = null)
        {
            if (progressBar == null) return;

            string key = GetAnimationKey(progressBar.gameObject, "progressText");
            KillSequence(key);

            float startValue = progressBar.value;
            
            DOTween.To(() => startValue, x => {
                progressBar.value = x;
                if (text != null)
                {
                    text.text = $"{Mathf.RoundToInt(x * 100)}%";
                }
            }, targetValue, duration)
            .SetEase(Ease.OutQuad)
            .OnComplete(() => onComplete?.Invoke());
        }

        #endregion

        #region Color Animations

        public void AnimateColor(Graphic graphic, Color targetColor, float duration = 0.5f, System.Action onComplete = null)
        {
            if (graphic == null) return;

            string key = GetAnimationKey(graphic.gameObject, "color");
            KillSequence(key);

            graphic.DOColor(targetColor, duration)
                .SetEase(defaultEase)
                .OnComplete(() => onComplete?.Invoke());
        }

        public void FlashColor(Graphic graphic, Color flashColor, float duration = 0.2f, int flashCount = 2)
        {
            if (graphic == null) return;

            string key = GetAnimationKey(graphic.gameObject, "flash");
            KillSequence(key);

            Color originalColor = graphic.color;
            
            Sequence sequence = DOTween.Sequence();
            for (int i = 0; i < flashCount; i++)
            {
                sequence.Append(graphic.DOColor(flashColor, duration / 2));
                sequence.Append(graphic.DOColor(originalColor, duration / 2));
            }

            activeSequences[key] = sequence;
        }

        #endregion

        #region Helper Methods

        private CanvasGroup GetOrAddCanvasGroup(GameObject obj)
        {
            CanvasGroup canvasGroup = obj.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = obj.AddComponent<CanvasGroup>();
            }
            return canvasGroup;
        }

        private string GetAnimationKey(GameObject obj, string animationType)
        {
            return $"{obj.GetInstanceID()}_{animationType}";
        }

        private void KillSequence(string key)
        {
            if (activeSequences.ContainsKey(key))
            {
                activeSequences[key]?.Kill();
                activeSequences.Remove(key);
            }
        }

        public void KillAllAnimations()
        {
            foreach (var sequence in activeSequences.Values)
            {
                sequence?.Kill();
            }
            activeSequences.Clear();
        }

        public void KillAnimationsForObject(GameObject obj)
        {
            var keysToRemove = new List<string>();
            string instanceId = obj.GetInstanceID().ToString();

            foreach (var key in activeSequences.Keys)
            {
                if (key.StartsWith(instanceId))
                {
                    activeSequences[key]?.Kill();
                    keysToRemove.Add(key);
                }
            }

            foreach (var key in keysToRemove)
            {
                activeSequences.Remove(key);
            }
        }

        #endregion

        #region Public Utility Methods

        public void DelayedCall(System.Action action, float delay)
        {
            DOVirtual.DelayedCall(delay, () => action?.Invoke());
        }

        public void ShakeTransform(Transform target, float strength = 1f, float duration = 0.5f)
        {
            if (target == null) return;

            string key = GetAnimationKey(target.gameObject, "shake");
            KillSequence(key);

            target.DOShakePosition(duration, strength, 10, 90, false, true);
        }

        #endregion
    }
}
