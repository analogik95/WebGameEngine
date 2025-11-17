import { Component } from '../core/Component';
import { Vector3 } from '../math';

/**
 * AudioSource component for playing sounds in 3D space
 */
export class AudioSource extends Component {
  private _audioContext: AudioContext;
  private _gainNode: GainNode;
  private _pannerNode: PannerNode | null = null;
  private _source: AudioBufferSourceNode | null = null;
  private _buffer: AudioBuffer | null = null;

  private _volume: number = 1.0;
  private _pitch: number = 1.0;
  private _loop: boolean = false;
  private _spatial: boolean = true;
  private _isPlaying: boolean = false;

  constructor() {
    super();

    // Get or create audio context
    this._audioContext = AudioManager.instance.audioContext;

    // Create gain node for volume control
    this._gainNode = this._audioContext.createGain();
    this._gainNode.gain.value = this._volume;

    // Create panner node for 3D spatial audio
    if (this._spatial) {
      this._pannerNode = this._audioContext.createPanner();
      this._pannerNode.panningModel = 'HRTF';
      this._pannerNode.distanceModel = 'inverse';
      this._pannerNode.refDistance = 1;
      this._pannerNode.maxDistance = 100;
      this._pannerNode.rolloffFactor = 1;
      this._pannerNode.coneInnerAngle = 360;
      this._pannerNode.coneOuterAngle = 0;
      this._pannerNode.coneOuterGain = 0;

      this._pannerNode.connect(this._gainNode);
      this._gainNode.connect(this._audioContext.destination);
    } else {
      this._gainNode.connect(this._audioContext.destination);
    }
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    this._gainNode.gain.value = this._volume;
  }

  get pitch(): number {
    return this._pitch;
  }

  set pitch(value: number) {
    this._pitch = value;
    if (this._source) {
      this._source.playbackRate.value = this._pitch;
    }
  }

  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
    if (this._source) {
      this._source.loop = this._loop;
    }
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Loads an audio file
   */
  async loadAudio(url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._buffer = await this._audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Plays the audio
   */
  play(): void {
    if (!this._buffer) {
      console.warn('No audio buffer loaded');
      return;
    }

    this.stop();

    this._source = this._audioContext.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.loop = this._loop;
    this._source.playbackRate.value = this._pitch;

    if (this._pannerNode) {
      this._source.connect(this._pannerNode);
    } else {
      this._source.connect(this._gainNode);
    }

    this._source.start(0);
    this._isPlaying = true;

    this._source.onended = () => {
      this._isPlaying = false;
    };
  }

  /**
   * Stops the audio
   */
  stop(): void {
    if (this._source) {
      try {
        this._source.stop();
      } catch (e) {
        // Already stopped
      }
      this._source.disconnect();
      this._source = null;
      this._isPlaying = false;
    }
  }

  /**
   * Pauses the audio
   */
  pause(): void {
    if (this._audioContext.state === 'running') {
      this._audioContext.suspend();
    }
  }

  /**
   * Resumes the audio
   */
  resume(): void {
    if (this._audioContext.state === 'suspended') {
      this._audioContext.resume();
    }
  }

  protected override update(deltaTime: number): void {
    if (this._spatial && this._pannerNode && this.transform) {
      const pos = this.transform.worldPosition;
      this._pannerNode.positionX.value = pos.x;
      this._pannerNode.positionY.value = pos.y;
      this._pannerNode.positionZ.value = pos.z;

      const forward = this.transform.forward;
      this._pannerNode.orientationX.value = forward.x;
      this._pannerNode.orientationY.value = forward.y;
      this._pannerNode.orientationZ.value = forward.z;
    }
  }

  protected override onDestroy(): void {
    this.stop();
    this._gainNode.disconnect();
    if (this._pannerNode) {
      this._pannerNode.disconnect();
    }
    super.onDestroy();
  }
}

/**
 * AudioManager manages the global audio context and listener
 */
export class AudioManager {
  private static _instance: AudioManager;
  private _audioContext: AudioContext;
  private _listenerPosition: Vector3 = new Vector3(0, 0, 0);

  private constructor() {
    this._audioContext = new AudioContext();
  }

  static get instance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  get audioContext(): AudioContext {
    return this._audioContext;
  }

  /**
   * Updates the audio listener position (usually the camera position)
   */
  updateListenerPosition(position: Vector3, forward: Vector3, up: Vector3): void {
    this._listenerPosition.copy(position);

    const listener = this._audioContext.listener;

    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;

      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;

      listener.upX.value = up.x;
      listener.upY.value = up.y;
      listener.upZ.value = up.z;
    }
  }
}
