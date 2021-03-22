import React from 'react';
import styles from './styles.module.css';

const Pins = ({
	pins,
	viewerWidth,
	viewerHeight,
	currentFrameId,
	pinWidth,
	pinHeight,
	renderPin,
	onPinDoubleClick,
	onPinClick,
	isFullScreen
}) => {
	const getPosition = (pin) => {
		let top, left;
		if(!isFullScreen) {
			left = (viewerWidth * pin.x - pinWidth / 2)+3;
		} else {
			left = viewerWidth * pin.x - pinWidth / 2;
		}
		if(!isFullScreen) {
			top = (viewerHeight * pin.y - pinHeight / 2) - 162;
		} else {
			top = viewerHeight * pin.y - pinHeight / 2;
		}
		if (left < 0) left = 0;
		if (top < 0) top = 0;
		if (left >= 0 && top >= 0) return { left, top };
		return { left, top };
	};
	return (
		<div className="Viewer-dots-wrapper">
			{pins?.length > 0 &&
				pins
					.filter((pin) => pin.frameId === currentFrameId)
					.map((pin, index) =>
						renderPin ? (
							<div
								key={index}
								className={`${styles['Viewer-pin']}`}
								style={getPosition(pin)}
								onDoubleClick={(e) => {
									e.stopPropagation();
									onPinDoubleClick(pin);
								}}
								onClick={(e) => {
									e.stopPropagation();
									onPinClick(pin);
								}}
							>
								{renderPin(pin)}
							</div>
						) : (
							<div
								key={index}
								className={`${styles['Viewer-dot']}`}
								style={getPosition(pin)}
								onDoubleClick={(e) => {
									e.stopPropagation();
									onPinDoubleClick(pin);
								}}
								onClick={(e) => {
									e.stopPropagation();
									onPinClick(pin);
								}}
							/>
						)
					)}
		</div>
	);
};

Pins.defaultProps = {
	pins: [],
	pinWidth: 20,
	pinHeight: 20,
	onDoubleClick: () => {},
	onPinClick: () => {}
};

export default Pins;
