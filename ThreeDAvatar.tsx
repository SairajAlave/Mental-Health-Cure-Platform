import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const facialExpressions = {
  default: {},
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.17,
    noseSneerRight: 0.14,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78,
    browInnerUp: 0.45,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.35,
    mouthFunnel: 1,
    browInnerUp: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
};

export const corresponding = {
  A: 'viseme_aa', // open mouth
  B: 'viseme_PP', // closed lips
  C: 'viseme_I', // wide smile
  D: 'viseme_DD', // tongue behind teeth
  E: 'viseme_E', // spread lips
  F: 'viseme_FF', // teeth on lip
  G: 'viseme_nn', // tongue to roof
  H: 'viseme_TH', // tongue between teeth
  X: 'viseme_sil', // silence
};

export interface LipsyncCue {
  start: number;
  end: number;
  value: keyof typeof corresponding;
}

interface ThreeDAvatarProps {
  animation?: string;
  facialExpression?: keyof typeof facialExpressions;
  lipsync?: { mouthCues: LipsyncCue[] };
  audioUrl?: string; // base64 or normal url
  audio?: { currentTime: number } | null; // fake or real audio object
  onAudioEnd?: () => void;
}

export const ThreeDAvatar: React.FC<ThreeDAvatarProps> = ({
  animation = 'Idle',
  facialExpression = 'default',
  lipsync,
  audioUrl,
  audio: externalAudio,
  onAudioEnd,
}) => {
  const { nodes, materials, scene } = useGLTF('/models/64f1a714fe61576b46f27ca2.glb') as any;
  const { animations } = useGLTF('/models/animations.glb') as any;
  const group = useRef<any>();
  const { actions, mixer } = useAnimations(animations, group);
  const [blink, setBlink] = useState(false);
  const [winkLeft, setWinkLeft] = useState(false);
  const [winkRight, setWinkRight] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | { currentTime: number } | null>(null);

  // Log morph target names for debugging lipsync
  useEffect(() => {
    if (nodes.Wolf3D_Head && nodes.Wolf3D_Head.morphTargetDictionary) {
      // console.log('Wolf3D_Head morph targets:', Object.keys(nodes.Wolf3D_Head.morphTargetDictionary));
    }
  }, [nodes.Wolf3D_Head]);

  // Animation switching
  useEffect(() => {
    if (actions && animation && actions[animation]) {
      actions[animation].reset().fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5).play();
      return () => {
        if (actions[animation] && typeof actions[animation].fadeOut === 'function') {
          actions[animation].fadeOut(0.5);
        }
      };
    }
  }, [animation, actions, mixer]);

  // Audio playback (only for real audioUrl)
  useEffect(() => {
    if (audioUrl) {
      const audioObj = new Audio(audioUrl.startsWith('data:') ? audioUrl : `data:audio/mp3;base64,${audioUrl}`);
      setAudio(audioObj);
      audioObj.play();
      if (onAudioEnd) audioObj.onended = onAudioEnd;
      return () => {
        audioObj.pause();
        audioObj.onended = null;
      };
    }
  }, [audioUrl, onAudioEnd]);

  // Blinking
  useEffect(() => {
    let blinkTimeout: any;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Morph target lerping
  const lerpMorphTarget = (target: string, value: number, speed = 0.1) => {
    scene.traverse((child: any) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) return;
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );
      }
    });
  };

  useFrame(() => {
    // Facial expression
    Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
      const mapping = facialExpressions[facialExpression];
      if (key === 'eyeBlinkLeft' || key === 'eyeBlinkRight') return;
      if (mapping && mapping[key]) {
        lerpMorphTarget(key, mapping[key], 0.1);
      } else {
        lerpMorphTarget(key, 0, 0.1);
      }
    });
    lerpMorphTarget('eyeBlinkLeft', blink || winkLeft ? 1 : 0, 0.5);
    lerpMorphTarget('eyeBlinkRight', blink || winkRight ? 1 : 0, 0.5);
    // Lipsync
    const appliedMorphTargets: string[] = [];
    // Use externalAudio (fake or real) if provided, else fallback to internal audio state
    const lipsyncAudio = externalAudio || audio;
    if (lipsync && lipsyncAudio) {
      const currentAudioTime = lipsyncAudio.currentTime;
      let viseme = null;
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          appliedMorphTargets.push(corresponding[mouthCue.value]);
          viseme = mouthCue.value;
          lerpMorphTarget(corresponding[mouthCue.value], 1, 0.2);
          break;
        }
      }
    }
    Object.values(corresponding).forEach((value) => {
      if (appliedMorphTargets.includes(value)) return;
      lerpMorphTarget(value, 0, 0.1);
    });
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh name="Wolf3D_Body" geometry={nodes.Wolf3D_Body.geometry} material={materials.Wolf3D_Body} skeleton={nodes.Wolf3D_Body.skeleton} />
      <skinnedMesh name="Wolf3D_Outfit_Bottom" geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
      <skinnedMesh name="Wolf3D_Outfit_Footwear" geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={materials.Wolf3D_Outfit_Footwear} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
      <skinnedMesh name="Wolf3D_Outfit_Top" geometry={nodes.Wolf3D_Outfit_Top.geometry} material={materials.Wolf3D_Outfit_Top} skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
      <skinnedMesh name="Wolf3D_Hair" geometry={nodes.Wolf3D_Hair.geometry} material={materials.Wolf3D_Hair} skeleton={nodes.Wolf3D_Hair.skeleton} />
      <skinnedMesh name="EyeLeft" geometry={nodes.EyeLeft.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeLeft.skeleton} morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} />
      <skinnedMesh name="EyeRight" geometry={nodes.EyeRight.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeRight.skeleton} morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Head" geometry={nodes.Wolf3D_Head.geometry} material={materials.Wolf3D_Skin} skeleton={nodes.Wolf3D_Head.skeleton} morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Teeth" geometry={nodes.Wolf3D_Teeth.geometry} material={materials.Wolf3D_Teeth} skeleton={nodes.Wolf3D_Teeth.skeleton} morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} />
    </group>
  );
};

// Preload models
useGLTF.preload('/models/64f1a714fe61576b46f27ca2.glb');
useGLTF.preload('/models/animations.glb'); 