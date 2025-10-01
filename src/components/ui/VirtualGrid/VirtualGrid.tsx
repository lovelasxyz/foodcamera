import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  rowHeight: number;
  columnsCount: number;
  containerHeight: number;
  overscanRows?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gridClassName?: string;
  gap?: number;
}

/**
 * Virtual scroll grid component with windowing
 * Only renders visible rows + overscan buffer
 * Optimized for grid layouts (inventory with 2 columns)
 *
 * Clean Architecture: Presentation Layer - UI Component
 * Follows Single Responsibility: only handles virtual scrolling
 *
 * @example
 * <VirtualGrid
 *   items={inventory}
 *   rowHeight={180}
 *   columnsCount={2}
 *   containerHeight={600}
 *   overscanRows={2}
 *   renderItem={(item) => <InventoryCard item={item} />}
 * />
 */
export function VirtualGrid<T>({
  items,
  rowHeight,
  columnsCount,
  containerHeight,
  overscanRows = 2,
  renderItem,
  className = '',
  gridClassName = '',
  gap = 0
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const totalRows = Math.ceil(items.length / columnsCount);
  const totalHeight = totalRows * rowHeight + (totalRows - 1) * gap;

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / (rowHeight + gap)) - overscanRows);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / (rowHeight + gap)) + overscanRows
  );

  const startIndex = startRow * columnsCount;
  const endIndex = Math.min(items.length - 1, (endRow + 1) * columnsCount - 1);
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startRow * (rowHeight + gap);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // Reset scroll on items change
  useEffect(() => {
    if (containerRef.current && items.length === 0) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className={className}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          className={gridClassName}
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
            gap: gap
          }}
        >
          {visibleItems.map((item, i) => (
            <React.Fragment key={startIndex + i}>
              {renderItem(item, startIndex + i)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
