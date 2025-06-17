using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class MIDIProgrammingGame : BaseMinigame
    {
        [System.Serializable]
        public class MIDINote
        {
            public int note;
            public float velocity;
            public float startTime;
            public float duration;
            public bool isAccent;
        }

        [System.Serializable]
        public class MIDIPattern
        {
            public List<MIDINote> notes;
            public float tempo;
            public int timeSignature;
            public string scale;
        }

        [SerializeField] private int patternLength = 16;
        [SerializeField] private float timingTolerance = 0.1f;
        [SerializeField] private float velocityTolerance = 0.1f;
        [SerializeField] private float durationTolerance = 0.1f;
        [SerializeField] private float tempoTolerance = 0.1f;

        private MIDIPattern currentPattern;
        private MIDIPattern targetPattern;
        private int currentStep;
        private string selectedScale;
        private float currentTempo;
        private int currentTimeSignature;

        private readonly string[] availableScales = { "C Major", "G Major", "D Minor", "A Minor", "F Major" };
        private readonly int[] availableTimeSignatures = { 4, 3, 6, 8 };

        private void Awake()
        {
            currentType = "midiProgramming";
            currentPattern = new MIDIPattern();
            targetPattern = new MIDIPattern();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetPattern();
            ResetPattern();
        }

        private void GenerateTargetPattern()
        {
            targetPattern = new MIDIPattern
            {
                notes = GenerateMIDINotes(8),
                tempo = Random.Range(80f, 160f),
                timeSignature = availableTimeSignatures[Random.Range(0, availableTimeSignatures.Length)],
                scale = availableScales[Random.Range(0, availableScales.Length)]
            };
        }

        private List<MIDINote> GenerateMIDINotes(int count)
        {
            var notes = new List<MIDINote>();
            for (int i = 0; i < count; i++)
            {
                notes.Add(new MIDINote
                {
                    note = Random.Range(60, 84), // Middle C to C two octaves up
                    velocity = Random.Range(0.5f, 1f),
                    startTime = Random.Range(0f, patternLength),
                    duration = Random.Range(0.25f, 2f),
                    isAccent = Random.value > 0.7f
                });
            }
            return notes;
        }

        private void ResetPattern()
        {
            currentPattern = new MIDIPattern
            {
                notes = new List<MIDINote>(),
                tempo = 120f,
                timeSignature = 4,
                scale = "C Major"
            };
            currentStep = 0;
            selectedScale = "C Major";
            currentTempo = 120f;
            currentTimeSignature = 4;
        }

        public override void ProcessInput()
        {
            // Scale selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedScale = "C Major";
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedScale = "G Major";
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedScale = "D Minor";
            if (Input.GetKeyDown(KeyCode.Alpha4)) selectedScale = "A Minor";
            if (Input.GetKeyDown(KeyCode.Alpha5)) selectedScale = "F Major";

            // Time signature selection
            if (Input.GetKeyDown(KeyCode.T))
            {
                int index = System.Array.IndexOf(availableTimeSignatures, currentTimeSignature);
                currentTimeSignature = availableTimeSignatures[(index + 1) % availableTimeSignatures.Length];
            }

            // Tempo adjustment
            if (Input.GetKey(KeyCode.UpArrow))
            {
                currentTempo = Mathf.Clamp(currentTempo + Time.deltaTime * 10f, 40f, 200f);
            }
            if (Input.GetKey(KeyCode.DownArrow))
            {
                currentTempo = Mathf.Clamp(currentTempo - Time.deltaTime * 10f, 40f, 200f);
            }

            // Note placement and modification
            if (Input.GetKeyDown(KeyCode.Space))
            {
                PlaceMIDINote();
            }

            // Note modification
            if (Input.GetKey(KeyCode.LeftArrow))
            {
                ModifyCurrentNote(-0.1f);
            }
            if (Input.GetKey(KeyCode.RightArrow))
            {
                ModifyCurrentNote(0.1f);
            }

            // Step navigation
            if (Input.GetKeyDown(KeyCode.PageUp))
            {
                currentStep = (currentStep + 1) % patternLength;
            }
            if (Input.GetKeyDown(KeyCode.PageDown))
            {
                currentStep = (currentStep - 1 + patternLength) % patternLength;
            }

            UpdateProgress();
        }

        private void PlaceMIDINote()
        {
            var note = new MIDINote
            {
                note = 60 + currentStep, // Start from middle C
                velocity = 0.8f,
                startTime = currentStep,
                duration = 0.5f,
                isAccent = false
            };

            currentPattern.notes.Add(note);
        }

        private void ModifyCurrentNote(float amount)
        {
            if (currentPattern.notes.Count > 0)
            {
                var note = currentPattern.notes[currentPattern.notes.Count - 1];
                note.velocity = Mathf.Clamp01(note.velocity + amount);
                note.duration = Mathf.Clamp(note.duration + amount, 0.25f, 4f);
                note.note = Mathf.Clamp(note.note + Mathf.RoundToInt(amount * 10f), 0, 127);
            }
        }

        private void UpdateProgress()
        {
            float patternProgress = 0f;

            // Compare notes
            if (currentPattern.notes.Count > 0 && targetPattern.notes.Count > 0)
            {
                float noteProgress = 0f;
                for (int i = 0; i < Mathf.Min(currentPattern.notes.Count, targetPattern.notes.Count); i++)
                {
                    var currentNote = currentPattern.notes[i];
                    var targetNote = targetPattern.notes[i];

                    noteProgress += Mathf.Abs(currentNote.velocity - targetNote.velocity) < velocityTolerance ? 1f : 0f;
                    noteProgress += Mathf.Abs(currentNote.startTime - targetNote.startTime) < timingTolerance ? 1f : 0f;
                    noteProgress += Mathf.Abs(currentNote.duration - targetNote.duration) < durationTolerance ? 1f : 0f;
                    noteProgress += currentNote.isAccent == targetNote.isAccent ? 1f : 0f;
                }
                patternProgress += noteProgress / (Mathf.Min(currentPattern.notes.Count, targetPattern.notes.Count) * 4f);
            }

            // Compare tempo and time signature
            patternProgress += Mathf.Abs(currentTempo - targetPattern.tempo) < tempoTolerance ? 1f : 0f;
            patternProgress += currentTimeSignature == targetPattern.timeSignature ? 1f : 0f;
            patternProgress += selectedScale == targetPattern.scale ? 1f : 0f;

            progress = patternProgress / 4f;
        }

        public override void CalculateScore()
        {
            score = Mathf.RoundToInt(progress * 1000 * scoreMultiplier);
            if (timeRemaining > 0)
            {
                score += Mathf.RoundToInt(timeRemaining * timeBonus);
            }
        }

        public override void SaveProgress()
        {
            // Save progress to game state or other persistence system
            Debug.Log($"MIDI Programming Game completed with score: {score}");
        }
    }
} 