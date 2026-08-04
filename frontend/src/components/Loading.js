import React, { useEffect, useRef, useState, useContext } from 'react';
import { LoadingContext } from '../contexts/LoadingContext';
import AxelLogo from './Header/AxelLogo';
import '../styles/Loading.scss';

const Loading = () => {
  const [fadeOut, setFadeOut] = useState(false);
  const { isFirstLoad, setIsFirstLoad } = useContext(LoadingContext);
  const videoSrc = useRef('/loading.mp4'); // URL stable -> mise en cache navigateur

  useEffect(() => {
    if (!isFirstLoad) return;
    const safetyTimer = setTimeout(triggerFadeOut, 8500);
    return () => clearTimeout(safetyTimer);
  }, [isFirstLoad]);

  const triggerFadeOut = () => {
    setFadeOut(true);
    setTimeout(() => setIsFirstLoad(false), 600);
  };

  if (!isFirstLoad) return null;

  return (
    <div className={`loading-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-video-div">
        <video
          className="loading-video"
          src={videoSrc.current}
          autoPlay
          muted
          playsInline
          onEnded={triggerFadeOut}
        />
      </div>
      <div className="loading-text-div">
        <p className="loading-name">
          Axel Grégoire <span>is coming</span>
        </p>
        <div className="loading-logo-mobile" aria-hidden="true">
          <AxelLogo
            size={84}
            smallDotSize={3}
            bigDotSize={5}
            invertLogo
            spin
          />
        </div>
      </div>
    </div>
  );
};

export default Loading;
