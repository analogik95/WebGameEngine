/**
 * Time management system
 * Tracks frame time, delta time, and provides timing utilities
 */
export class Time {
  private static _instance: Time;

  private _deltaTime: number = 0;
  private _fixedDeltaTime: number = 0.02; // 50 FPS default
  private _time: number = 0;
  private _frameCount: number = 0;
  private _timeScale: number = 1.0;
  private _lastFrameTime: number = 0;
  private _fps: number = 60;
  private _fpsUpdateTime: number = 0;
  private _fpsFrameCount: number = 0;

  private constructor() {}

  static get instance(): Time {
    if (!Time._instance) {
      Time._instance = new Time();
    }
    return Time._instance;
  }

  /**
   * The time in seconds since the start of the application
   */
  static get time(): number {
    return Time.instance._time;
  }

  /**
   * The time in seconds it took to complete the last frame
   */
  static get deltaTime(): number {
    return Time.instance._deltaTime * Time.instance._timeScale;
  }

  /**
   * The unscaled time in seconds it took to complete the last frame
   */
  static get unscaledDeltaTime(): number {
    return Time.instance._deltaTime;
  }

  /**
   * The fixed time step for physics updates
   */
  static get fixedDeltaTime(): number {
    return Time.instance._fixedDeltaTime;
  }

  static set fixedDeltaTime(value: number) {
    Time.instance._fixedDeltaTime = value;
  }

  /**
   * The scale at which time passes (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
   */
  static get timeScale(): number {
    return Time.instance._timeScale;
  }

  static set timeScale(value: number) {
    Time.instance._timeScale = Math.max(0, value);
  }

  /**
   * The total number of frames that have passed
   */
  static get frameCount(): number {
    return Time.instance._frameCount;
  }

  /**
   * The current frames per second
   */
  static get fps(): number {
    return Time.instance._fps;
  }

  /**
   * @internal - Called by Engine at the start of each frame
   */
  static internal_update(timestamp: number): void {
    const instance = Time.instance;

    if (instance._lastFrameTime === 0) {
      instance._lastFrameTime = timestamp;
      return;
    }

    // Calculate delta time (convert from ms to seconds)
    const rawDelta = (timestamp - instance._lastFrameTime) / 1000;
    instance._deltaTime = Math.min(rawDelta, 0.1); // Cap at 100ms to avoid spiral of death

    // Update time
    instance._time += instance._deltaTime * instance._timeScale;

    // Update frame count
    instance._frameCount++;

    // Update FPS counter every second
    instance._fpsFrameCount++;
    if (timestamp - instance._fpsUpdateTime >= 1000) {
      instance._fps = instance._fpsFrameCount;
      instance._fpsFrameCount = 0;
      instance._fpsUpdateTime = timestamp;
    }

    instance._lastFrameTime = timestamp;
  }

  /**
   * Resets the time system
   */
  static reset(): void {
    const instance = Time.instance;
    instance._time = 0;
    instance._deltaTime = 0;
    instance._frameCount = 0;
    instance._lastFrameTime = 0;
    instance._fps = 60;
    instance._fpsUpdateTime = 0;
    instance._fpsFrameCount = 0;
  }
}
