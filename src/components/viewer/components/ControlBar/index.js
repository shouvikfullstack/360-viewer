import React, { useState } from 'react';
import styles from './styles.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStepBackward, faStepForward, faSearchPlus, faSearchMinus, faArrowsAlt, faPlay, faPause } from '@fortawesome/free-solid-svg-icons'
// import TargetIcon from '../../assets/icons/target.svg';
// import StopIcon from '../../assets/icons/stop.svg';
// import NextIcon from '../../assets/icons/next.svg';
// import PrevIcon from '../../assets/icons/previous.svg';
// import PauseIcon from '../../assets/icons/pause.svg';
// import PlayIcon from '../../assets/icons/play.svg';

const ControlBar = ({ onPlay, onPause, onNext, onPrev, onRecordStart, onRecordStop, onFullScreen, onZoomIn, onZoomOut }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isFullScreen, setIsFullScreen] = useState(false);

	const playHandler = () => {
		setIsPlaying(true);
		onPlay();
	};

	const pauseHandler = () => {
		setIsPlaying(false);
		onPause();
	};

	return (
		<div
			className={`Viewer-control-bar ${styles['Viewer-control-bar']}`}
			onClick={(e) => e.stopPropagation()}
		>
			{!isPlaying && (
				<a className={`${styles['Viewer-control-button']}`} onClick={playHandler}>
					<FontAwesomeIcon icon={faPlay} style={{fontSize:'15px', cursor: 'pointer'}} />
				</a>
			)}
			{isPlaying && (
				<a className={`${styles['Viewer-control-button']}`} onClick={pauseHandler}>
					<FontAwesomeIcon icon={faPause} style={{fontSize:'15px', cursor: 'pointer'}} />
				</a>
			)}
			<a className={`${styles['Viewer-control-button']}`} onClick={onPrev}>
				<FontAwesomeIcon icon={faStepBackward} style={{fontSize:'15px', cursor: 'pointer'}} />
			</a>
			<a className={`${styles['Viewer-control-button']}`} onClick={onNext}>
				<FontAwesomeIcon icon={faStepForward} style={{fontSize:'15px', cursor: 'pointer'}} />
			</a>

			<a className={`${styles['Viewer-control-button']}`} onClick={onZoomIn}>
				<FontAwesomeIcon icon={faSearchPlus} style={{fontSize:'15px', cursor: 'pointer'}} />
			</a>

			<a className={`${styles['Viewer-control-button']}`} onClick={onZoomOut}>
				<FontAwesomeIcon icon={faSearchMinus} style={{fontSize:'15px', cursor: 'pointer'}} />
			</a>

			<a className={`${styles['Viewer-control-button']}`} onClick={onFullScreen}>
				<FontAwesomeIcon icon={faArrowsAlt} style={{fontSize:'15px', cursor: 'pointer'}} />
			</a>
		</div>
	);
};

export default ControlBar;
