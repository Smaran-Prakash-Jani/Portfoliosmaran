import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkBadge01Icon, FingerPrintIcon } from '@hugeicons/core-free-icons';
import ReflectiveCard from './reactbits/ReflectiveCard';

/** The resume's metal ID card: brushed graphite steel under a soft studio light, with the photo on it. */
export default function ResumeIdCard() {
  return (
    <ReflectiveCard
      width="100%"
      height="100%"
      radius={22}
      tint="#f1ecff"
      metalness={1}
      roughness={0.32}
      blurStrength={7}
      shine={0.9}
      glare={0.55}
      tiltStrength={10}
      statusColor="#a78bfa"
    >
      <div className="reflective-card__header">
        <span className="reflective-card__badge">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} strokeWidth={1.8} />
          Verified
        </span>
        <span className="reflective-card__status">
          <span className="reflective-card__dot" />
          Available
        </span>
      </div>

      {/* the whole photo stands on the card (never cropped), fading out towards the name */}
      <div className="relative mt-3 min-h-0 flex-1">
        <img
          src="/portrait-card.webp"
          alt="Smaran Prakash Jani"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain object-bottom [mask-image:linear-gradient(to_bottom,#000_70%,transparent_99%)]"
        />
      </div>

      <div className="reflective-card__identity" style={{ marginTop: 10 }}>
        <h3 className="reflective-card__name">Smaran Prakash Jani</h3>
        <p className="reflective-card__role">CS Student / Developer</p>
      </div>
      <div className="reflective-card__footer" style={{ marginTop: 16 }}>
        <div className="reflective-card__id">
          <span className="reflective-card__label">ID number</span>
          <span className="reflective-card__value">SPJ-01 · 2026</span>
        </div>
        <span className="reflective-card__tile">
          <HugeiconsIcon icon={FingerPrintIcon} size={22} strokeWidth={1.6} />
        </span>
      </div>
    </ReflectiveCard>
  );
}
