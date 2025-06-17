using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.GameLogic; // Assuming GameManager is in this namespace
using RecordingStudioTycoon.Systems;
using System.Collections.Generic;

namespace RecordingStudioTycoon.UI
{
    public class MainMenuPanel : MonoBehaviour
    {
        [SerializeField] private UIDocument uiDocument;
        private VisualElement root;
        private VisualElement newsFeedContainer;
        private Button generateNewsButton;
        private List<Label> newsItems = new List<Label>();
        private const int MaxNewsItems = 5;
        private bool isLoadingNews = false;

        public delegate void GameAction();
        public event GameAction OnStartNewGameClicked;
        public event GameAction OnLoadGameClicked;

        void OnEnable()
        {
            root = uiDocument.rootVisualElement;
            
            // Register button callbacks
            root.Q<Button>("StartNewGameButton")?.RegisterCallback<ClickEvent>(evt => OnStartNewGameClicked?.Invoke());
            root.Q<Button>("LoadGameButton")?.RegisterCallback<ClickEvent>(evt => OnLoadGameClicked?.Invoke());
            // Add other main menu button registrations here

            newsFeedContainer = root.Q<VisualElement>("news-feed-container");
            if (newsFeedContainer == null)
            {
                newsFeedContainer = new VisualElement { name = "news-feed-container" };
                root.Add(newsFeedContainer);
            }
            generateNewsButton = root.Q<Button>("generate-news-button");
            if (generateNewsButton == null)
            {
                generateNewsButton = new Button { text = "Generate News", name = "generate-news-button" };
                root.Add(generateNewsButton);
            }
            generateNewsButton.clicked += async () => await GenerateAndDisplayNews();
        }

        void OnDisable()
        {
            // Unregister button callbacks to prevent memory leaks
            root.Q<Button>("StartNewGameButton")?.UnregisterCallback<ClickEvent>(evt => OnStartNewGameClicked?.Invoke());
            root.Q<Button>("LoadGameButton")?.UnregisterCallback<ClickEvent>(evt => OnLoadGameClicked?.Invoke());
        }

        private async System.Threading.Tasks.Task GenerateAndDisplayNews()
        {
            if (isLoadingNews) return;
            isLoadingNews = true;
            try
            {
                // Example: Use the first active band and album for the news prompt
                string bandName = "Your Band";
                string albumName = "Your Album";
                if (GameManager.Instance != null && GameManager.Instance.CurrentGameState != null)
                {
                    var band = GameManager.Instance.CurrentGameState.playerBand;
                    if (band != null) bandName = band.Name;
                    var album = GameManager.Instance.CurrentGameState.availableProjects?.Find(p => p.IsActive);
                    if (album != null) albumName = album.Name;
                }
                var loadingLabel = new Label("Loading news...") { style = { color = new UnityEngine.Color(0.5f,0.5f,0.5f), unityFontStyleAndWeight = FontStyle.Italic } };
                newsFeedContainer.Insert(0, loadingLabel);
                string news = await TextGenerationManager.Instance.GetNews(bandName, albumName);
                newsFeedContainer.Remove(loadingLabel);
                if (!string.IsNullOrEmpty(news))
                {
                    var newsLabel = new Label(news)
                    {
                        style = {
                            unityFontStyleAndWeight = FontStyle.Bold,
                            fontSize = 14,
                            marginBottom = 8,
                            color = new UnityEngine.Color(0.2f,0.2f,0.8f)
                        }
                    };
                    newsItems.Insert(0, newsLabel);
                    if (newsItems.Count > MaxNewsItems)
                    {
                        var last = newsItems[newsItems.Count - 1];
                        newsFeedContainer.Remove(last);
                        newsItems.RemoveAt(newsItems.Count - 1);
                    }
                    newsFeedContainer.Insert(0, newsLabel);
                }
                else
                {
                    var emptyLabel = new Label("No news available.") { style = { color = new UnityEngine.Color(0.5f,0,0) } };
                    newsFeedContainer.Insert(0, emptyLabel);
                }
            }
            catch (System.Exception ex)
            {
                var errorLabel = new Label("Error loading news.") { style = { color = new UnityEngine.Color(1,0,0) } };
                newsFeedContainer.Insert(0, errorLabel);
                UnityEngine.Debug.LogError($"Error fetching news: {ex.Message}");
            }
            finally
            {
                isLoadingNews = false;
            }
        }
    }
}