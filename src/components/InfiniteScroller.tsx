"use client";

import React, { useEffect, useRef } from 'react';
import './InfiniteScroller.css';

interface ScrollerProps {
  items: {
    icon: React.ElementType;
    title: string;
    description?: string;
  }[];
  direction?: 'left' | 'right';
  speed?: 'fast' | 'slow';
}

const InfiniteScroller: React.FC<ScrollerProps> = ({ items, direction = 'left', speed = 'fast' }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.setAttribute('data-animated', 'true');

      const scrollerInner = scroller.querySelector('.scroller__inner');
      if (scrollerInner) {
        const scrollerContent = Array.from(scrollerInner.children);

        scrollerContent.forEach(item => {
          const duplicatedItem = item.cloneNode(true) as HTMLElement;
          duplicatedItem.setAttribute('aria-hidden', 'true');
          scrollerInner.appendChild(duplicatedItem);
        });
      }
    }
  }, []);

  return (
    <div ref={scrollerRef} className="scroller" data-direction={direction} data-speed={speed}>
      <ul className="tag-list scroller__inner">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <item.icon className="w-5 h-5 mr-2" />
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfiniteScroller;
