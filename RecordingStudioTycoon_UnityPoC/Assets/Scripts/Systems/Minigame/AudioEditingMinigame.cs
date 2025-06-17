using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.UI;
using RecordingStudioTycoon.UI.Common;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class AudioEditingMinigame : BaseMinigame
    {
        [Header("UI References")]
        [SerializeField] private BaseMinigameUI ui;
        [SerializeField] private WaveformDisplay waveformDisplay;
        [SerializeField] private KnobControl zoomKnob;
        [SerializeField] private KnobControl gainKnob;
        [SerializeField] private KnobControl panKnob;

        [Header("Audio Settings")]
        [SerializeField] private float sampleRate = 44100f;
        [SerializeField] private float minGain = -60f;
        [SerializeField] private float maxGain = 12f;
        [SerializeField] private float minPan = -1f;
        [SerializeField] private float maxPan = 1f;

        private float[] audioData;
        private float[] processedData;
        private float currentGain;
        private float currentPan;
        private float selectionStart;
        private float selectionEnd;
        private float playheadPosition;
        private List<EditOperation> editHistory;
        private int currentEditIndex;

        private class EditOperation
        {
            public float[] data;
            public float startTime;
            public float endTime;
            public string operationType;
            public Dictionary<string, float> parameters;
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            editHistory = new List<EditOperation>();
            currentEditIndex = -1;

            // Initialize UI
            if (ui)
            {
                ui.Initialize(this);
            }

            // Initialize waveform display
            if (waveformDisplay)
            {
                waveformDisplay.SetOnTimeChanged(OnTimeChanged);
                waveformDisplay.SetOnSelectionChanged(OnSelectionChanged);
            }

            // Initialize knobs
            if (zoomKnob)
            {
                zoomKnob.SetOnValueChanged(OnZoomChanged);
                zoomKnob.SetLabel("Zoom");
            }

            if (gainKnob)
            {
                gainKnob.SetOnValueChanged(OnGainChanged);
                gainKnob.SetLabel("Gain");
            }

            if (panKnob)
            {
                panKnob.SetOnValueChanged(OnPanChanged);
                panKnob.SetLabel("Pan");
            }

            // Load audio data
            LoadAudioData();
        }

        private void LoadAudioData()
        {
            // TODO: Load audio data from file or generate test data
            audioData = new float[44100 * 10]; // 10 seconds of audio
            for (int i = 0; i < audioData.Length; i++)
            {
                audioData[i] = Mathf.Sin(2f * Mathf.PI * 440f * i / sampleRate);
            }

            processedData = new float[audioData.Length];
            System.Array.Copy(audioData, processedData, audioData.Length);

            if (waveformDisplay)
            {
                waveformDisplay.SetAudioData(processedData, sampleRate);
            }
        }

        private void OnTimeChanged(float time)
        {
            playheadPosition = time;
        }

        private void OnSelectionChanged(float start, float end)
        {
            selectionStart = start;
            selectionEnd = end;
        }

        private void OnZoomChanged(float zoom)
        {
            if (waveformDisplay)
            {
                waveformDisplay.SetZoom(zoom);
            }
        }

        private void OnGainChanged(float gain)
        {
            currentGain = gain;
            ApplyGain();
        }

        private void OnPanChanged(float pan)
        {
            currentPan = pan;
            ApplyPan();
        }

        private void ApplyGain()
        {
            float gainFactor = Mathf.Pow(10f, currentGain / 20f);
            int startSample = Mathf.RoundToInt(selectionStart * sampleRate);
            int endSample = Mathf.RoundToInt(selectionEnd * sampleRate);

            for (int i = startSample; i < endSample; i++)
            {
                if (i >= 0 && i < processedData.Length)
                {
                    processedData[i] = audioData[i] * gainFactor;
                }
            }

            if (waveformDisplay)
            {
                waveformDisplay.SetAudioData(processedData, sampleRate);
            }

            AddToHistory("Gain", new Dictionary<string, float> { { "gain", currentGain } });
        }

        private void ApplyPan()
        {
            int startSample = Mathf.RoundToInt(selectionStart * sampleRate);
            int endSample = Mathf.RoundToInt(selectionEnd * sampleRate);

            for (int i = startSample; i < endSample; i++)
            {
                if (i >= 0 && i < processedData.Length)
                {
                    processedData[i] = audioData[i] * (1f + currentPan);
                }
            }

            if (waveformDisplay)
            {
                waveformDisplay.SetAudioData(processedData, sampleRate);
            }

            AddToHistory("Pan", new Dictionary<string, float> { { "pan", currentPan } });
        }

        private void AddToHistory(string operationType, Dictionary<string, float> parameters)
        {
            // Remove any future edits if we're not at the end of the history
            if (currentEditIndex < editHistory.Count - 1)
            {
                editHistory.RemoveRange(currentEditIndex + 1, editHistory.Count - currentEditIndex - 1);
            }

            // Create new edit operation
            EditOperation edit = new EditOperation
            {
                data = new float[processedData.Length],
                startTime = selectionStart,
                endTime = selectionEnd,
                operationType = operationType,
                parameters = parameters
            };
            System.Array.Copy(processedData, edit.data, processedData.Length);

            editHistory.Add(edit);
            currentEditIndex = editHistory.Count - 1;
        }

        public void Undo()
        {
            if (currentEditIndex > 0)
            {
                currentEditIndex--;
                RestoreEdit(editHistory[currentEditIndex]);
            }
        }

        public void Redo()
        {
            if (currentEditIndex < editHistory.Count - 1)
            {
                currentEditIndex++;
                RestoreEdit(editHistory[currentEditIndex]);
            }
        }

        private void RestoreEdit(EditOperation edit)
        {
            System.Array.Copy(edit.data, processedData, processedData.Length);
            if (waveformDisplay)
            {
                waveformDisplay.SetAudioData(processedData, sampleRate);
            }
        }

        public void Play()
        {
            if (waveformDisplay)
            {
                waveformDisplay.SetPlaying(true);
            }
        }

        public void Pause()
        {
            if (waveformDisplay)
            {
                waveformDisplay.SetPlaying(false);
            }
        }

        public void Stop()
        {
            playheadPosition = 0f;
            if (waveformDisplay)
            {
                waveformDisplay.SetPlaying(false);
                waveformDisplay.SetTime(0f);
            }
        }

        public override void ProcessInput()
        {
            /* TODO: Implement input handling */
        }

        public override void CalculateScore()
        {
            /* TODO: Implement score calculation */
        }

        public override void SaveProgress()
        {
            /* TODO: Implement save logic */
        }
    }
} 