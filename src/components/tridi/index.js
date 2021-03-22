import React, {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
	useCallback
} from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';
import styled from 'styled-components'
import staticImage from '../../assets/images';

import useInterval from './hooks/useInterval';
import ControlBar from './components/ControlBar';
import Pins from './components/Pins';

class ViewerUtils {
	static isValidProps = ({ images, format, location }) => {
		let isValid = true;
		if (!images && !format) {
			console.error(
				"'format' property is missing or invalid. Image format must be provided for 'numbered' property."
			);
			isValid = false;
		}
		if (images === 'numbered' && !location) {
			console.error(
				"'location' property is missing or invalid. Image location must be provided for 'numbered' property."
			);
			isValid = false;
		}
		return isValid;
	};

	static normalizedImages = (images, format, location, count) => {
		if (images === 'numbered') {
			return Array.apply(null, { length: count }).map((_a, index) => {
				return `${location}/${index + 1}.${format.toLowerCase()}`;
			});
		}
		return images;
	};

	static uid = () => {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	};
}

const Viewer = forwardRef(
	(
		{
			className,
			style,
			images,
			pins: propPins,
			pinss,
			format,
			location,
			count,
			draggable,
			hintOnStartup,
			hintText,
			autoplay,
			autoplaySpeed,
			stopAutoplayOnClick,
			stopAutoplayOnMouseEnter,
			resumeAutoplayOnMouseLeave,
			touch,
			mousewheel,
			inverse,
			dragInterval,
			touchDragInterval,
			mouseleaveDetect,
			showControlBar,
			renderPin,
			onHintHide,
			onAutoplayStart,
			onAutoplayStop,
			onNextMove,
			onPrevMove,
			onNextFrame,
			onPrevFrame,
			onDragStart,
			onDragEnd,
			onFrameChange,
			onRecordStart,
			onRecordStop,
			onPinClick
		},
		ref
	) => {
		const [moveBuffer, setMoveBuffer] = useState([]);
		const [hintVisible, setHintVisible] = useState(hintOnStartup);
		const [currentImageIndex, setCurrentImageIndex] = useState(0);
		const [isDragging, setIsDragging] = useState(false);
		const [isAutoPlayRunning, setIsAutoPlayRunning] = useState(false);
		const [isRecording, setIsRecording] = useState(false);
		const [pins, setPins] = useState(propPins || []);
		const [isFullScreen, setIsFullScreen] = useState(false);
		const [zoom, setZoom] = useState(1);
		const [isMobile, setIsMobile] = useState(false);

		const _count = Array.isArray(images) ? images.length : Number(count);
		const _images = ViewerUtils.normalizedImages(images, format, location, _count);
		const _viewerImageRef = useRef(null);
		const _draggable = !isRecording && draggable;
		const rangePlus = () => setZoom((z) => (z + 0.1 > 3 ? 3 : z + 0.1))
		const rangeMinus = () => setZoom((z) => (z - 0.1 < 1 ? 1 : z - 0.1))

		const hideHint = () => {
			toggleAutoplay(false);
			setHintVisible(false);
			onHintHide();
		};

		const getWindowDimensions = useCallback(() => {
			const { innerWidth: width, innerHeight: height } = window;
			return {
				width,
				height
			};
		})

		useEffect(() => {
			function handleResize() {
				const { width } = getWindowDimensions();
				width<480 ? setIsMobile(true) : setIsMobile(false);
			}

			handleResize();
		
			if(window) window.addEventListener('resize', handleResize);
			return () => window? window.removeEventListener('resize', handleResize): null;
		  }, []);

		const toggleFullScreen = useCallback(() => {
			setIsFullScreen(!isFullScreen);
		});

		const nextFrame = useCallback(() => {
			const newIndex = currentImageIndex >= _count - 1 ? 0 : currentImageIndex + 1;
			setCurrentImageIndex(newIndex);
			onNextFrame();
			onFrameChange(newIndex);
		}, [_count, currentImageIndex, onFrameChange, onNextFrame]);

		const prevFrame = useCallback(() => {
			const newIndex = currentImageIndex <= 0 ? _count - 1 : currentImageIndex - 1;
			setCurrentImageIndex(newIndex);
			onPrevFrame();
			onFrameChange(newIndex);
		}, [_count, currentImageIndex, onFrameChange, onPrevFrame]);

		const nextMove = useCallback(() => {
			onNextMove();
			return inverse ? prevFrame() : nextFrame();
		}, [inverse, nextFrame, onNextMove, prevFrame]);

		const prevMove = useCallback(() => {
			onPrevMove();
			return inverse ? nextFrame() : prevFrame();
		}, [inverse, nextFrame, onPrevMove, prevFrame]);

		const rotateViewerImage = useCallback(
			(e) => {
				const interval = e.touches ? touchDragInterval : dragInterval;
				const eventX = e.touches ? Math.round(e.touches[0].clientX) : e.clientX;
				const coord = eventX - _viewerImageRef.current.offsetLeft;
				let newMoveBufffer = moveBuffer;
				if (moveBuffer.length < 2) {
					newMoveBufffer = moveBuffer.concat(coord);
				} else {
					newMoveBufffer = [moveBuffer[1], coord];
				}
				setMoveBuffer(newMoveBufffer);
				const threshold = !(coord % interval);
				const oldMove = newMoveBufffer[0];
				const newMove = newMoveBufffer[1];
				if (threshold && newMove < oldMove) {
					nextMove();
				} else if (threshold && newMove > oldMove) {
					prevMove();
				}
			},
			[dragInterval, moveBuffer, nextMove, prevMove, touchDragInterval]
		);

		const resetMoveBuffer = () => setMoveBuffer([]);

		const startDragging = useCallback(() => {
			setIsDragging(true);
			onDragStart();
		}, [onDragStart]);

		const stopDragging = useCallback(() => {
			setIsDragging(false);
			onDragEnd();
		}, [onDragEnd]);

		const toggleAutoplay = useCallback(
			(state) => {
				setIsAutoPlayRunning(state);
				return state ? onAutoplayStart() : onAutoplayStop();
			},
			[onAutoplayStart, onAutoplayStop]
		);

		const toggleRecording = (state) => {
			setIsRecording(state);
			return state ? onRecordStart(pins) : onRecordStop(pins);
		};

		// handlers
		const imageViewerMouseDownHandler = (e) => {
			if (_draggable) {
				if (e.preventDefault) e.preventDefault();
				startDragging();
				rotateViewerImage(e);
			}

			if (isAutoPlayRunning && stopAutoplayOnClick) {
				toggleAutoplay(false);
			}
		};

		const imageViewerMouseUpHandler = (e) => {
			if (_draggable) {
				if (e.preventDefault) e.preventDefault();
				stopDragging();
				resetMoveBuffer();
			}
		};

		const imageViewerMouseMoveHandler = (e) => {
			if (_draggable && isDragging) {
				rotateViewerImage(e);
			}
		};

		const imageViewerMouseLeaveHandler = () => {
			if (_draggable) resetMoveBuffer();
			if (!isAutoPlayRunning && resumeAutoplayOnMouseLeave) {
				toggleAutoplay(true);
			}
			if (mouseleaveDetect) {
				stopDragging();
				resetMoveBuffer();
			}
		};

		const imageViewerMouseEnterHandler = () => {
			if (isAutoPlayRunning && stopAutoplayOnMouseEnter) {
				toggleAutoplay(false);
			}
		};

		const imageViewerWheelHandler = useCallback(
			(e) => {
				if (mousewheel) {
					if (e.preventDefault) e.preventDefault();
					e.deltaY / 120 > 0 ? nextMove() : prevMove();
				}
			},
			[mousewheel, nextMove, prevMove]
		);

		const imageViewerTouchStartHandler = useCallback(
			(e) => {
				if (touch) {
					if (e.preventDefault) e.preventDefault();
					startDragging();
					rotateViewerImage(e);
				}

				if (isAutoPlayRunning && stopAutoplayOnClick) {
					toggleAutoplay(false);
				}
			},
			[
				isAutoPlayRunning,
				rotateViewerImage,
				startDragging,
				stopAutoplayOnClick,
				toggleAutoplay,
				touch
			]
		);

		const imageViewerTouchMoveHandler = useCallback(
			(e) => {
				if (touch) {
					if (e.preventDefault) e.preventDefault();
					rotateViewerImage(e);
				}
			},
			[rotateViewerImage, touch]
		);

		const imageViewerTouchEndHandler = useCallback(
			(e) => {
				if (touch) {
					stopDragging();
					resetMoveBuffer();
				}

				if (!isAutoPlayRunning && resumeAutoplayOnMouseLeave) {
					toggleAutoplay(true);
				}
			},
			[isAutoPlayRunning, resumeAutoplayOnMouseLeave, stopDragging, toggleAutoplay, touch]
		);

		const imageViewerClickHandler = (e) => {
			if (!isRecording) {
				const clientX = e.clientX;
				const clientY = e.clientY;
				const viewerWidth = _viewerImageRef.current.clientWidth;
				const viewerHeight = _viewerImageRef.current.clientHeight;
				const x = (clientX / viewerWidth).toFixed(6);
				const y = (clientY / viewerHeight).toFixed(6);
				const pin = { id: ViewerUtils.uid(), frameId: currentImageIndex, x, y };
				const newPins = pins.concat(pin);
				setPins(newPins);
			}
		};

		const pinDoubleClickHandler = (pin) => {
			if (isRecording) {
				const newPins = pins.filter((item) => item.id !== pin.id);
				setPins(newPins);
			}
		};

		const pinClickHandler = (pin) => {
			if (!isRecording) {
				onPinClick(pin);
			}
		};

		useEffect(() => {
			const viewerRef = _viewerImageRef.current;
			viewerRef.addEventListener('touchstart', imageViewerTouchStartHandler, {
				passive: false
			});
			viewerRef.addEventListener('touchmove', imageViewerTouchMoveHandler, {
				passive: false
			});
			viewerRef.addEventListener('touchend', imageViewerTouchEndHandler, {
				passive: false
			});
			viewerRef.addEventListener('wheel', imageViewerWheelHandler, {
				passive: false
			});

			return () => {
				viewerRef.removeEventListener('touchstart', imageViewerTouchStartHandler);
				viewerRef.removeEventListener('touchmove', imageViewerTouchMoveHandler);
				viewerRef.removeEventListener('touchend', imageViewerTouchEndHandler);
				viewerRef.removeEventListener('wheel', imageViewerWheelHandler);
			};
		}, [
			imageViewerTouchEndHandler,
			imageViewerTouchMoveHandler,
			imageViewerTouchStartHandler,
			imageViewerWheelHandler
		]);

		useEffect(() => {
			toggleAutoplay(true);
			setTimeout(function() { //Start the timer
				toggleAutoplay(false); //After 1 second, set render to true
			}.bind(this), 12000)
		},[toggleAutoplay]);

		useEffect(() => {
			if (autoplay) {
				toggleAutoplay(autoplay);
			}
		}, [autoplay, toggleAutoplay]);

		useInterval(
			() => {
				nextMove();
			},
			isAutoPlayRunning ? autoplaySpeed : null
		);

		useImperativeHandle(ref, () => ({
			toggleRecording: (state) => toggleRecording(state),
			toggleAutoplay: (state) => toggleAutoplay(state),
			next: () => nextMove(),
			prev: () => prevMove()
		}));

		// render component helpers
		const renderImages = () =>
			_images.map((src, index) => (
				<Img
					zoom={zoom}
					key={index}
					src={src}
					className={`${styles['viewer-viewer-image']} ${
						currentImageIndex === index
							? styles['viewer-viewer-image-shown']
							: styles['viewer-viewer-image-hidden']
					}`}
					alt=""
				/>
			));

		const renderHint = () => (
			<div className={`${styles['viewer-hint-overlay']}`} onClick={hideHint} onTouchStart={hideHint}>
                <div className={`${styles['drag-guide']}`}>
                    <img src={staticImage.DRAG} className={`${styles['drag-image']}`} alt="" />
                    <p>DRAG TO VIEW 360&deg; WALKAROUND</p>
                </div>
            </div>
		);

		const generateViewerClassName = () => {
			let classNameStr = styles['viewer-viewer'];
			if (_draggable) classNameStr += ' ' + styles['viewer-draggable-true'];
			if (isRecording) classNameStr += ' ' + styles['viewer-recording-true'];
			if (touch) classNameStr += ' ' + styles['viewer-touch-true'];
			if (mousewheel) classNameStr += ' ' + styles['viewer-mousewheel-true'];
			if (hintOnStartup) classNameStr += ' ' + styles['viewer-hintOnStartup-true'];
			if (className) classNameStr += ' ' + className;
			if(isFullScreen) classNameStr += ' ' + styles['viewer-full-screen'];
			return classNameStr;
		};

		if (!ViewerUtils.isValidProps({ images, format, location })) return null;

		return (
			<>
			<ImgContainer
				zoomHeight={isFullScreen? window.innerHeight : 'auto'}
				className={generateViewerClassName()}
				ref={_viewerImageRef}
				onMouseDown={imageViewerMouseDownHandler}
				onMouseUp={imageViewerMouseUpHandler}
				onMouseMove={imageViewerMouseMoveHandler}
				onMouseLeave={imageViewerMouseLeaveHandler}
				onMouseEnter={imageViewerMouseEnterHandler}
				onClick={imageViewerClickHandler}
			>
				{hintVisible && renderHint()}
				{_images?.length > 0 && renderImages()}
				{!isMobile && showControlBar && (
					<ControlBar
						onPlay={() => toggleAutoplay(true)}
						onPause={() => toggleAutoplay(false)}
						onNext={() => nextMove()}
						onPrev={() => prevMove()}
						onZoomIn={() => rangePlus()}
						onZoomOut={() => rangeMinus()}
						onFullScreen={() => toggleFullScreen()}
						onRecordStart={() => toggleRecording(true)}
						onRecordStop={() => toggleRecording(false)}
					/>
				)}
				{!isFullScreen && <Pins
					pins={pinss}
					viewerWidth={_viewerImageRef?.current?.clientWidth}
					viewerHeight={_viewerImageRef?.current?.clientHeight}
					currentFrameId={currentImageIndex}
					onPinDoubleClick={pinDoubleClickHandler}
					onPinClick={pinClickHandler}
					renderPin={renderPin}
					isFullScreen={isFullScreen}
				/>}
			</ImgContainer>
			{isMobile && showControlBar && (
					<ControlBar
						onPlay={() => toggleAutoplay(true)}
						onPause={() => toggleAutoplay(false)}
						onNext={() => nextMove()}
						onPrev={() => prevMove()}
						onZoomIn={() => rangePlus()}
						onZoomOut={() => rangeMinus()}
						onFullScreen={() => toggleFullScreen()}
						onRecordStart={() => toggleRecording(true)}
						onRecordStop={() => toggleRecording(false)}
					/>
				)}
			</>
		);
	}
);

Viewer.propTypes = {
	className: PropTypes.string,
	style: PropTypes.object,
	images: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
	pins: PropTypes.array,
	format: PropTypes.string,
	location: PropTypes.string,
	count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	draggable: PropTypes.bool,
	hintOnStartup: PropTypes.bool,
	hintText: PropTypes.string,
	autoplay: PropTypes.bool,
	autoplaySpeed: PropTypes.number,
	stopAutoplayOnClick: PropTypes.bool,
	stopAutoplayOnMouseEnter: PropTypes.bool,
	resumeAutoplayOnMouseLeave: PropTypes.bool,
	touch: PropTypes.bool,
	mousewheel: PropTypes.bool,
	inverse: PropTypes.bool,
	dragInterval: PropTypes.number,
	touchDragInterval: PropTypes.number,
	mouseleaveDetect: PropTypes.bool,
	showControlBar: PropTypes.bool,

	renderPin: PropTypes.func,

	onHintHide: PropTypes.func,
	onAutoplayStart: PropTypes.func,
	onAutoplayStop: PropTypes.func,
	onNextMove: PropTypes.func,
	onPrevMove: PropTypes.func,
	onNextFrame: PropTypes.func,
	onPrevFrame: PropTypes.func,
	onDragStart: PropTypes.func,
	onDragEnd: PropTypes.func,
	onFrameChange: PropTypes.func,
	onRecordStart: PropTypes.func,
	onRecordStop: PropTypes.func,
	onPinClick: PropTypes.func
};

Viewer.defaultProps = {
	className: undefined,
	style: undefined,
	images: 'numbered',
	pin: undefined,
	format: undefined,
	location: './images',
	count: undefined,
	draggable: true,
	hintOnStartup: true,
	hintText: null,
	autoplay: false,
	autoplaySpeed: 50,
	stopAutoplayOnClick: false,
	stopAutoplayOnMouseEnter: false,
	resumeAutoplayOnMouseLeave: false,
	touch: true,
	mousewheel: false,
	inverse: true,
	dragInterval: 1,
	touchDragInterval: 2,
	mouseleaveDetect: false,
	showControlBar: false,

	renderPin: undefined,

	onHintHide: () => {},
	onAutoplayStart: () => {},
	onAutoplayStop: () => {},
	onNextMove: () => {},
	onPrevMove: () => {},
	onNextFrame: () => {},
	onPrevFrame: () => {},
	onDragStart: () => {},
	onDragEnd: () => {},
	onFrameChange: () => {},
	onRecordStart: () => {},
	onRecordStop: () => {},
	onPinClick: () => {}
};

const ImgContainer = styled.div`
	height: ${props => props.zoomHeight}px;
`

const Img = styled.img`
	transform: scale(${props => props.zoom || 1});
`

export default Viewer;
