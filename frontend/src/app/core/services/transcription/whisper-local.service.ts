import { Injectable, signal } from '@angular/core';
import { TranscriptionService } from './transcription.interface';

/**
 * On-Device Whisper Transcription Service
 *
 * Uses Hugging Face's transformers.js to run OpenAI Whisper directly in the browser.
 * Model is downloaded from Hugging Face CDN on first use and cached.
 *
 * Model: Xenova/whisper-tiny.en (~40MB, English-only, fastest)
 *
 * Pros:
 * - Zero server cost
 * - Privacy (audio never leaves device)
 * - Works offline after model is cached
 *
 * Cons:
 * - ~40MB model download on first use
 * - 5-15 second transcription time depending on device
 * - English only (can upgrade to whisper-small for multilingual)
 */
@Injectable({
  providedIn: 'root'
})
export class WhisperLocalService implements TranscriptionService {
  // Status signals
  loadingProgress = signal(0);
  statusMessage = signal('Ready');
  isProcessing = signal(false);

  // Pipeline instance (lazy loaded)
  private pipeline: any = null;
  private pipelinePromise: Promise<any> | null = null;

  isAvailable(): boolean {
    // Check if Web Workers and WASM are supported
    return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('On-device transcription is not supported in this browser');
    }

    try {
      this.isProcessing.set(true);
      this.statusMessage.set('Preparing...');

      // Get or initialize the pipeline
      const pipe = await this.getPipeline();

      // Convert blob to audio data
      this.statusMessage.set('Processing audio...');
      const audioData = await this.blobToAudioData(audioBlob);

      // Transcribe
      this.statusMessage.set('Transcribing...');
      const result = await pipe(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });

      this.statusMessage.set('Complete');
      this.loadingProgress.set(100);

      return result.text.trim();

    } catch (error: any) {
      this.statusMessage.set('Error: ' + error.message);
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async getPipeline(): Promise<any> {
    if (this.pipeline) {
      return this.pipeline;
    }

    // Return existing promise if already loading
    if (this.pipelinePromise) {
      return this.pipelinePromise;
    }

    this.pipelinePromise = this.initializePipeline();
    this.pipeline = await this.pipelinePromise;
    return this.pipeline;
  }

  private async initializePipeline(): Promise<any> {
    this.statusMessage.set('Loading Whisper model...');
    this.loadingProgress.set(0);

    try {
      // Dynamic import of transformers.js
      // This ensures the package is only loaded when needed
      const { pipeline, env } = await import('@huggingface/transformers');

      // Configure to use remote models from Hugging Face Hub
      env.allowLocalModels = false;

      // Create the automatic speech recognition pipeline
      // Using whisper-tiny.en for fastest processing (~40MB)
      // Alternatives:
      // - 'Xenova/whisper-small.en' (~150MB, better accuracy)
      // - 'Xenova/whisper-base.en' (~75MB, balanced)
      const pipe = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress' && progress.progress) {
              this.loadingProgress.set(Math.round(progress.progress));
              this.statusMessage.set(`Downloading model: ${Math.round(progress.progress)}%`);
            } else if (progress.status === 'done') {
              this.statusMessage.set('Model ready');
              this.loadingProgress.set(100);
            }
          }
        }
      );

      this.statusMessage.set('Model loaded');
      return pipe;

    } catch (error: any) {
      this.statusMessage.set('Failed to load model');
      this.pipelinePromise = null;
      throw new Error(`Failed to load Whisper model: ${error.message}`);
    }
  }

  private async blobToAudioData(blob: Blob): Promise<Float32Array> {
    // Create an AudioContext to decode the audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000 // Whisper expects 16kHz audio
    });

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get the audio data from the first channel
      const audioData = audioBuffer.getChannelData(0);

      // If sample rate doesn't match, resample
      if (audioBuffer.sampleRate !== 16000) {
        return this.resample(audioData, audioBuffer.sampleRate, 16000);
      }

      return audioData;

    } finally {
      await audioContext.close();
    }
  }

  private resample(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation
      result[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
    }

    return result;
  }
}
