using System.Threading;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace RecordingStudioTycoon.Integrations.Pollinations
{
    public class PolAiService : MonoBehaviour
    {
        public static PolAiService Instance { get; private set; }
        private const string IMAGE_API_BASE = "https://image.pollinations.ai/prompt/";
        private const string DEFAULT_REFERRER = "RecordingStudioTycoon_Unity";

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

        public async Task<Texture2D> GenerateAlbumArt(string prompt, int width = 512, int height = 512, bool nologo = true, bool isPrivate = true, bool enhance = true, bool safe = true)
        {
            var queryParams = new List<string>
            {
                $"width={width}",
                $"height={height}",
                $"nologo={nologo.ToString().ToLower()}",
                $"private={isPrivate.ToString().ToLower()}",
                $"enhance={enhance.ToString().ToLower()}",
                $"safe={safe.ToString().ToLower()}",
                $"referrer={DEFAULT_REFERRER}"
            };
            string encodedPrompt = UnityWebRequest.EscapeURL(prompt);
            string url = $"{IMAGE_API_BASE}{encodedPrompt}?{string.Join("&", queryParams)}";

            using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(url))
            {
                var asyncOp = request.SendWebRequest();
                while (!asyncOp.isDone)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        Debug.LogWarning("PolAiService: Request canceled.");
                        request.Abort();
                        return null;
                    }
                    await Task.Yield();
                }

#if UNITY_2020_1_OR_NEWER
                if (request.result != UnityWebRequest.Result.Success)
#else
                if (request.isNetworkError || request.isHttpError)
#endif
                {
                    Debug.LogError($"PolAiService: Error fetching album art: {request.error}\nURL: {url}");
                    return null;
                }
                else
                {
                    try
                    {
                        Texture2D tex = DownloadHandlerTexture.GetContent(request);
                        return tex;
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"PolAiService: Error processing image: {ex.Message}");
                        return null;
                    }
                }
            }
        }

        public async Task<string> GenerateTextAsync(string prompt, CancellationToken cancellationToken = default)
        {
            string url = "https://api.pollinations.ai/text";
            var requestBody = new TextRequest { prompt = prompt };
            string jsonBody = JsonUtility.ToJson(requestBody);

            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonBody);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("referrer", DEFAULT_REFERRER);

                var asyncOp = request.SendWebRequest();
                while (!asyncOp.isDone)
                    await Task.Yield();

#if UNITY_2020_1_OR_NEWER
                if (request.result != UnityWebRequest.Result.Success)
#else
                if (request.isNetworkError || request.isHttpError)
#endif
                {
                    Debug.LogError($"PolAiService: Error fetching text: {request.error}\nURL: {url}");
                    return null;
                }
                else
                {
                    try
                    {
                        string responseText = request.downloadHandler.text;
                        // The response may be a JSON object with a 'text' field
                        var response = JsonUtility.FromJson<TextResponse>(responseText);
                        return response != null && !string.IsNullOrEmpty(response.text) ? response.text : responseText;
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"PolAiService: Error processing text response: {ex.Message}");
                        return null;
                    }
                }
            }
        }

        [Serializable]
        private class TextRequest
        {
            public string prompt;
        }

        [Serializable]
        private class TextResponse
        {
            public string text;
        }

        // Future: Add methods for text and audio generation
    }
} 