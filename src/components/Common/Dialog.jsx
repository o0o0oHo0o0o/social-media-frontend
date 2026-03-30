import React from 'react';
import { createPortal } from 'react-dom';
import '../../styles/dialog.css';

export default function Dialog({ open, title, children, onClose, actions, className = '', backdropClassName = '' }) {
  if (!open) return null;
  const themeClass =
    typeof document !== 'undefined'
      ? document.querySelector('.app.light')
        ? 'dialog-theme-light'
        : document.querySelector('.app.dark')
          ? 'dialog-theme-dark'
          : ''
      : '';

  const dialogNode = (
    <div className={`dialog-backdrop ${themeClass} ${backdropClassName}`.trim()} onClick={onClose}>
      <div className={`dialog ${themeClass} ${className}`.trim()} onClick={e => e.stopPropagation()}>
        {title ? <div className="dialog-title">{title}</div> : null}
        <div className="dialog-content">{children}</div>
        <div className="dialog-actions">
          {actions}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return dialogNode;
  }

  return createPortal(dialogNode, document.body);
}
