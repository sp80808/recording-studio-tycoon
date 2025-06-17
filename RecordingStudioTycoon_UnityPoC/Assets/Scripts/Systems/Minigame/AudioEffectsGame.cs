using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class AudioEffectsGame : BaseMinigame
    {
        [System.Serializable]
        public class Effect
        {
            public string type;
            public float mix;
            public float[] parameters;
            public bool isEnabled;
        }

        [System.Serializable]
        public class EffectChain
        {
            public List<Effect> effects;
            public float inputGain;
            public float outputGain;
            public bool isBypassed;
        }

        [SerializeField] private int maxEffects = 5;
        [SerializeField] private float mixTolerance = 0.1f;
        [SerializeField] private float parameterTolerance = 0.1f;
        [SerializeField] private float gainTolerance = 0.1f;

        private EffectChain currentChain;
        private EffectChain targetChain;
        private int currentEffect;
        private string selectedEffectType;

        private readonly string[] availableEffects = {
            "reverb",
            "delay",
            "chorus",
            "flanger",
            "phaser",
            "distortion",
            "compressor",
            "eq",
            "filter"
        };

        private void Awake()
        {
            currentType = "audioEffects";
            currentChain = new EffectChain();
            targetChain = new EffectChain();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetChain();
            ResetChain();
        }

        private void GenerateTargetChain()
        {
            targetChain = new EffectChain
            {
                effects = GenerateEffects(3),
                inputGain = Random.Range(0.5f, 1.5f),
                outputGain = Random.Range(0.5f, 1.5f),
                isBypassed = false
            };
        }

        private List<Effect> GenerateEffects(int count)
        {
            var effects = new List<Effect>();
            for (int i = 0; i < count; i++)
            {
                string type = availableEffects[Random.Range(0, availableEffects.Length)];
                effects.Add(new Effect
                {
                    type = type,
                    mix = Random.Range(0f, 1f),
                    parameters = GenerateEffectParameters(type),
                    isEnabled = true
                });
            }
            return effects;
        }

        private float[] GenerateEffectParameters(string effectType)
        {
            switch (effectType)
            {
                case "reverb":
                    return new float[] {
                        Random.Range(0f, 1f), // room size
                        Random.Range(0f, 1f), // damping
                        Random.Range(0f, 1f)  // diffusion
                    };
                case "delay":
                    return new float[] {
                        Random.Range(0f, 1f), // time
                        Random.Range(0f, 1f), // feedback
                        Random.Range(0f, 1f)  // modulation
                    };
                case "chorus":
                    return new float[] {
                        Random.Range(0f, 1f), // rate
                        Random.Range(0f, 1f), // depth
                        Random.Range(0f, 1f)  // mix
                    };
                case "flanger":
                    return new float[] {
                        Random.Range(0f, 1f), // rate
                        Random.Range(0f, 1f), // depth
                        Random.Range(0f, 1f)  // feedback
                    };
                case "phaser":
                    return new float[] {
                        Random.Range(0f, 1f), // rate
                        Random.Range(0f, 1f), // depth
                        Random.Range(0f, 1f)  // feedback
                    };
                case "distortion":
                    return new float[] {
                        Random.Range(0f, 1f), // drive
                        Random.Range(0f, 1f), // tone
                        Random.Range(0f, 1f)  // mix
                    };
                case "compressor":
                    return new float[] {
                        Random.Range(0f, 1f), // threshold
                        Random.Range(0f, 1f), // ratio
                        Random.Range(0f, 1f)  // attack
                    };
                case "eq":
                    return new float[] {
                        Random.Range(-12f, 12f), // low
                        Random.Range(-12f, 12f), // mid
                        Random.Range(-12f, 12f)  // high
                    };
                case "filter":
                    return new float[] {
                        Random.Range(0f, 1f), // cutoff
                        Random.Range(0f, 1f), // resonance
                        Random.Range(0f, 1f)  // drive
                    };
                default:
                    return new float[] { 0f, 0f, 0f };
            }
        }

        private void ResetChain()
        {
            currentChain = new EffectChain
            {
                effects = new List<Effect>(),
                inputGain = 1f,
                outputGain = 1f,
                isBypassed = false
            };
            currentEffect = 0;
            selectedEffectType = "reverb";
        }

        public override void ProcessInput()
        {
            // Effect type selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedEffectType = "reverb";
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedEffectType = "delay";
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedEffectType = "chorus";
            if (Input.GetKeyDown(KeyCode.Alpha4)) selectedEffectType = "flanger";
            if (Input.GetKeyDown(KeyCode.Alpha5)) selectedEffectType = "phaser";
            if (Input.GetKeyDown(KeyCode.Alpha6)) selectedEffectType = "distortion";
            if (Input.GetKeyDown(KeyCode.Alpha7)) selectedEffectType = "compressor";
            if (Input.GetKeyDown(KeyCode.Alpha8)) selectedEffectType = "eq";
            if (Input.GetKeyDown(KeyCode.Alpha9)) selectedEffectType = "filter";

            // Effect chain navigation
            if (Input.GetKeyDown(KeyCode.Tab))
            {
                currentEffect = (currentEffect + 1) % (currentChain.effects.Count + 1);
            }

            // Add/remove effects
            if (Input.GetKeyDown(KeyCode.Return))
            {
                if (currentChain.effects.Count < maxEffects)
                {
                    AddEffect();
                }
            }
            if (Input.GetKeyDown(KeyCode.Backspace))
            {
                if (currentEffect < currentChain.effects.Count)
                {
                    currentChain.effects.RemoveAt(currentEffect);
                }
            }

            // Effect modification
            if (currentEffect < currentChain.effects.Count)
            {
                var effect = currentChain.effects[currentEffect];

                // Mix control
                if (Input.GetKey(KeyCode.Q))
                {
                    effect.mix = Mathf.Clamp01(effect.mix - Time.deltaTime);
                }
                if (Input.GetKey(KeyCode.W))
                {
                    effect.mix = Mathf.Clamp01(effect.mix + Time.deltaTime);
                }

                // Parameter controls
                if (effect.parameters != null)
                {
                    if (Input.GetKey(KeyCode.A)) effect.parameters[0] = Mathf.Clamp(effect.parameters[0] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.S)) effect.parameters[0] = Mathf.Clamp(effect.parameters[0] + Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.D)) effect.parameters[1] = Mathf.Clamp(effect.parameters[1] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.F)) effect.parameters[1] = Mathf.Clamp(effect.parameters[1] + Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.G)) effect.parameters[2] = Mathf.Clamp(effect.parameters[2] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.H)) effect.parameters[2] = Mathf.Clamp(effect.parameters[2] + Time.deltaTime * 10f, -12f, 12f);
                }

                // Enable/disable
                if (Input.GetKeyDown(KeyCode.Space))
                {
                    effect.isEnabled = !effect.isEnabled;
                }
            }

            // Chain controls
            if (Input.GetKey(KeyCode.Z))
            {
                currentChain.inputGain = Mathf.Clamp(currentChain.inputGain - Time.deltaTime, 0f, 2f);
            }
            if (Input.GetKey(KeyCode.X))
            {
                currentChain.inputGain = Mathf.Clamp(currentChain.inputGain + Time.deltaTime, 0f, 2f);
            }
            if (Input.GetKey(KeyCode.C))
            {
                currentChain.outputGain = Mathf.Clamp(currentChain.outputGain - Time.deltaTime, 0f, 2f);
            }
            if (Input.GetKey(KeyCode.V))
            {
                currentChain.outputGain = Mathf.Clamp(currentChain.outputGain + Time.deltaTime, 0f, 2f);
            }
            if (Input.GetKeyDown(KeyCode.B))
            {
                currentChain.isBypassed = !currentChain.isBypassed;
            }

            UpdateProgress();
        }

        private void AddEffect()
        {
            var effect = new Effect
            {
                type = selectedEffectType,
                mix = 0.5f,
                parameters = GenerateEffectParameters(selectedEffectType),
                isEnabled = true
            };
            currentChain.effects.Add(effect);
        }

        private void UpdateProgress()
        {
            float chainProgress = 0f;
            chainProgress += Mathf.Abs(currentChain.inputGain - targetChain.inputGain) < gainTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.outputGain - targetChain.outputGain) < gainTolerance ? 1f : 0f;
            chainProgress += currentChain.isBypassed == targetChain.isBypassed ? 1f : 0f;

            float effectProgress = 0f;
            if (currentChain.effects.Count > 0 && targetChain.effects.Count > 0)
            {
                for (int i = 0; i < Mathf.Min(currentChain.effects.Count, targetChain.effects.Count); i++)
                {
                    var currentEffect = currentChain.effects[i];
                    var targetEffect = targetChain.effects[i];

                    effectProgress += currentEffect.type == targetEffect.type ? 1f : 0f;
                    effectProgress += Mathf.Abs(currentEffect.mix - targetEffect.mix) < mixTolerance ? 1f : 0f;
                    effectProgress += currentEffect.isEnabled == targetEffect.isEnabled ? 1f : 0f;

                    if (currentEffect.parameters != null && targetEffect.parameters != null)
                    {
                        for (int j = 0; j < Mathf.Min(currentEffect.parameters.Length, targetEffect.parameters.Length); j++)
                        {
                            effectProgress += Mathf.Abs(currentEffect.parameters[j] - targetEffect.parameters[j]) < parameterTolerance ? 1f : 0f;
                        }
                    }
                }
                effectProgress /= Mathf.Min(currentChain.effects.Count, targetChain.effects.Count) * 6f;
            }

            progress = (chainProgress / 3f + effectProgress) / 2f;
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
            Debug.Log($"Audio Effects Game completed with score: {score}");
        }
    }
} 