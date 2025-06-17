using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using RecordingStudioTycoon.Integrations.Pollinations;

namespace RecordingStudioTycoon.Systems
{
    public class TextGenerationManager : MonoBehaviour
    {
        public static TextGenerationManager Instance { get; private set; }
        private Dictionary<string, string> _cache = new Dictionary<string, string>();

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

        private string GetCacheKey(string prompt) => prompt.GetHashCode().ToString();

        public async Task<string> GetReview(string albumName, string bandName, string genre)
        {
            string prompt = $"Write a short, enthusiastic music review for the album '{albumName}' by {bandName}, in the {genre} genre.";
            return await GetOrGenerateText(prompt);
        }

        public async Task<string> GetNews(string bandName, string albumName)
        {
            string prompt = $"Write a news headline and short article about {bandName} releasing a new album called '{albumName}'.";
            return await GetOrGenerateText(prompt);
        }

        public async Task<string> GetBio(string memberName, string role, string genre)
        {
            string prompt = $"Write a creative biography for a {role} named {memberName} in a {genre} band.";
            return await GetOrGenerateText(prompt);
        }

        public async Task<string> GetDescription(string itemType, string itemName)
        {
            string prompt = $"Describe the {itemType} '{itemName}' used in a professional recording studio.";
            return await GetOrGenerateText(prompt);
        }

        private async Task<string> GetOrGenerateText(string prompt)
        {
            string key = GetCacheKey(prompt);
            if (_cache.TryGetValue(key, out var cachedText))
            {
                return cachedText;
            }

            string result = null;
            try
            {
                result = await PolAiService.Instance.GenerateTextAsync(prompt);
                if (!string.IsNullOrEmpty(result))
                {
                    _cache[key] = result;
                }
                else
                {
                    Debug.LogWarning($"TextGenerationManager: Empty result for prompt: {prompt}");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"TextGenerationManager: Error generating text for prompt '{prompt}': {ex.Message}");
            }
            return result;
        }
    }
} 