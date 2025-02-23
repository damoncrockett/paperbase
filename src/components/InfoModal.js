import React, { useEffect, useRef } from 'react';

export default function InfoModal({ show, onClose, modalSequence, currentStep, onNextStep, onPrevStep, isDragging }) {
  
  const modalRef = useRef(null);

  useEffect(() => {
    if (show && modalSequence[currentStep] && modalRef.current) {
      const positionModal = () => {
        const targetElement = document.getElementById(modalSequence[currentStep].targetId);
        if (targetElement) {
          const targetRect = targetElement.getBoundingClientRect();
          const modalRect = modalRef.current.getBoundingClientRect();
          
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          const spaceAbove = targetRect.top;
          const spaceBelow = viewportHeight - targetRect.bottom;
          const spaceLeft = targetRect.left;
          const spaceRight = viewportWidth - targetRect.right;

          let top, left;

          if (spaceBelow >= modalRect.height + 10) {
            top = targetRect.bottom + 10;
          } else if (spaceAbove >= modalRect.height + 10) {
            top = targetRect.top - modalRect.height - 10;
          } else {
            top = Math.max(10, (viewportHeight - modalRect.height) / 2);
          }

          if (spaceRight >= modalRect.width + 10) {
            left = targetRect.right + 10;
          } else if (spaceLeft >= modalRect.width + 10) {
            left = targetRect.left - modalRect.width - 10;
          } else {
            left = Math.max(10, (viewportWidth - modalRect.width) / 2);
          }

          modalRef.current.style.top = `${top}px`;
          modalRef.current.style.left = `${left}px`;
        }
      };

      positionModal();
      setTimeout(positionModal, 0);
    }
  }, [show, currentStep, modalSequence]);

  const currentModal = modalSequence[currentStep];

  return (
    <div 
      id='infomodal'
      className={isDragging ? 'noPointerEvents' : ''}
      ref={modalRef} 
      style={{
        visibility: show ? 'visible' : 'hidden',
        borderRadius: currentModal.borderRadius,
      }}
    >
      <div className='infomodal-nav'>
        <h3>{currentModal.headline}</h3>
        <h3 style={{fontWeight: '400'}}>{currentStep + 1} / {modalSequence.length}</h3>
        <button onClick={onPrevStep} className='material-icons' disabled={currentStep === 0}>navigate_before</button>
        <button onClick={onNextStep} className='material-icons' disabled={currentStep === modalSequence.length - 1}>navigate_next</button>
        <button id='infomodal-close' onClick={onClose}>&times;</button>
      </div>
      <div 
        className='infomodal-content'
        dangerouslySetInnerHTML={{ __html: currentModal.content }}
      />
    </div>
  );
}