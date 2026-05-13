import { useEffect, useState } from 'react';
import './App.css';

import type { Pose } from './services/rosApi';

import {
  publishPoseCommand,
  subscribeToPose,
  publishJointCommand,
  subscribeToJointState,
  applyRelativeEulerRotation,
} from './services/rosApi';

import { RobotStatePanel } from './components/RobotStatePanel';
import { CartesianControl } from './components/CartesianControl';
import { JointControl } from './components/JointControl';
// import { computeForwardKinematics } from './utils/forwardKinematics';

function App() {
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [referencePose, setReferencePose] = useState<Pose | null>(null);
  const [targetPose, setTargetPose] = useState<Pose | null>(null);
  const [previousPose, setPreviousPose] = useState<Pose | null>(null);

  const [currentJoints, setCurrentJoints] = useState<number[]>([]);
  const [referenceJoints, setReferenceJoints] = useState<number[]>([]);
  const [targetJoints, setTargetJoints] = useState<number[]>([]);
  const [previousJoints, setPreviousJoints] = useState<number[]>([]);

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

      if (referenceJoints.length === 0) {
        setReferenceJoints(joints);
        setTargetJoints(joints);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [referenceJoints]);

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
      orientation: applyRelativeEulerRotation(
        referencePose.orientation,
        rx,
        ry,
        rz
      ),
    };

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

  function moveRobotJoints() {
    if (targetJoints.length === 0) return;

    setPreviousJoints(currentJoints);

    publishJointCommand(targetJoints);

    setMessage(
      'Comando articular enviado. El estado real se actualizará desde /state/joint.'
    );
  }

  function returnToPreviousJoints() {
    if (previousJoints.length === 0) return;

    publishJointCommand(previousJoints);

    setMessage(
      'Volviendo a la posición articular anterior.'
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

  return (
    <main className="app">
      <section className="card">
        <h1>GoFa React WebApp</h1>

        <p>
          Control mediante ROS 2, rosbridge y EGM
        </p>

        <div className="control-layout">
          {currentPose &&
            targetPose &&
            referencePose && (
              <div className="control-column">
                <RobotStatePanel

                  title="Posición real del robot [mm]"
                  values={[
                    {
                      label: 'X',
                      value:
                        currentPose.position.x *1000,
                    },
                    {
                      label: 'Y',
                      value:
                        currentPose.position.y *1000,
                    },
                    {
                      label: 'Z',
                      value:
                        currentPose.position.z *1000,
                    },
                  ]}
                />
                {/* {fkPose && (
                  <RobotStatePanel
                    title="TCP calculado por DH [mm]"
                    values={[
                      {
                        label: 'X',
                        value: fkPose.position.x *1000,
                      },
                      {
                        label: 'Y',
                        value: fkPose.position.y *1000,
                      },
                      {
                        label: 'Z',
                        value: fkPose.position.z *1000,
                      },
                    ]}
                  />
                )} */}
                <RobotStatePanel
                  title="Referencia cartesiana [mm]"
                  values={[
                    {
                      label: 'X',
                      value:
                        referencePose.position.x *1000,
                    },
                    {
                      label: 'Y',
                      value:
                        referencePose.position.y *1000,
                    },
                    {
                      label: 'Z',
                      value:
                        referencePose.position.z *1000,
                    },
                  ]}
                />

                <CartesianControl
                  targetPose={targetPose}
                  referencePose={referencePose}
                  rx={rx}
                  ry={ry}
                  rz={rz}
                  setRx={setRx}
                  setRy={setRy}
                  setRz={setRz}
                  updateTargetPosition={
                    updateTargetPosition
                  }
                  moveRobotPose={
                    moveRobotPose
                  }
                  captureCurrentPoseAsReference={
                    captureCurrentPoseAsReference
                  }
                  returnToPreviousPose={
                    returnToPreviousPose
                  }
                />
              </div>
            )}

          <div className="control-column">
            <JointControl
              currentJoints={currentJoints}
              referenceJoints={
                referenceJoints
              }
              targetJoints={targetJoints}
              updateTargetJoint={
                updateTargetJoint
              }
              moveRobotJoints={
                moveRobotJoints
              }
              returnToPreviousJoints={
                returnToPreviousJoints
              }
              captureCurrentJointsAsReference={
                captureCurrentJointsAsReference
              }
            />
          </div>
        </div>

        <p className="message">{message}</p>
      </section>
    </main>
  );
}

export default App;