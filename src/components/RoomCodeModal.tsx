import { useState } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { cn } from '../utils/cn';

interface RoomCodeModalProps {
  gameCode: string;
  joinUrl: string;
  onClose: () => void;
  isLightModeActive: boolean;
  syncOnly?: boolean;
}

export default function RoomCodeModal({ gameCode, joinUrl, onClose, isLightModeActive, syncOnly = false }: RoomCodeModalProps) {
  useScrollLock();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSuccess = (which: 'url' | 'code') => {
    if (which === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const fallbackCopy = (text: string, which: 'url' | 'code') => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        handleSuccess(which);
      } else {
        console.error('Fallback copy command was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
  };

  const copy = (text: string, which: 'url' | 'code') => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => handleSuccess(which))
        .catch(err => {
          console.error('Failed to copy text: ', err);
          fallbackCopy(text, which);
        });
    } else {
      fallbackCopy(text, which);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-xs rounded-xl shadow-2xl p-5 space-y-4',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20 text-gray-800'
            : 'bg-gray-900 border border-gray-800 text-gray-100'
        )}
        onClick={e => e.stopPropagation()}
      >
        {!syncOnly ? (
          <div className="text-center">
            <p className={cn('text-xs font-semibold uppercase tracking-widest mb-0.5', isLightModeActive ? 'text-gray-400' : 'text-gray-500')}>
              Room Code
            </p>
            <p className="text-3xl font-mono font-bold tracking-widest text-clocktower-blood">
              {gameCode}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-display font-bold uppercase tracking-wider text-clocktower-blood">
              Sync Other Device
            </p>
            <p className={cn('text-[11px] font-medium mt-0.5 leading-relaxed', isLightModeActive ? 'text-gray-500' : 'text-gray-450')}>
              Scan with your phone to sync as storyteller controller
            </p>
          </div>
        )}

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-lg">
            <QRCode value={joinUrl} size={160} />
          </div>
        </div>

        {/* Copy buttons */}
        <div className="space-y-2">
          <button
            onClick={() => copy(joinUrl, 'url')}
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm font-semibold border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            )}
          >
            {copiedUrl ? '✓ Copied!' : 'Copy Join URL'}
          </button>
          {!syncOnly && (
            <button
              onClick={() => copy(gameCode, 'code')}
              className={cn(
                'w-full px-3 py-2 rounded-md text-sm font-semibold border transition-colors',
                isLightModeActive
                  ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              )}
            >
              {copiedCode ? '✓ Copied!' : 'Copy Code'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
