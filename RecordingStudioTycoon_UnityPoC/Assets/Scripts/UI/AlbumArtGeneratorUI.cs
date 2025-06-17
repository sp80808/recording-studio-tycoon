using UnityEngine;
using UnityEngine.UIElements;
using System.Threading.Tasks;
using RecordingStudioTycoon.Integrations.Pollinations;
using System;

namespace RecordingStudioTycoon.UI
{
    public class AlbumArtGeneratorUI : MonoBehaviour
    {
        [Header("UI Toolkit References")]
        [SerializeField] private UIDocument uiDocument;
        [SerializeField] private VisualTreeAsset genreDropdownAsset;
        [SerializeField] private VisualTreeAsset styleDropdownAsset;
        [SerializeField] private VisualTreeAsset loadingSpinnerAsset;

        private VisualElement root;
        private TextField songTitleField;
        private Button generateButton;
        private Button rerollButton;
        private Button acceptButton;
        private Image albumArtImage;
        private Label errorLabel;
        private VisualElement loadingSpinner;
        private DropdownField genreDropdown;
        private DropdownField styleDropdown;

        private string lastPrompt;
        private Texture2D lastTexture;

        public event Action<Texture2D> OnAlbumArtAccepted;

        private void OnEnable()
        {
            root = uiDocument.rootVisualElement;
            songTitleField = root.Q<TextField>("song-title-field");
            generateButton = root.Q<Button>("generate-button");
            rerollButton = root.Q<Button>("reroll-button");
            acceptButton = root.Q<Button>("accept-button");
            albumArtImage = root.Q<Image>("album-art-image");
            errorLabel = root.Q<Label>("error-label");
            loadingSpinner = root.Q<VisualElement>("loading-spinner");
            genreDropdown = root.Q<DropdownField>("genre-dropdown");
            styleDropdown = root.Q<DropdownField>("style-dropdown");

            generateButton.clicked += OnGenerateClicked;
            rerollButton.clicked += OnRerollClicked;
            acceptButton.clicked += OnAcceptClicked;

            errorLabel.style.display = DisplayStyle.None;
            loadingSpinner.style.display = DisplayStyle.None;
            rerollButton.SetEnabled(false);
            acceptButton.SetEnabled(false);

            // Populate dropdowns (example genres/styles)
            genreDropdown.choices = new System.Collections.Generic.List<string> { "Pop", "Rock", "Jazz", "Hip-Hop", "Electronic", "Classical" };
            genreDropdown.value = "Pop";
            styleDropdown.choices = new System.Collections.Generic.List<string> { "Photorealistic", "Synthwave", "Abstract", "Minimalist", "Graffiti", "Vintage" };
            styleDropdown.value = "Photorealistic";
        }

        private void OnGenerateClicked()
        {
            string songTitle = songTitleField.value;
            string genre = genreDropdown.value;
            string style = styleDropdown.value;
            string prompt = $"Album cover for '{songTitle}', {genre}, style: {style}";
            lastPrompt = prompt;
            _ = GenerateAlbumArtAsync(prompt);
        }

        private void OnRerollClicked()
        {
            if (!string.IsNullOrEmpty(lastPrompt))
            {
                _ = GenerateAlbumArtAsync(lastPrompt, reroll: true);
            }
        }

        private void OnAcceptClicked()
        {
            if (lastTexture != null)
            {
                OnAlbumArtAccepted?.Invoke(lastTexture);
                Debug.Log("Album art accepted and event invoked.");
            }
            else
            {
                Debug.LogWarning("No album art to accept.");
            }
        }

        private async Task GenerateAlbumArtAsync(string prompt, bool reroll = false)
        {
            errorLabel.style.display = DisplayStyle.None;
            loadingSpinner.style.display = DisplayStyle.Flex;
            rerollButton.SetEnabled(false);
            acceptButton.SetEnabled(false);
            albumArtImage.image = null;

            Texture2D tex = await PolAiService.Instance.GenerateAlbumArt(prompt);
            loadingSpinner.style.display = DisplayStyle.None;

            if (tex != null)
            {
                albumArtImage.image = tex;
                lastTexture = tex;
                rerollButton.SetEnabled(true);
                acceptButton.SetEnabled(true);
            }
            else
            {
                errorLabel.text = "Failed to generate album art. Please try again.";
                errorLabel.style.display = DisplayStyle.Flex;
            }
        }

        public Texture2D GetSelectedAlbumArt() => lastTexture;
    }
} 