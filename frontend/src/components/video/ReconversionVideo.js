import React, { useEffect, useRef, useState } from "react";
import videoFile from "../../video/Reconversion.mp4";
import { FiVolume2, FiVolumeX } from "react-icons/fi";

const ReconversionVideo = () => {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Par défaut, le son est coupé

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting); // Vérifie si la vidéo est visible
      },
      { threshold: 0.7 } // Déclenche si au moins 70% de la vidéo est visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible && videoRef.current.paused) {
        videoRef.current.play(); // Joue uniquement si la vidéo est en pause
      } else if (!isVisible && !videoRef.current.paused) {
        videoRef.current.pause(); // Met en pause uniquement si la vidéo est en cours de lecture
      }
    }
  }, [isVisible]);

  const toggleMute = () => {
    if (videoRef.current) {
      setIsMuted(!isMuted);
      videoRef.current.muted = isMuted; // Active ou désactive le son
    }
  };

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        src={videoFile}
        autoPlay
        loop
        muted={isMuted} // Contrôle si la vidéo est en sourdine ou non
        playsInline
        className="reconversion-video"
      />
      <button onClick={toggleMute} className="mute-toggle">
      {isMuted ? <FiVolumeX size={30} /> : <FiVolume2 size={30} />}
      </button>
    </div>
  );
};

export default ReconversionVideo;
