import { AxisSlider } from './AxisSlider';
import type { Pose } from '../services/rosApi';

const metersToMm = (meters: number) => meters * 1000;
const mmToMeters = (mm: number) => mm / 1000;

type CartesianControlProps = {
  targetPose: Pose;
  referencePose: Pose;
  rx: number;
  ry: number;
  rz: number;
  setRx: (value: number) => void;
  setRy: (value: number) => void;
  setRz: (value: number) => void;
  updateTargetPosition: (axis: 'x' | 'y' | 'z', value: number) => void;
  moveRobotPose: () => void;
  captureCurrentPoseAsReference: () => void;
  returnToPreviousPose: () => void;
};

export function CartesianControl({
  targetPose,
  referencePose,
  rx,
  ry,
  rz,
  setRx,
  setRy,
  setRz,
  updateTargetPosition,
  moveRobotPose,
  captureCurrentPoseAsReference,
  returnToPreviousPose,
}: CartesianControlProps) {

    if (!targetPose || !referencePose) {
  return <p>Esperando pose cartesiana...</p>;
}
  return (
    <section className="controls">
      <h2>Control cartesiano [mm]</h2>

      <AxisSlider
        label="Eje X"
        value={metersToMm(targetPose.position.x)}
        reference={metersToMm(referencePose.position.x)}
        min={metersToMm(referencePose.position.x) - 200}
        max={metersToMm(referencePose.position.x) + 200}
        step={5}
        onChange={(value) => updateTargetPosition('x', mmToMeters(value))}
        showReference={true}
      />

      <AxisSlider
        label="Eje Y"
        value={metersToMm(targetPose.position.y)}
        reference={metersToMm(referencePose.position.y)}
        min={metersToMm(referencePose.position.y) - 200}
        max={metersToMm(referencePose.position.y) + 200}
        step={5}
        onChange={(value) => updateTargetPosition('y', mmToMeters(value))}
        showReference={true}
      />

      <AxisSlider
        label="Eje Z"
        value={metersToMm(targetPose.position.z)}
        reference={metersToMm(referencePose.position.z)}
        min={metersToMm(referencePose.position.z) - 200}
        max={metersToMm(referencePose.position.z) + 200}
        step={5}
        onChange={(value) => updateTargetPosition('z', mmToMeters(value))}
        showReference={true}
      />

      <h3>Orientación cartesiana relativa a la posición [°]</h3>

      <AxisSlider
        label="Rx"
        value={rx}
        reference={0}
        min={-10}
        max={10}
        step={1}
        onChange={setRx}
        showReference={false}
      />

      <AxisSlider
        label="Ry"
        value={ry}
        reference={0}
        min={-10}
        max={10}
        step={1}
        onChange={setRy}
        showReference={false}

      />

      <AxisSlider
        label="Rz"
        value={rz}
        reference={0}
        min={-10}
        max={10}
        step={1}
        onChange={setRz}
        showReference={false}
      />

      <button onClick={moveRobotPose}>Mover cartesiano</button>
      <button onClick={returnToPreviousPose}>Volver a posición anterior</button>
      <button onClick={captureCurrentPoseAsReference}>Usar posición actual como referencia</button>
    </section>
  );
}