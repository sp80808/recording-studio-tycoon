using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;

namespace RecordingStudioTycoon.UI.Common
{
    public class KnobControl : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IDragHandler
    {
        [Header("Visual Elements")]
        [SerializeField] private RectTransform knobTransform;
        [SerializeField] private Image knobImage;
        [SerializeField] private TextMeshProUGUI valueText;
        [SerializeField] private TextMeshProUGUI labelText;

        [Header("Knob Settings")]
        [SerializeField] private float minValue = 0f;
        [SerializeField] private float maxValue = 100f;
        [SerializeField] private float defaultValue = 50f;
        [SerializeField] private float rotationRange = 270f;
        [SerializeField] private float sensitivity = 1f;
        [SerializeField] private bool snapToZero = true;
        [SerializeField] private float snapThreshold = 0.1f;
        [SerializeField] private string valueFormat = "F1";
        [SerializeField] private string unit = "";

        private float currentValue;
        private bool isDragging;
        private Vector2 lastMousePosition;
        private System.Action<float> onValueChanged;

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
            // Update knob rotation
            if (knobTransform)
            {
                float normalizedValue = (currentValue - minValue) / (maxValue - minValue);
                float rotation = Mathf.Lerp(-rotationRange / 2f, rotationRange / 2f, normalizedValue);
                knobTransform.localRotation = Quaternion.Euler(0f, 0f, rotation);
            }

            // Update value text
            if (valueText)
            {
                valueText.text = currentValue.ToString(valueFormat) + unit;
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
            float rotationDelta = delta.x * sensitivity;
            
            // Calculate new value based on rotation
            float normalizedValue = (currentValue - minValue) / (maxValue - minValue);
            normalizedValue += rotationDelta / rotationRange;
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
    }
} 