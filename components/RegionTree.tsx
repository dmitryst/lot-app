// app/components/RegionTree.tsx
'use client';

import React, { useState } from 'react';
import styles from './CategoryTree.module.css';

type RegionNode = {
  name: string;
  children?: RegionNode[];
};

type Props = {
  regions: RegionNode[];
  selectedRegions: string[];
  onChange: (selected: string[]) => void;
};

export default function RegionTree({ regions, selectedRegions, onChange }: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const handleParentChange = (parent: RegionNode) => {
    const childNames = parent.children?.map(c => c.name) || [];
    const allChildrenSelected = childNames.every(name => selectedRegions.includes(name));

    let newSelected: string[];
    if (allChildrenSelected) {
      // Если все выбраны - снимаем выбор со всех
      newSelected = selectedRegions.filter(name => !childNames.includes(name));
    } else {
      // Если не все выбраны - выбираем всех, кого еще нет
      newSelected = [...new Set([...selectedRegions, ...childNames])];
    }
    onChange(newSelected);

    // Если мы только что выбрали всех детей (т.е. allChildrenSelected был false),
    // и узел при этом был свернут, то мы его разворачиваем.
    if (!allChildrenSelected && !expanded.includes(parent.name)) {
      setExpanded(prev => [...prev, parent.name]);
    }
  };

  const handleChildChange = (childName: string) => {
    const newSelected = selectedRegions.includes(childName)
      ? selectedRegions.filter(name => name !== childName)
      : [...selectedRegions, childName];
    onChange(newSelected);
  };
  
  const toggleExpand = (parentName: string) => {
    setExpanded(prev => 
      prev.includes(parentName) ? prev.filter(n => n !== parentName) : [...prev, parentName]
    );
  };

  return (
    <div className={styles.container}>
      {regions.map(parent => {
        const childNames = parent.children?.map(c => c.name) || [];
        const allChildrenSelected = childNames.length > 0 && childNames.every(name => selectedRegions.includes(name));
        const someChildrenSelected = childNames.length > 0 && childNames.some(name => selectedRegions.includes(name)) && !allChildrenSelected;

        return (
          <div key={parent.name} className={styles.parent}>
            <div className={styles.parentHeader}>
              <input
                type="checkbox"
                checked={allChildrenSelected}
                ref={input => {
                  if (input) input.indeterminate = someChildrenSelected;
                }}
                onChange={() => handleParentChange(parent)}
                disabled={!parent.children || parent.children.length === 0}
              />
              <span onClick={() => toggleExpand(parent.name)} className={styles.parentName}>
                {parent.name}
              </span>
            </div>
            {expanded.includes(parent.name) && parent.children && (
              <div className={styles.children}>
                {parent.children.map(child => (
                  <div key={child.name} className={styles.child}>
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(child.name)}
                      onChange={() => handleChildChange(child.name)}
                    />
                    <label>{child.name}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
