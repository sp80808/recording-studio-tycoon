using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.Audio
{
    public class AudioProcessor
    {
        private float sampleRate;
        private float[] buffer;
        private int bufferSize;
        private int currentPosition;
        private bool isProcessing;

        public AudioProcessor(float sampleRate = 44100f, int bufferSize = 1024)
        {
            this.sampleRate = sampleRate;
            this.bufferSize = bufferSize;
            this.buffer = new float[bufferSize];
            this.currentPosition = 0;
            this.isProcessing = false;
        }

        public void ProcessAudio(float[] input, float[] output, Dictionary<string, float> parameters)
        {
            if (input == null || output == null || input.Length != output.Length)
            {
                Debug.LogError("Invalid input/output arrays");
                return;
            }

            // Apply gain
            if (parameters.ContainsKey("gain"))
            {
                float gain = Mathf.Pow(10f, parameters["gain"] / 20f);
                for (int i = 0; i < input.Length; i++)
                {
                    output[i] = input[i] * gain;
                }
            }

            // Apply pan
            if (parameters.ContainsKey("pan"))
            {
                float pan = parameters["pan"];
                for (int i = 0; i < input.Length; i++)
                {
                    output[i] = input[i] * (1f + pan);
                }
            }

            // Apply EQ
            if (parameters.ContainsKey("eq_low") || parameters.ContainsKey("eq_mid") || parameters.ContainsKey("eq_high"))
            {
                float lowGain = parameters.ContainsKey("eq_low") ? Mathf.Pow(10f, parameters["eq_low"] / 20f) : 1f;
                float midGain = parameters.ContainsKey("eq_mid") ? Mathf.Pow(10f, parameters["eq_mid"] / 20f) : 1f;
                float highGain = parameters.ContainsKey("eq_high") ? Mathf.Pow(10f, parameters["eq_high"] / 20f) : 1f;

                // Simple 3-band EQ implementation
                for (int i = 0; i < input.Length; i++)
                {
                    float sample = input[i];
                    float low = sample * lowGain;
                    float mid = sample * midGain;
                    float high = sample * highGain;
                    output[i] = (low + mid + high) / 3f;
                }
            }

            // Apply compression
            if (parameters.ContainsKey("threshold") && parameters.ContainsKey("ratio"))
            {
                float threshold = parameters["threshold"];
                float ratio = parameters["ratio"];
                float attack = parameters.ContainsKey("attack") ? parameters["attack"] : 0.01f;
                float release = parameters.ContainsKey("release") ? parameters["release"] : 0.1f;

                float envelope = 0f;
                for (int i = 0; i < input.Length; i++)
                {
                    float inputLevel = Mathf.Abs(input[i]);
                    float targetEnvelope = inputLevel > envelope ? attack : release;
                    envelope = Mathf.Lerp(envelope, inputLevel, targetEnvelope);

                    if (envelope > threshold)
                    {
                        float gain = threshold + (envelope - threshold) / ratio;
                        output[i] = input[i] * (gain / envelope);
                    }
                    else
                    {
                        output[i] = input[i];
                    }
                }
            }

            // Apply reverb
            if (parameters.ContainsKey("reverb_mix"))
            {
                float mix = parameters["reverb_mix"];
                float decay = parameters.ContainsKey("reverb_decay") ? parameters["reverb_decay"] : 0.5f;
                float[] reverbBuffer = new float[input.Length];

                for (int i = 0; i < input.Length; i++)
                {
                    if (i >= bufferSize)
                    {
                        reverbBuffer[i] = input[i] + buffer[i % bufferSize] * decay;
                    }
                    else
                    {
                        reverbBuffer[i] = input[i];
                    }
                }

                for (int i = 0; i < input.Length; i++)
                {
                    output[i] = Mathf.Lerp(output[i], reverbBuffer[i], mix);
                }

                // Update reverb buffer
                System.Array.Copy(reverbBuffer, buffer, bufferSize);
            }

            // Apply delay
            if (parameters.ContainsKey("delay_mix"))
            {
                float mix = parameters["delay_mix"];
                float time = parameters.ContainsKey("delay_time") ? parameters["delay_time"] : 0.5f;
                float feedback = parameters.ContainsKey("delay_feedback") ? parameters["delay_feedback"] : 0.3f;

                int delaySamples = Mathf.RoundToInt(time * sampleRate);
                for (int i = 0; i < input.Length; i++)
                {
                    if (i >= delaySamples)
                    {
                        output[i] = output[i] + input[i - delaySamples] * feedback;
                    }
                }

                // Mix dry/wet
                for (int i = 0; i < input.Length; i++)
                {
                    output[i] = Mathf.Lerp(input[i], output[i], mix);
                }
            }

            // Apply distortion
            if (parameters.ContainsKey("distortion_amount"))
            {
                float amount = parameters["distortion_amount"];
                for (int i = 0; i < input.Length; i++)
                {
                    float sample = output[i];
                    sample = Mathf.Clamp(sample * (1f + amount), -1f, 1f);
                    output[i] = sample;
                }
            }

            // Apply limiter
            if (parameters.ContainsKey("limiter_threshold"))
            {
                float threshold = parameters["limiter_threshold"];
                for (int i = 0; i < input.Length; i++)
                {
                    if (Mathf.Abs(output[i]) > threshold)
                    {
                        output[i] = Mathf.Sign(output[i]) * threshold;
                    }
                }
            }
        }

        public void Reset()
        {
            System.Array.Clear(buffer, 0, bufferSize);
            currentPosition = 0;
            isProcessing = false;
        }
    }
} 