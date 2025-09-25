import React, { useRef, useState, useCallback, useLayoutEffect, useMemo } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number; // fixed row height (simplified)
  columnCount: number; // fixed column count
  gap?: number;
  overscan?: number;
  className?: string;
  style?: React.CSSProperties;
  empty?: React.ReactNode;
}

// Simple windowed grid virtualization (row-based). Assumes uniform height per cell.
export function VirtualizedGrid<T>({
  items,
  renderItem,
  itemHeight,
  columnCount,
  gap = 8,
  overscan = 3,
  className,
  style,
  empty
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const totalRows = Math.ceil(items.length / columnCount);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    setScrollTop(containerRef.current.scrollTop);
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const resize = () => setViewportHeight(el.clientHeight);
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { startIndex, endIndex, startOffset } = useMemo(() => {
    const rowHeight = itemHeight + gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRows = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
    const endRow = Math.min(totalRows - 1, startRow + visibleRows);
    const startIndex = startRow * columnCount;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columnCount - 1);
    return { startIndex, endIndex, startOffset: startRow * rowHeight };
  }, [scrollTop, viewportHeight, itemHeight, gap, columnCount, totalRows, overscan, items.length]);

  const slice = items.slice(startIndex, endIndex + 1);

  if (items.length === 0 && empty) return <>{empty}</>;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', overflowY: 'auto', willChange: 'transform', ...style }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startOffset, left: 0, right: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              gap
            }}
          >
            {slice.map((item, localIdx) => {
              const realIndex = startIndex + localIdx;
              return <React.Fragment key={(item as any).id || realIndex}>{renderItem(item, realIndex)}</React.Fragment>; 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualizedGrid;
