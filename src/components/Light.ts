import { Component } from '../core/Component';
import { Vector3 } from '../math';

export enum LightType {
  Directional,
  Point,
  Spot,
}

/**
 * Light component for illuminating the scene
 */
export class Light extends Component {
  private _type: LightType = LightType.Directional;
  private _color: Vector3 = new Vector3(1, 1, 1);
  private _intensity: number = 1;
  private _range: number = 10; // For point/spot lights
  private _spotAngle: number = 45; // For spot lights

  private static _allLights: Light[] = [];

  constructor() {
    super();
    Light._allLights.push(this);
  }

  static get allLights(): readonly Light[] {
    return Light._allLights;
  }

  get type(): LightType {
    return this._type;
  }

  set type(value: LightType) {
    this._type = value;
  }

  get color(): Vector3 {
    return this._color;
  }

  set color(value: Vector3) {
    this._color.copy(value);
  }

  get intensity(): number {
    return this._intensity;
  }

  set intensity(value: number) {
    this._intensity = value;
  }

  get range(): number {
    return this._range;
  }

  set range(value: number) {
    this._range = value;
  }

  get spotAngle(): number {
    return this._spotAngle;
  }

  set spotAngle(value: number) {
    this._spotAngle = value;
  }

  get direction(): Vector3 {
    return this.transform?.forward || Vector3.forward;
  }

  protected override onDestroy(): void {
    const index = Light._allLights.indexOf(this);
    if (index !== -1) {
      Light._allLights.splice(index, 1);
    }
    super.onDestroy();
  }
}
