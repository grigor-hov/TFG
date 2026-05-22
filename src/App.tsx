import { useEffect, useRef, useState } from 'react';
import './App.css';
import type { Pose } from './services/rosApi';
import GoFa3D from "./components/robot_3d/GoFa_3d";
import { Canvas } from "@react-three/fiber";

import {
  publishPoseCommand,
  subscribeToPose,
  // publishJointCommand,
  subscribeToJointState,
  applyRelativeAxisAngleXYZRotation,
} from './services/rosApi';

import { RobotStatePanel } from './components/RobotStatePanel';
import { CartesianControl } from './components/CartesianControl';
import { JointControl } from './components/JointControl';
import { computeForwardKinematics } from './utils/forwardKinematics';

const CARTESIAN_LIMIT_M = 0.2; // ±200 mm

const HOME_JOINTS = [
  0,
  0,
  0,
  0,
  Math.PI / 6,
  0,
];

function App() {
  const [activePanel, setActivePanel] = useState<'cartesian' | 'joint'>('cartesian');
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [referencePose, setReferencePose] = useState<Pose | null>(null);
  const [targetPose, setTargetPose] = useState<Pose | null>(null);
  const [previousPose, setPreviousPose] = useState<Pose | null>(null);

  const [currentJoints, setCurrentJoints] = useState<number[]>([]);
  const [referenceJoints, setReferenceJoints] = useState<number[]>([]);
  const [targetJoints, setTargetJoints] = useState<number[]>([]);
  const [previousJoints, setPreviousJoints] = useState<number[]>([]);

  const [activeControlMode, setActiveControlMode] = useState<'cartesian' | 'joint'>('cartesian');

  const syncJointTargetWithStateRef = useRef(false);

  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [rz, setRz] = useState(0);

  // const fkMatrix = computeForwardKinematics(currentJoints);
  // const fkPose = currentJoints.length === 6
  //   ? computeForwardKinematics(currentJoints): null;

  const [message, setMessage] = useState(
    'Esperando estado real del robot...'
  );

  useEffect(() => {
    const unsubscribe = subscribeToPose((pose) => {
      setCurrentPose(pose);

      if (referencePose === null) {
        setReferencePose(pose);
        setTargetPose(pose);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [referencePose]);

  useEffect(() => {
  const unsubscribe = subscribeToJointState((joints) => {

    setCurrentJoints(joints);

    if (activeControlMode === 'cartesian') {
      setTargetJoints(joints);
    }

    if (referenceJoints.length === 0) {
      setReferenceJoints(joints);
      setTargetJoints(joints);
    }

  });

  return () => {
    unsubscribe();
  };
}, [referenceJoints, activeControlMode]);

  function updateTargetPosition(
    axis: 'x' | 'y' | 'z',
    value: number
  ) {
    if (!targetPose) return;

    setTargetPose({
      ...targetPose,
      position: {
        ...targetPose.position,
        [axis]: value,
      },
    });
  }

  function updateTargetJoint(
    index: number,
    value: number
  ) {
    setActiveControlMode('joint');
    const updatedJoints = [...targetJoints];
    updatedJoints[index] = value;
    setTargetJoints(updatedJoints);
  }

  function moveRobotPose() {
    if (!targetPose || !referencePose) return;

    if (currentPose) {
      setPreviousPose(currentPose);
    }

    const nextPose = {
      ...targetPose,
      orientation: applyRelativeAxisAngleXYZRotation(
      referencePose.orientation,
      rx,
      ry,
      rz
),
    };

    syncJointTargetWithStateRef.current = true;
    setActiveControlMode('cartesian');
    publishPoseCommand(nextPose);

    setMessage(
      `Comando cartesiano enviado. Rotación relativa: Rx=${rx}°, Ry=${ry}°, Rz=${rz}°.`
    );
  }

  function returnToPreviousPose() {
    if (!previousPose) return;

    publishPoseCommand(previousPose);

    setMessage(
      'Volviendo a la posición cartesiana anterior.'
    );
  }

  function isPoseInsideCartesianLimits(pose: Pose, reference: Pose) {
  return (
    Math.abs(pose.position.x - reference.position.x) <= CARTESIAN_LIMIT_M &&
    Math.abs(pose.position.y - reference.position.y) <= CARTESIAN_LIMIT_M &&
    Math.abs(pose.position.z - reference.position.z) <= CARTESIAN_LIMIT_M
  );
}

  function moveRobotJoints() {
  if (targetJoints.length === 0 || !referencePose) return;

  setPreviousJoints(currentJoints);

  const fkPose = computeForwardKinematics(targetJoints);

  const poseFromFk = {
    position: fkPose.position,
    orientation: fkPose.orientation,
  };

  if (!isPoseInsideCartesianLimits(poseFromFk, referencePose)) {
    setTargetJoints(currentJoints);

    if (currentPose) {
      setTargetPose(currentPose);
    }

    setRx(0);
    setRy(0);
    setRz(0);

    setMessage(
      'Movimiento bloqueado: la pose calculada por FK queda fuera del rango cartesiano permitido de ±200 mm.'
    );

    return;
  }

  setTargetPose(poseFromFk);
  publishPoseCommand(poseFromFk);

  setMessage(
    'Comando articular convertido mediante cinemática directa y enviado como pose cartesiana.'
  );
}

  function returnToPreviousJoints() {
  if (previousJoints.length === 0) return;

  const fkPose = computeForwardKinematics(previousJoints);

  publishPoseCommand({
    position: fkPose.position,
    orientation: fkPose.orientation,
  });

  setMessage(
    'Volviendo a la pose cartesiana calculada desde las articulaciones anteriores.'
  );
}

  function captureCurrentPoseAsReference() {
    if (!currentPose) return;

    setReferencePose(currentPose);
    setTargetPose(currentPose);

    setRx(0);
    setRy(0);
    setRz(0);

    setMessage(
      'Referencia cartesiana actualizada desde /state/pose'
    );
  }

  function captureCurrentJointsAsReference() {
    if (currentJoints.length === 0) return;

    setReferenceJoints([...currentJoints]);
    setTargetJoints([...currentJoints]);

    if (currentPose) {
      setReferencePose(currentPose);
      setTargetPose(currentPose);

      setRx(0);
      setRy(0);
      setRz(0);
    }

    setMessage(
      'Referencia articular y cartesiana actualizadas desde /state/joint y /state/pose'
  );
}

function moveToHome() {
  const fkPose = computeForwardKinematics(HOME_JOINTS);

  const homePose = {
    position: fkPose.position,
    orientation: fkPose.orientation,
  };

  setPreviousJoints(currentJoints);
  setTargetJoints(HOME_JOINTS);
  setReferenceJoints(HOME_JOINTS);

  setTargetPose(homePose);
  setReferencePose(homePose);

  setRx(0);
  setRy(0);
  setRz(0);

  publishPoseCommand(homePose);

  setMessage(
    'Volviendo a Home: [0°, 0°, 0°, 0°, 30°, 0°].'
  );
};

  return (
    <main className="app">
      <section className="card">
        <h1>GoFa React WebApp</h1>

        <p>
          Control mediante ROS 2, rosbridge y EGM
        </p>

        <div className="control-layout">
          <div className="control-column robot-column">

  <section className="controls robot-viewer-placeholder">
    <h2>Representación 3D GoFa</h2>

    <div className="robot-viewer-box">
      <Canvas camera={{ position: [4, 2, 4], fov: 40 }}>
        <ambientLight intensity={10} />
        <directionalLight position={[0, 10, 0]} intensity={5} />
        <GoFa3D joints={currentJoints} />
        <GoFa3D joints={targetJoints} transparent />
      </Canvas>
    </div>

    {currentPose && (
    <>
      <div className="robot-status-grid">

        <RobotStatePanel
          title="Posición real [mm]"
          values={[
            {
              label: 'X',
              value: currentPose.position.x * 1000,
            },
            {
              label: 'Y',
              value: currentPose.position.y * 1000,
            },
            {
              label: 'Z',
              value: currentPose.position.z * 1000,
            },
          ]}
        />

        <RobotStatePanel
          title="Articulaciones reales [°]"
          values={currentJoints.map((joint, index) => ({
            label: `J${index + 1}`,
            value: joint * 180 / Math.PI,
          }))}
        />

      </div>

      <button
          type="button"
          onClick={moveToHome}
          className="home-button"
        >
          Volver a Home
        </button>
    </>
      
    )}

  </section>
</div>

          <div className="control-column slider-column">
            <div className="tabs">
              <button
                className={activePanel === 'cartesian' ? 'tab active' : 'tab'}
                onClick={() => setActivePanel('cartesian')}
              >
                Cartesianas
              </button>

              <button
                className={activePanel === 'joint' ? 'tab active' : 'tab'}
                onClick={() => setActivePanel('joint')}
              >
                Articulares
              </button>
            </div>

            {activePanel === 'cartesian' &&
              currentPose &&
              targetPose &&
              referencePose && (
                <CartesianControl
                  targetPose={targetPose}
                  referencePose={referencePose}
                  rx={rx}
                  ry={ry}
                  rz={rz}
                  setRx={setRx}
                  setRy={setRy}
                  setRz={setRz}
                  updateTargetPosition={updateTargetPosition}
                  moveRobotPose={moveRobotPose}
                  captureCurrentPoseAsReference={captureCurrentPoseAsReference}
                  returnToPreviousPose={returnToPreviousPose}
                />
              )}

            {activePanel === 'joint' && (
              <JointControl
                currentJoints={currentJoints}
                referenceJoints={referenceJoints}
                targetJoints={targetJoints}
                updateTargetJoint={updateTargetJoint}
                moveRobotJoints={moveRobotJoints}
                returnToPreviousJoints={returnToPreviousJoints}
                captureCurrentJointsAsReference={captureCurrentJointsAsReference}
                moveToHome={moveToHome}
              />
            )}
          </div>
        </div>

        <p className="message">{message}</p>
      </section>

    </main>
  );
}

export default App;