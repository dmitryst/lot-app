'use client';
import { useState, ReactNode } from 'react';
import styles from './Accordion.module.css';

// Иконка-шеврон для индикации
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    className={styles.chevron}
    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

interface AccordionProps {
  title: string;
  children: ReactNode;
}

export default function Accordion({ title, children }: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.accordion}>
      <div className={styles.header} onClick={toggleAccordion}>
        <b>{title}</b>
        <ChevronIcon isExpanded={isExpanded} />
      </div>
      {isExpanded && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
