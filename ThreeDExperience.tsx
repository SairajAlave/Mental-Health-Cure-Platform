import { CameraControls, ContactShadows, Environment } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import { ThreeDAvatar, LipsyncCue } from './ThreeDAvatar';

interface ThreeDExperienceProps {
  animation?: string;
  facialExpression?: string;
  lipsync?: { mouthCues: LipsyncCue[] };
  audioUrl?: string;
  audio?: { currentTime: number } | null;
  onAudioEnd?: () => void;
  cameraTargetY?: number;
}

export const ThreeDExperience: React.FC<ThreeDExperienceProps> = ({
  animation,
  facialExpression,
  lipsync,
  audioUrl,
  audio,
  onAudioEnd,
  cameraTargetY = 3.7,
}) => {
  const cameraControls = useRef<any>();

  useEffect(() => {
    if (cameraControls.current) {
      // Use the same z as the camera for a straight-on look
      cameraControls.current.setLookAt(0, cameraTargetY, cameraControls.current.camera.position.z, 0, cameraTargetY, 0);
    }
  }, [cameraTargetY]);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Suspense>
        <group scale={[3, 3, 3]} position={[-0.15, -1.0, 0]}>
          <ThreeDAvatar
            animation={animation}
            facialExpression={facialExpression as any}
            lipsync={lipsync}
            audioUrl={audioUrl}
            audio={audio}
            onAudioEnd={onAudioEnd}
          />
        </group>
      </Suspense>
      <ContactShadows opacity={0.7} />
    </>
  );
}; 