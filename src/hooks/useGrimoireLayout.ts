import { useEffect, useMemo, useRef, useState } from 'react';
import { superellipseSeatAngles, superellipsePosition } from '../utils/superellipse';
import type { CSSProperties } from 'react';

/** Reproduces GrimoireBoard's superellipse seating math so other screens arrange players in the same circle. */
/** Width the desktop token/name pixel sizes below were hand-tuned against (`max-w-[680px]`). */
const BOARD_BASELINE_WIDTH = 680;

export function useGrimoireLayout(playerCount: number) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardAspect, setBoardAspect] = useState(1.3);
  const [boardWidth, setBoardWidth] = useState(BOARD_BASELINE_WIDTH);
  const [isMeasured, setIsMeasured] = useState(false);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const updateAspect = () => {
      const rect = boardElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBoardAspect(rect.height / rect.width);
        setBoardWidth(rect.width);
        setIsMeasured(true);
      }
    };

    updateAspect();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateAspect);
      return () => window.removeEventListener('resize', updateAspect);
    }

    const observer = new ResizeObserver(() => updateAspect());
    observer.observe(boardElement);
    return () => observer.disconnect();
  }, []);

  const grimoireConfig = useMemo(() => {
    const count = playerCount;
    const isDesktop = boardAspect < 1.15;

    // Desktop sizes are px tuned for a 680px board; scale down when the actual board is narrower or tokens overhang.
    const s = boardWidth > 0 ? Math.min(1, boardWidth / BOARD_BASELINE_WIDTH) : 1;
    const px = (v: number) => `${+(v * s).toFixed(2)}px`;

    if (count <= 6) {
      return {
        boardClass: "w-[88vw] h-[112vw] max-w-[680px] max-h-[760px] md:w-full md:h-[500px] landscape:max-h-[500px] rounded-[28px]",
        radiusX: 38,
        radiusY: 36,
        btnStyle: isDesktop
          ? { width: px(140), height: px(140) } as CSSProperties
          : { width: '30cqw', height: '30cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: px(23.5), maxWidth: px(130), marginTop: px(2.8) } as CSSProperties
          : { fontSize: '4.8cqw', maxWidth: '28cqw', marginTop: '0.5cqw' } as CSSProperties,
      };
    } else if (count <= 10) {
      return {
        boardClass: "w-[90vw] h-[118vw] max-w-[680px] max-h-[760px] md:w-full md:h-[500px] landscape:max-h-[500px] rounded-[34px]",
        radiusX: 40,
        radiusY: 38,
        btnStyle: isDesktop
          ? { width: px(130), height: px(130) } as CSSProperties
          : { width: '26cqw', height: '26cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: px(22.3), maxWidth: px(118), marginTop: px(2.5) } as CSSProperties
          : { fontSize: '4.3cqw', maxWidth: '24cqw', marginTop: '0.4cqw' } as CSSProperties,
      };
    } else {
      return {
        boardClass: "w-[92vw] h-[124vw] max-w-[680px] max-h-[820px] md:w-full md:h-[500px] landscape:max-h-[500px] rounded-[40px]",
        radiusX: 42,
        radiusY: 40,
        btnStyle: isDesktop
          ? { width: px(112), height: px(112) } as CSSProperties
          : { width: '21cqw', height: '21cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: px(20.4), maxWidth: px(102), marginTop: px(2.0) } as CSSProperties
          : { fontSize: '3.7cqw', maxWidth: '19cqw', marginTop: '0.3cqw' } as CSSProperties,
      };
    }
  }, [playerCount, boardAspect, boardWidth]);

  const dynamicRadiusX = grimoireConfig.radiusX;
  const dynamicRadiusY = useMemo(() => {
    return boardAspect < 1.15 ? grimoireConfig.radiusY * 0.92 : grimoireConfig.radiusY;
  }, [grimoireConfig.radiusY, boardAspect]);

  const evenAngles = useMemo(
    () => superellipseSeatAngles(playerCount, dynamicRadiusX, dynamicRadiusY, boardAspect),
    [playerCount, dynamicRadiusX, dynamicRadiusY, boardAspect],
  );

  const positions = useMemo(
    () => evenAngles.map(a => superellipsePosition(a, dynamicRadiusX, dynamicRadiusY)),
    [evenAngles, dynamicRadiusX, dynamicRadiusY],
  );

  const getDynamicFontSize = (name: string) => {
    const baseFontSizeVal = parseFloat(grimoireConfig.nameStyle.fontSize as string);
    const baseFontSizeUnit = (grimoireConfig.nameStyle.fontSize as string).replace(/[0-9.]/g, '');
    const nameLength = name.length;
    const longestWordLength = Math.max(...name.split(' ').map(w => w.length));

    let scaleFactor = 1.0;
    if (longestWordLength > 12) scaleFactor = 0.55;
    else if (longestWordLength > 10) scaleFactor = 0.65;
    else if (longestWordLength > 8) scaleFactor = 0.75;
    else if (longestWordLength > 6) scaleFactor = 0.86;

    if (nameLength > 18) scaleFactor = Math.min(scaleFactor, 0.55);
    else if (nameLength > 14) scaleFactor = Math.min(scaleFactor, 0.65);
    else if (nameLength > 10) scaleFactor = Math.min(scaleFactor, 0.78);
    else if (nameLength > 8) scaleFactor = Math.min(scaleFactor, 0.9);

    return `${baseFontSizeVal * scaleFactor}${baseFontSizeUnit}`;
  };

  return {
    boardRef,
    isMeasured,
    boardClass: grimoireConfig.boardClass,
    btnStyle: grimoireConfig.btnStyle,
    nameStyle: grimoireConfig.nameStyle,
    positions,
    getDynamicFontSize,
  };
}
