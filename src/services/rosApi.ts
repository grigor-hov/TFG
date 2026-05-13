import * as ROSLIB from 'roslib';
import * as THREE from 'three';

export type Pose = {
  position: {
    x: number;
    y: number;
    z: number;
  };
  orientation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
};

export function eulerDegreesToQuaternion(
  rx: number,
  ry: number,
  rz: number
) {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(rx),
    THREE.MathUtils.degToRad(ry),
    THREE.MathUtils.degToRad(rz),
    'XYZ'
  );

  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(euler);

  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

export function applyRelativeEulerRotation(
  baseOrientation: {
    x: number;
    y: number;
    z: number;
    w: number;
  },
  rx: number,
  ry: number,
  rz: number
) {
  const baseQuaternion = new THREE.Quaternion(
    baseOrientation.x,
    baseOrientation.y,
    baseOrientation.z,
    baseOrientation.w
  );

  const relativeEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(rx),
    THREE.MathUtils.degToRad(ry),
    THREE.MathUtils.degToRad(rz),
    'XYZ'
  );

  const relativeQuaternion = new THREE.Quaternion();
  relativeQuaternion.setFromEuler(relativeEuler);

  const finalQuaternion = baseQuaternion.multiply(
    relativeQuaternion
  );

  return {
    x: finalQuaternion.x,
    y: finalQuaternion.y,
    z: finalQuaternion.z,
    w: finalQuaternion.w,
  };
}

const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090',
});

const poseCommandTopic = new ROSLIB.Topic({
  ros,
  name: '/command/pose',
  messageType: 'geometry_msgs/msg/Pose',
});

const poseStateTopic = new ROSLIB.Topic({
  ros,
  name: '/state/pose',
  messageType: 'geometry_msgs/msg/Pose',
});

const jointCommandTopic = new ROSLIB.Topic({
  ros,
  name: '/command/joint',
  messageType: 'std_msgs/msg/Float32MultiArray',
});

const jointStateTopic = new ROSLIB.Topic({
  ros,
  name: '/state/joint',
  messageType: 'sensor_msgs/msg/JointState',
});

export function publishPoseCommand(pose: Pose) {
  poseCommandTopic.publish(pose);
}

export function subscribeToPose(callback: (pose: Pose) => void) {
  const handler = (message: unknown) => {
    callback(message as Pose);
  };

  poseStateTopic.subscribe(handler);

  return () => {
    poseStateTopic.unsubscribe(handler);
  };
}

export function publishJointCommand(joints: number[]) {
  jointCommandTopic.publish({
    data: joints,
  });
}

export function subscribeToJointState(
  callback: (joints: number[]) => void
) {
  const handler = (message: any) => {
    callback(message.position);
  };

  jointStateTopic.subscribe(handler);

  return () => {
    jointStateTopic.unsubscribe(handler);
  };
}