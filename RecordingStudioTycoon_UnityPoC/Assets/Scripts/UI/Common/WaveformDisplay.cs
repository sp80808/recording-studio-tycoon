using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

namespace RecordingStudioTycoon.UI.Common
{
    public class WaveformDisplay : MonoBehaviour
    {
        [Header("Visual Elements")]
        [SerializeField] private RectTransform waveformContainer;
        [SerializeField] private Image waveformImage;
        [SerializeField] private Image selectionImage;
        [SerializeField] private Image playheadImage;
        [SerializeField] private Image gridImage;

        [Header("Waveform Settings")]
        [SerializeField] private Color waveformColor = Color.white;
        [SerializeField] private Color selectionColor = new Color(1f, 1f, 1f, 0.3f);
        [SerializeField] private Color playheadColor = Color.red;
        [SerializeField] private Color gridColor = new Color(1f, 1f, 1f, 0.1f);
        [SerializeField] private float gridLineSpacing = 50f;
        [SerializeField] private float minAmplitude = 0.1f;
        [SerializeField] private float zoomLevel = 1f;
        [SerializeField] private float scrollPosition = 0f;

        private float[] audioData;
        private float duration;
        private float currentTime;
        private float selectionStart;
        private float selectionEnd;
        private bool isPlaying;
        private System.Action<float> onTimeChanged;
        private System.Action<float, float> onSelectionChanged;

        private void Awake()
        {
            Initialize();
        }

        private void Initialize()
        {
            if (waveformImage)
            {
                waveformImage.color = waveformColor;
            }
            if (selectionImage)
            {
                selectionImage.color = selectionColor;
            }
            if (playheadImage)
            {
                playheadImage.color = playheadColor;
            }
            if (gridImage)
            {
                gridImage.color = gridColor;
            }
        }

        public void SetAudioData(float[] data, float sampleRate)
        {
            audioData = data;
            duration = data.Length / sampleRate;
            UpdateWaveform();
        }

        public void SetTime(float time)
        {
            currentTime = Mathf.Clamp(time, 0f, duration);
            UpdatePlayhead();
            onTimeChanged?.Invoke(currentTime);
        }

        public void SetSelection(float start, float end)
        {
            selectionStart = Mathf.Clamp(start, 0f, duration);
            selectionEnd = Mathf.Clamp(end, 0f, duration);
            UpdateSelection();
            onSelectionChanged?.Invoke(selectionStart, selectionEnd);
        }

        public void SetZoom(float zoom)
        {
            zoomLevel = Mathf.Clamp(zoom, 0.1f, 10f);
            UpdateWaveform();
        }

        public void SetScroll(float position)
        {
            scrollPosition = Mathf.Clamp(position, 0f, 1f);
            UpdateWaveform();
        }

        public void SetPlaying(bool playing)
        {
            isPlaying = playing;
        }

        public void SetOnTimeChanged(System.Action<float> callback)
        {
            onTimeChanged = callback;
        }

        public void SetOnSelectionChanged(System.Action<float, float> callback)
        {
            onSelectionChanged = callback;
        }

        private void UpdateWaveform()
        {
            if (audioData == null || waveformImage == null) return;

            // Create texture for waveform
            int width = Mathf.RoundToInt(waveformContainer.rect.width * zoomLevel);
            int height = Mathf.RoundToInt(waveformContainer.rect.height);
            Texture2D texture = new Texture2D(width, height);
            Color[] pixels = new Color[width * height];

            // Calculate samples per pixel
            float samplesPerPixel = audioData.Length / (float)width;
            int startSample = Mathf.RoundToInt(scrollPosition * audioData.Length);

            // Draw waveform
            for (int x = 0; x < width; x++)
            {
                int sampleIndex = startSample + Mathf.RoundToInt(x * samplesPerPixel);
                if (sampleIndex >= audioData.Length) break;

                float amplitude = Mathf.Abs(audioData[sampleIndex]);
                int pixelHeight = Mathf.RoundToInt(amplitude * height);
                int centerY = height / 2;

                // Draw vertical line
                for (int y = 0; y < height; y++)
                {
                    int pixelIndex = y * width + x;
                    if (y >= centerY - pixelHeight && y <= centerY + pixelHeight)
                    {
                        pixels[pixelIndex] = waveformColor;
                    }
                    else
                    {
                        pixels[pixelIndex] = Color.clear;
                    }
                }
            }

            // Apply texture
            texture.SetPixels(pixels);
            texture.Apply();
            waveformImage.sprite = Sprite.Create(texture, new Rect(0, 0, width, height), Vector2.zero);
        }

        private void UpdatePlayhead()
        {
            if (playheadImage == null) return;

            float normalizedTime = currentTime / duration;
            float xPos = normalizedTime * waveformContainer.rect.width;
            playheadImage.rectTransform.anchoredPosition = new Vector2(xPos, 0f);
        }

        private void UpdateSelection()
        {
            if (selectionImage == null) return;

            float startX = (selectionStart / duration) * waveformContainer.rect.width;
            float endX = (selectionEnd / duration) * waveformContainer.rect.width;
            float width = endX - startX;

            selectionImage.rectTransform.anchoredPosition = new Vector2(startX, 0f);
            selectionImage.rectTransform.sizeDelta = new Vector2(width, waveformContainer.rect.height);
        }

        private void UpdateGrid()
        {
            if (gridImage == null) return;

            // Create grid texture
            int width = Mathf.RoundToInt(waveformContainer.rect.width);
            int height = Mathf.RoundToInt(waveformContainer.rect.height);
            Texture2D texture = new Texture2D(width, height);
            Color[] pixels = new Color[width * height];

            // Draw vertical grid lines
            for (float x = 0; x < width; x += gridLineSpacing)
            {
                int lineX = Mathf.RoundToInt(x);
                for (int y = 0; y < height; y++)
                {
                    pixels[y * width + lineX] = gridColor;
                }
            }

            // Apply texture
            texture.SetPixels(pixels);
            texture.Apply();
            gridImage.sprite = Sprite.Create(texture, new Rect(0, 0, width, height), Vector2.zero);
        }

        private void Update()
        {
            if (isPlaying)
            {
                currentTime += Time.deltaTime;
                if (currentTime >= duration)
                {
                    currentTime = 0f;
                }
                UpdatePlayhead();
                onTimeChanged?.Invoke(currentTime);
            }
        }
    }
} 