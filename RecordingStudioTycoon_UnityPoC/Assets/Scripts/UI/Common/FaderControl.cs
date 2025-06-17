using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;

namespace RecordingStudioTycoon.UI.Common
{
    public class FaderControl : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IDragHandler
    {
        [Header("Visual Elements")]
        [SerializeField] private RectTransform faderTransform;
        [SerializeField] private Image faderImage;
        [SerializeField] private TextMeshProUGUI valueText;
        [SerializeField] private TextMeshProUGUI labelText;
        [SerializeField] private Image backgroundImage;
        [SerializeField] private Image meterImage;

        [Header("Fader Settings")]
        [SerializeField] private float minValue = -60f;
        [SerializeField] private float maxValue = 12f;
        [SerializeField] private float defaultValue = 0f;
        [SerializeField] private float sensitivity = 1f;
        [SerializeField] private bool snapToZero = true;
        [SerializeField] private float snapThreshold = 0.1f;
        [SerializeField] private string valueFormat = "F1";
        [SerializeField] private string unit = "dB";
        [SerializeField] private Color normalColor = Color.white;
        [SerializeField] private Color peakColor = Color.red;
        [SerializeField] private float peakThreshold = 0f;

        private float currentValue;
        private bool isDragging;
        private Vector2 lastMousePosition;
        private System.Action<float> onValueChanged;
        private bool isPeaking;

        private void Awake()
        {
            Initialize();
        }

        private void Initialize()
        {
            currentValue = defaultValue;
            UpdateVisuals();
        }

        public void SetValue(float value, bool notify = true)
        {
            currentValue = Mathf.Clamp(value, minValue, maxValue);
            UpdateVisuals();
            if (notify)
            {
                onValueChanged?.Invoke(currentValue);
            }
        }

        public void SetLabel(string label)
        {
            if (labelText)
            {
                labelText.text = label;
            }
        }

        public void SetOnValueChanged(System.Action<float> callback)
        {
            onValueChanged = callback;
        }

        private void UpdateVisuals()
        {
            // Update fader position
            if (faderTransform)
            {
                float normalizedValue = (currentValue - minValue) / (maxValue - minValue);
                Vector2 position = faderTransform.anchoredPosition;
                position.y = Mathf.Lerp(0f, 1f, normalizedValue);
                faderTransform.anchoredPosition = position;
            }

            // Update value text
            if (valueText)
            {
                valueText.text = currentValue.ToString(valueFormat) + unit;
            }

            // Update meter
            if (meterImage)
            {
                float normalizedValue = (currentValue - minValue) / (maxValue - minValue);
                meterImage.fillAmount = normalizedValue;

                // Update peak indicator
                isPeaking = currentValue >= peakThreshold;
                meterImage.color = isPeaking ? peakColor : normalColor;
            }
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            isDragging = true;
            lastMousePosition = eventData.position;
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            isDragging = false;
            if (snapToZero && Mathf.Abs(currentValue) < snapThreshold)
            {
                SetValue(0f);
            }
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (!isDragging) return;

            Vector2 delta = eventData.position - lastMousePosition;
            float valueDelta = -delta.y * sensitivity;
            
            // Calculate new value based on drag
            float normalizedValue = (currentValue - minValue) / (maxValue - minValue);
            normalizedValue += valueDelta;
            normalizedValue = Mathf.Clamp01(normalizedValue);
            
            float newValue = Mathf.Lerp(minValue, maxValue, normalizedValue);
            SetValue(newValue);
            
            lastMousePosition = eventData.position;
        }

        public float GetValue()
        {
            return currentValue;
        }

        public void ResetToDefault()
        {
            SetValue(defaultValue);
        }

        public bool IsPeaking()
        {
            return isPeaking;
        }
    }
} 