import { theme } from 'antd';
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  type GoalProgressChart as GoalProgressChartData,
  type GoalProgressPoint,
  progressAt,
} from '../../domain/goal-progress-chart';
import {
  PROJECT_PROGRESS_MAX,
  type ProjectGoal,
} from '../../domain/project.schema';
import {
  type GoalSeriesStyle,
  useGoalSeriesStyle,
} from './goal-progress-series';

type ProjectGoalType = ProjectGoal['goal'];

const FALLBACK_WIDTH = 640;
const NARROW_WIDTH = 576;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 48 };
const Y_TICKS = [0, 25, 50, 75, 100];
const DAY_MS = 86_400_000;
const MIN_UNKNOWN_LABEL_WIDTH = 96;

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const useElementWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, width: width && width > 0 ? width : FALLBACK_WIDTH };
};

const tickFormatOptions = (
  from: number,
  to: number,
): Intl.DateTimeFormatOptions => {
  if (to - from <= 2 * DAY_MS) {
    return {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    };
  }

  return new Date(from).getFullYear() === new Date(to).getFullYear()
    ? { day: '2-digit', month: 'short' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
};

export const GoalSeriesSwatch = ({ color, dash }: GoalSeriesStyle) => (
  <svg width={24} height={8} aria-hidden focusable={false}>
    <line
      x1={1}
      y1={4}
      x2={23}
      y2={4}
      stroke={color}
      strokeWidth={2}
      strokeDasharray={dash}
      strokeLinecap="round"
    />
  </svg>
);

interface GoalProgressChartProps {
  chart: GoalProgressChartData;
  hiddenGoals: ReadonlySet<ProjectGoalType>;
}

export const GoalProgressChart = ({
  chart,
  hiddenGoals,
}: GoalProgressChartProps) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();
  const styleOf = useGoalSeriesStyle();
  const patternId = `goal-progress-unknown-${useId().replace(/[^\w-]/g, '')}`;
  const { ref, width } = useElementWidth();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const narrow = width < NARROW_WIDTH;
  const height = narrow ? 220 : 300;
  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 1);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const span = Math.max(chart.to - chart.from, 1);
  const x = (time: number) =>
    MARGIN.left + ((time - chart.from) / span) * plotWidth;
  const y = (progress: number) =>
    MARGIN.top + (1 - progress / PROJECT_PROGRESS_MAX) * plotHeight;

  const formatDateTime = (time: number) =>
    new Date(time).toLocaleString(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  const tickFormat = new Intl.DateTimeFormat(
    i18n.language,
    tickFormatOptions(chart.from, chart.to),
  );
  const tickCount = narrow ? 3 : 5;
  const xTicks = Array.from({ length: tickCount }, (_, index) => {
    const time =
      chart.from + ((chart.to - chart.from) * index) / (tickCount - 1);
    return { time, label: tickFormat.format(time) };
  }).filter(
    ({ label }, index, ticks) =>
      index === 0 || ticks[index - 1].label !== label,
  );

  const visibleLines = chart.lines.filter(({ goal }) => !hiddenGoals.has(goal));
  const lastIndex = chart.instants.length - 1;
  const currentIndex =
    activeIndex === null ? null : Math.min(activeIndex, lastIndex);
  const activeTime =
    currentIndex === null ? null : (chart.instants[currentIndex] ?? null);
  const activeValues =
    activeTime === null
      ? []
      : visibleLines.flatMap((line) => {
          const progress = progressAt(line, activeTime);
          return progress === null ? [] : [{ goal: line.goal, progress }];
        });

  const stepPath = (points: GoalProgressPoint[]) =>
    points
      .map(({ time, progress }, index) =>
        index === 0
          ? `M${x(time)},${y(progress)}`
          : `H${x(time)}V${y(progress)}`,
      )
      .join('');

  const handlePointer = (event: PointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg || chart.instants.length === 0) return;

    const bounds = svg.getBoundingClientRect();
    const scale = bounds.width > 0 ? width / bounds.width : 1;
    const pointerX = (event.clientX - bounds.left) * scale;
    const nearest = chart.instants.reduce(
      (best, time, index) =>
        Math.abs(x(time) - pointerX) <
        Math.abs(x(chart.instants[best]) - pointerX)
          ? index
          : best,
      0,
    );
    setActiveIndex(nearest);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (lastIndex < 0) return;

    switch (event.key) {
      case 'ArrowLeft':
        setActiveIndex(
          currentIndex === null ? lastIndex : Math.max(currentIndex - 1, 0),
        );
        break;
      case 'ArrowRight':
        setActiveIndex(
          currentIndex === null ? 0 : Math.min(currentIndex + 1, lastIndex),
        );
        break;
      case 'Home':
        setActiveIndex(0);
        break;
      case 'End':
        setActiveIndex(lastIndex);
        break;
      case 'Escape':
        setActiveIndex(null);
        return;
      default:
        return;
    }

    event.preventDefault();
  };

  const tooltipSide: CSSProperties =
    activeTime !== null && x(activeTime) > width / 2
      ? { right: width - x(activeTime) + 12 }
      : { left: (activeTime === null ? 0 : x(activeTime)) + 12 };
  const unknownStart = chart.unknownRange ? x(chart.unknownRange.start) : 0;
  const unknownWidth = chart.unknownRange
    ? x(chart.unknownRange.end) - unknownStart
    : 0;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        tabIndex={0}
        role="group"
        aria-label={t('projects.goalProgress.chartLabel')}
        onKeyDown={handleKeyDown}
        onBlur={() => setActiveIndex(null)}
        style={{ position: 'relative', borderRadius: token.borderRadius }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={t('projects.goalProgress.chartSummary', {
            from: formatDateTime(chart.from),
            to: formatDateTime(chart.to),
          })}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            touchAction: 'pan-y',
          }}
        >
          <defs>
            <pattern
              id={patternId}
              width={8}
              height={8}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={8}
                stroke={token.colorBorder}
                strokeWidth={2}
              />
            </pattern>
          </defs>
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={y(tick)}
                y2={y(tick)}
                stroke={token.colorBorderSecondary}
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                fill={token.colorTextSecondary}
                fontSize={token.fontSizeSM}
              >
                {tick}%
              </text>
            </g>
          ))}
          {xTicks.map(({ time, label }, index) => (
            <text
              key={time}
              x={x(time)}
              y={height - 8}
              textAnchor={
                index === 0
                  ? 'start'
                  : index === xTicks.length - 1
                    ? 'end'
                    : 'middle'
              }
              fill={token.colorTextSecondary}
              fontSize={token.fontSizeSM}
            >
              {label}
            </text>
          ))}
          {chart.unknownRange && (
            <g>
              <rect
                x={unknownStart}
                y={MARGIN.top}
                width={unknownWidth}
                height={plotHeight}
                fill={token.colorFillQuaternary}
              />
              <rect
                x={unknownStart}
                y={MARGIN.top}
                width={unknownWidth}
                height={plotHeight}
                fill={`url(#${patternId})`}
              />
              {unknownWidth >= MIN_UNKNOWN_LABEL_WIDTH && (
                <text
                  x={unknownStart + unknownWidth / 2}
                  y={MARGIN.top + 16}
                  textAnchor="middle"
                  fill={token.colorTextSecondary}
                  fontSize={token.fontSizeSM}
                >
                  {t('projects.goalProgress.notRecorded')}
                </text>
              )}
            </g>
          )}
          {visibleLines.map(({ goal, points }) => {
            const { color, dash } = styleOf(goal);
            return (
              <path
                key={goal}
                d={stepPath(points)}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray={dash}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
          {activeTime !== null && (
            <g>
              <line
                x1={x(activeTime)}
                x2={x(activeTime)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotHeight}
                stroke={token.colorTextTertiary}
                strokeWidth={1}
              />
              {activeValues.map(({ goal, progress }) => (
                <circle
                  key={goal}
                  cx={x(activeTime)}
                  cy={y(progress)}
                  r={4}
                  fill={styleOf(goal).color}
                  stroke={token.colorBgContainer}
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setActiveIndex(null);
            }}
          />
        </svg>
        {activeTime !== null && (
          <div
            aria-hidden
            style={{
              ...tooltipSide,
              position: 'absolute',
              top: MARGIN.top,
              zIndex: 1,
              minWidth: 160,
              padding: `${token.paddingXS}px ${token.paddingSM}px`,
              borderRadius: token.borderRadius,
              background: token.colorBgElevated,
              boxShadow: token.boxShadowSecondary,
              fontSize: token.fontSizeSM,
              pointerEvents: 'none',
            }}
          >
            <div style={{ color: token.colorTextSecondary, marginBottom: 4 }}>
              {formatDateTime(activeTime)}
            </div>
            {activeValues.map(({ goal, progress }) => (
              <div
                key={goal}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <GoalSeriesSwatch {...styleOf(goal)} />
                <strong style={{ color: token.colorText }}>{progress}%</strong>
                <span style={{ color: token.colorTextSecondary }}>
                  {t(`projects.goalTypes.${goal}`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div role="status" aria-live="polite" style={visuallyHidden}>
        {activeTime !== null &&
          t('projects.goalProgress.readout', {
            date: formatDateTime(activeTime),
            values: activeValues
              .map(
                ({ goal, progress }) =>
                  `${t(`projects.goalTypes.${goal}`)} ${progress}%`,
              )
              .join(', '),
          })}
      </div>
    </div>
  );
};
