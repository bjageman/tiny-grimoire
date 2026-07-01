import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * Reproduces GrimoireBoard's superellipse seating layout (board sizing,
 * token sizing, and per-seat angle/position math) so other screens can
 * arrange players in the same circle without duplicating the live board's
 * fan-out/reminder logic.
 */
export function useGrimoireLayout(playerCount: number) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardAspect, setBoardAspect] = useState(1.3);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const updateAspect = () => {
      const rect = boardElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBoardAspect(rect.height / rect.width);
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

    if (count <= 6) {
      return {
        boardClass: "w-[88vw] h-[112vw] max-w-[680px] max-h-[760px] md:w-[680px] md:h-[500px] landscape:max-h-[500px] rounded-[28px]",
        radiusX: 38,
        radiusY: 36,
        btnStyle: isDesktop
          ? { width: '140px', height: '140px' } as CSSProperties
          : { width: '30cqw', height: '30cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: '23.5px', maxWidth: '130px', marginTop: '2.8px' } as CSSProperties
          : { fontSize: '4.8cqw', maxWidth: '28cqw', marginTop: '0.5cqw' } as CSSProperties,
      };
    } else if (count <= 10) {
      return {
        boardClass: "w-[90vw] h-[118vw] max-w-[680px] max-h-[760px] md:w-[680px] md:h-[500px] landscape:max-h-[500px] rounded-[34px]",
        radiusX: 40,
        radiusY: 38,
        btnStyle: isDesktop
          ? { width: '130px', height: '130px' } as CSSProperties
          : { width: '26cqw', height: '26cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: '22.3px', maxWidth: '118px', marginTop: '2.5px' } as CSSProperties
          : { fontSize: '4.3cqw', maxWidth: '24cqw', marginTop: '0.4cqw' } as CSSProperties,
      };
    } else {
      return {
        boardClass: "w-[92vw] h-[124vw] max-w-[680px] max-h-[820px] md:w-[680px] md:h-[500px] landscape:max-h-[500px] rounded-[40px]",
        radiusX: 42,
        radiusY: 40,
        btnStyle: isDesktop
          ? { width: '112px', height: '112px' } as CSSProperties
          : { width: '21cqw', height: '21cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: '20.4px', maxWidth: '102px', marginTop: '2.0px' } as CSSProperties
          : { fontSize: '3.7cqw', maxWidth: '19cqw', marginTop: '0.3cqw' } as CSSProperties,
      };
    }
  }, [playerCount, boardAspect]);

  const dynamicRadiusX = grimoireConfig.radiusX;
  const dynamicRadiusY = useMemo(() => {
    return boardAspect < 1.15 ? grimoireConfig.radiusY * 0.92 : grimoireConfig.radiusY;
  }, [grimoireConfig.radiusY, boardAspect]);

  const evenAngles = useMemo(() => {
    const total = playerCount;
    if (total <= 1) return [0];

    const rx = dynamicRadiusX;
    const ry = dynamicRadiusY * boardAspect;

    const n = 3.6;
    const p = 2 / n;

    const steps = 360;
    const arcLengths = new Float32Array(steps + 1);
    let totalLength = 0;
    arcLengths[0] = 0;

    for (let i = 1; i <= steps; i++) {
      const theta1 = ((i - 1) * (360 / steps)) * (Math.PI / 180);
      const theta2 = (i * (360 / steps)) * (Math.PI / 180);
      const midTheta = (theta1 + theta2) / 2;

      const dt = 0.0001;
      const tA = midTheta - dt / 2;
      const tB = midTheta + dt / 2;

      const xA = rx * Math.sign(Math.cos(tA)) * Math.pow(Math.abs(Math.cos(tA)), p);
      const yA = ry * Math.sign(Math.sin(tA)) * Math.pow(Math.abs(Math.sin(tA)), p);

      const xB = rx * Math.sign(Math.cos(tB)) * Math.pow(Math.abs(Math.cos(tB)), p);
      const yB = ry * Math.sign(Math.sin(tB)) * Math.pow(Math.abs(Math.sin(tB)), p);

      const dx = (xB - xA) / dt;
      const dy = (yB - yA) / dt;
      const ds = Math.sqrt(dx * dx + dy * dy) * (2 * Math.PI / steps);
      totalLength += ds;
      arcLengths[i] = totalLength;
    }

    const startIdx = Math.round(steps / 4);
    const startLength = arcLengths[startIdx];

    const angles: number[] = [];
    const targetStep = totalLength / total;

    for (let i = 0; i < total; i++) {
      const targetLength = (startLength + i * targetStep) % totalLength;
      let idx = 0;
      while (idx < steps && arcLengths[idx + 1] < targetLength) {
        idx++;
      }
      const l1 = arcLengths[idx];
      const l2 = arcLengths[idx + 1];
      const fraction = (l2 - l1) > 0 ? (targetLength - l1) / (l2 - l1) : 0;
      const t1 = (idx * (360 / steps)) * (Math.PI / 180);
      const t2 = ((idx + 1) * (360 / steps)) * (Math.PI / 180);
      angles.push(t1 + fraction * (t2 - t1));
    }

    return angles;
  }, [playerCount, dynamicRadiusX, dynamicRadiusY, boardAspect]);

  const positions = useMemo(() => {
    const n = 3.6;
    const pExponent = 2 / n;
    return evenAngles.map((angle) => {
      const cosVal = Math.cos(angle);
      const sinVal = Math.sin(angle);
      return {
        left: 50 + dynamicRadiusX * Math.sign(cosVal) * Math.pow(Math.abs(cosVal), pExponent),
        top: 50 + dynamicRadiusY * Math.sign(sinVal) * Math.pow(Math.abs(sinVal), pExponent),
      };
    });
  }, [evenAngles, dynamicRadiusX, dynamicRadiusY]);

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
    boardClass: grimoireConfig.boardClass,
    btnStyle: grimoireConfig.btnStyle,
    nameStyle: grimoireConfig.nameStyle,
    positions,
    getDynamicFontSize,
  };
}
