using UnityEngine;
using UnityEngine.UIElements;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic;
using System.Linq;

namespace RecordingStudioTycoon.UI.Project
{
    public class ProjectListUI : MonoBehaviour
    {
        public VisualTreeAsset projectCardUXML; // Assign the ProjectCardUI UXML here
        private VisualElement root;
        private VisualElement projectListContainer;

        private List<ProjectCardUI> activeProjectCards = new List<ProjectCardUI>();

        private void OnEnable()
        {
            GameManager.OnGameStateChanged += UpdateProjectListUI;
        }

        private void OnDisable()
        {
            GameManager.OnGameStateChanged -= UpdateProjectListUI;
        }

        public void Setup(VisualElement uiRoot)
        {
            root = uiRoot;
            projectListContainer = root.Q<VisualElement>("project-list-container"); // Assuming a container element in your main UI UXML

            if (projectListContainer == null)
            {
                Debug.LogError("Project list container not found in UI. Make sure an element with name 'project-list-container' exists.");
                return;
            }

            UpdateProjectListUI();
        }

        private void UpdateProjectListUI()
        {
            if (GameManager.Instance == null || projectListContainer == null) return;

            // Clear existing cards
            foreach (var card in activeProjectCards)
            {
                Destroy(card.gameObject); // Destroy the GameObject holding the MonoBehaviour
            }
            activeProjectCards.Clear();
            projectListContainer.Clear(); // Clear UI Toolkit elements

            // Add cards for active projects
            foreach (var project in GameManager.Instance.CurrentGameState.availableProjects.Where(p => p.IsActive))
            {
                GameObject projectCardGO = new GameObject($"ProjectCard_{project.Id}");
                projectCardGO.transform.SetParent(this.transform); // Parent to this MonoBehaviour's GameObject
                ProjectCardUI projectCard = projectCardGO.AddComponent<ProjectCardUI>();
                projectCard.projectCardUXML = projectCardUXML; // Pass the UXML asset
                projectCard.SetupCard(projectListContainer, project);
                activeProjectCards.Add(projectCard);
            }
            Debug.Log($"Updated project list UI. Displaying {activeProjectCards.Count} active projects.");
        }
    }
}