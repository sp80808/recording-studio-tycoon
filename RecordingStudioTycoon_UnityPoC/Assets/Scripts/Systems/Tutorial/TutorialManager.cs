using UnityEngine;
using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.Systems.Tutorial
{
    [Serializable]
    public class TutorialStep
    {
        public string title;
        public string content;
        public string targetElement; // UI element name or tag
        public bool highlight;
        public bool waitForAction;
    }

    public class TutorialManager : MonoBehaviour
    {
        public static TutorialManager Instance { get; private set; }

        public event Action<TutorialStep, int, int> OnStepChanged; // step, index, total
        public event Action OnTutorialComplete;

        [SerializeField] private List<TutorialStep> steps = new List<TutorialStep>();
        private int currentStepIndex = 0;
        private bool tutorialActive = false;
        private HashSet<string> completedTutorials = new HashSet<string>();
        private string currentTutorialKey;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void StartTutorial(List<TutorialStep> tutorialSteps, string tutorialKey)
        {
            steps = tutorialSteps;
            currentStepIndex = 0;
            tutorialActive = true;
            currentTutorialKey = tutorialKey;
            ShowStep(currentStepIndex);
        }

        public void NextStep()
        {
            if (!tutorialActive) return;
            if (currentStepIndex < steps.Count - 1)
            {
                currentStepIndex++;
                ShowStep(currentStepIndex);
            }
            else
            {
                CompleteTutorial();
            }
        }

        public void PrevStep()
        {
            if (!tutorialActive) return;
            if (currentStepIndex > 0)
            {
                currentStepIndex--;
                ShowStep(currentStepIndex);
            }
        }

        public void ShowStep(int index)
        {
            if (index >= 0 && index < steps.Count)
            {
                OnStepChanged?.Invoke(steps[index], index, steps.Count);
            }
        }

        public void CompleteTutorial()
        {
            tutorialActive = false;
            if (!string.IsNullOrEmpty(currentTutorialKey))
            {
                completedTutorials.Add(currentTutorialKey);
            }
            OnTutorialComplete?.Invoke();
        }

        public bool IsTutorialCompleted(string tutorialKey)
        {
            return completedTutorials.Contains(tutorialKey);
        }

        public bool IsTutorialActive() => tutorialActive;
        public int GetCurrentStepIndex() => currentStepIndex;
        public int GetTotalSteps() => steps.Count;
        public TutorialStep GetCurrentStep() => (currentStepIndex >= 0 && currentStepIndex < steps.Count) ? steps[currentStepIndex] : null;
    }
} 