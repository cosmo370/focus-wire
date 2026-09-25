import { useState, useEffect, useRef, useCallback } from 'react'

// ?? Types ??????????????????????????????????????????????????????????????????????
type Priority = 'normal' | 'high'
type TaskStatus = 'active' | 'completed'

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  createdAt: number
  dueLabel?: string
}

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

interface TimerData {
  state: TimerState
  taskId: string | null
  totalSeconds: number
  remainingSeconds: number
}

interface Goal {
  type: 'tasks' | 'focus'
  label: string
  current: number
  target: number
}

type AppView = 'default' | 'compact' | 'focus-only'
// ?? Helpers ???????????????????????????????????????????????????????????????????
function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ?? Checkbox ?????????????????????????????????????????????????????????????????
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      aria-checked={checked}
      role="checkbox"
      className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer group/cb transition-all duration-150"
      style={{
        borderColor: checked ? 'var(--success)' : 'var(--border)',
        backgroundColor: checked ? 'var(--success)' : 'transparent',
      }}
      onMouseEnter={e => {
        if (!checked) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={e => {
        if (!checked) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      {checked && (
        <svg
          width="9"
          height="7"
          viewBox="0 0 9 7"
          fill="none"
          style={{ animation: 'checkFill 120ms ease' }}
        >
          <path
            d="M1 3.5L3.5 6L8 1"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

// ?? Progress Bar ??????????????????????????????????????????????????????????????
function ProgressBar({
  value,
  max,
  color = 'accent',
  height = 5,
  animate = false,
}: {
  value: number
  max: number
  color?: 'accent' | 'success' | 'warning'
  height?: number
  animate?: boolean
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colorMap = {
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
  }
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: `${height}px`, backgroundColor: 'var(--border)' }}
    >
      <div
        className={animate ? 'timer-bar' : ''}
        style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: colorMap[color],
          borderRadius: 9999,
          transition: animate ? undefined : 'width 300ms ease',
        }}
      />
    </div>
  )
}

// ?? Task Row ??????????????????????????????????????????????????????????????????
function TaskRow({
  task,
  isActive,
  onComplete,
  onFocus,
}: {
  task: Task
  isActive: boolean
  onComplete: (id: string) => void
  onFocus: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const completed = task.status === 'completed'
  const toggleComplete = () => onComplete(task.id)

  return (
    <div
      className="flex items-center gap-3 px-4 rounded-lg cursor-pointer select-none"
      style={{
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: hovered ? 'var(--secondary)' : isActive ? 'var(--secondary)' : 'transparent',
        opacity: completed ? 0.55 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={toggleComplete}
      title={completed ? 'Mark as active' : 'Mark as completed'}
    >
      <Checkbox checked={completed} onChange={toggleComplete} />

      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
            textDecoration: completed ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {task.title}
        </div>
        {task.dueLabel && !completed && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {task.dueLabel}
          </div>
        )}
      </div>

      {isActive && (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            flexShrink: 0,
          }}
        />
      )}

      {hovered && !completed && (
        <button
          onClick={e => { e.stopPropagation(); onFocus(task.id) }}
          title="Start focus"
          className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-120"
          style={{
            width: 28,
            height: 28,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 4.5L9 6.5L5 8.5V4.5Z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ?? Timer Module ??????????????????????????????????????????????????????????????
function TimerModule({
  timer,
  taskTitle,
  onStart,
  onPause,
  onResume,
  onStop,
  onDone,
  onAddFive,
}: {
  timer: TimerData
  taskTitle: string
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onDone: () => void
  onAddFive: () => void
}) {
  const pct = timer.totalSeconds > 0 ? (timer.remainingSeconds / timer.totalSeconds) * 100 : 0
  const isLow = pct <= 10 && timer.state === 'running'

  if (timer.state === 'idle') {
    return (
      <div
        className="flex items-center justify-between"
        style={{ padding: '10px 16px', cursor: 'pointer' }}
        onClick={onStart}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Focus Timer
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            25 min · Ready
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onStart() }}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 30,
            height: 30,
            backgroundColor: 'var(--accent)',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)')}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path d="M1 1L9 6L1 11V1Z" fill="white" />
          </svg>
        </button>
      </div>
    )
  }

  if (timer.state === 'finished') {
    return (
      <div className="animate-expand-in" style={{ padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Timer disarmed
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Did you finish your task?
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDone}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 8,
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)')}
          >
            Yes, complete
          </button>
          <button
            onClick={onAddFive}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 8,
              backgroundColor: 'var(--secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Not yet · +5 min
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-expand-in" style={{ padding: '14px 16px 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
        {timer.state === 'paused' ? 'Paused' : 'Focus'}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {taskTitle}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 600,
          color: timer.state === 'paused' ? 'var(--text-muted)' : 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: 10,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {formatTime(timer.remainingSeconds)}
      </div>
      <ProgressBar
        value={timer.remainingSeconds}
        max={timer.totalSeconds}
        color={isLow ? 'warning' : 'accent'}
        height={5}
        animate={timer.state === 'running'}
      />
      <div className="flex gap-2" style={{ marginTop: 12 }}>
        {timer.state === 'running' ? (
          <button
            onClick={onPause}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 8,
              backgroundColor: 'var(--secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 8,
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)')}
          >
            Resume
          </button>
        )}
        <button
          onClick={onStop}
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--danger)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          Stop
        </button>
      </div>
    </div>
  )
}

// ?? Goal Module ???????????????????????????????????????????????????????????????
function FocusBombScreen({ taskTitle, timer, onPause, onResume, onDefuse, onDone, onAddFive, onBack }: {
  taskTitle: string
  timer: TimerData
  onPause: () => void
  onResume: () => void
  onDefuse: () => void
  onDone: () => void
  onAddFive: () => void
  onBack: () => void
}) {
  const remaining = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 0
  const isFinished = timer.state === 'finished'
  const isUrgent = remaining <= 0.15 && timer.state === 'running'

  return (
    <main className={`focus-bomb-screen ${isUrgent ? 'is-urgent' : ''} ${isFinished ? 'is-disarmed' : ''}`}>
      <header className="focus-bomb-header">
        <button className="focus-back-button" onClick={onBack} aria-label="Back to task list" title="Back to task list">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="focus-kicker">FOCUS SEQUENCE</span>
        <span className={`focus-status ${isFinished ? 'status-safe' : isUrgent ? 'status-danger' : ''}`}>
          {isFinished ? 'SAFE' : timer.state === 'paused' ? 'PAUSED' : 'ARMED'}
        </span>
      </header>
      <div className="focus-task-title">{taskTitle}</div>
      <div className="bomb-stage">
        <div className="bomb-fuse-cap" />
        <div className="bomb-wire-track" aria-label={`${Math.round(remaining * 100)} percent of timer remains`}>
          <span className="bomb-wire-live" style={{ width: `${Math.max(0, remaining * 100)}%` }} />
          {!isFinished && <span className="bomb-wire-spark" style={{ left: `${Math.max(0, remaining * 100)}%` }} />}
        </div>
        <div className="bomb-body">
          <div className="bomb-rivet rivet-left" />
          <div className="bomb-rivet rivet-right" />
          <div className="bomb-display">
            <span className="bomb-time">{formatTime(timer.remainingSeconds)}</span>
            <span className="bomb-display-caption">{isFinished ? 'SEQUENCE COMPLETE' : 'TIME REMAINING'}</span>
          </div>
          <div className="bomb-bottom-lights"><i /><i /><i /></div>
        </div>
      </div>
      {isFinished ? (
        <section className="defuse-confirmation">
          <div className="confirmation-eyebrow">TIMER DISARMED</div>
          <h1>Did you finish your task?</h1>
          <p>Confirm completion or add five more minutes to your focus session.</p>
          <div className="focus-actions">
            <button className="focus-primary-action" onClick={onDone}>Yes, I finished</button>
            <button className="focus-secondary-action" onClick={onAddFive}>Not yet · +5 min</button>
          </div>
        </section>
      ) : (
        <section className="focus-controls">
          <div className="focus-actions">
            <button className="focus-secondary-action" onClick={timer.state === 'running' ? onPause : onResume}>
              {timer.state === 'running' ? 'Pause' : 'Resume'}
            </button>
            <button className="focus-primary-action" onClick={onDefuse}>I finished early</button>
          </div>
          <div className="focus-hint">Stay focused. The wire shortens as time runs out.</div>
        </section>
      )}
    </main>
  )
}
function GoalModule({ goal }: { goal: Goal }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))
  const done = pct >= 100

  return (
    <div style={{ padding: '0 16px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Daily Goal
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: done ? 'var(--success)' : 'var(--text-secondary)' }}>
          {goal.current} / {goal.target} {goal.type === 'tasks' ? 'tasks' : 'min'}
        </div>
      </div>
      <ProgressBar
        value={goal.current}
        max={goal.target}
        color={done ? 'success' : 'accent'}
        height={5}
      />
    </div>
  )
}

// ?? Focus Setup Popover ???????????????????????????????????????????????????????
function FocusPopover({
  task,
  onStart,
  onClose,
}: {
  task: Task
  onStart: (minutes: number) => void
  onClose: () => void
}) {
  const [minutes, setMinutes] = useState(25)

  return (
    <div
      className="animate-slide-down"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: 16,
        right: 16,
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 50,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Focus on
        </div>
        <button
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          횞
        </button>
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 14,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        "{task.title}"
      </div>
      <div className="flex items-center justify-center gap-3" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setMinutes(m => Math.max(5, m - 5))}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--secondary)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>
          {minutes} min
        </div>
        <button
          onClick={() => setMinutes(m => Math.min(90, m + 5))}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--secondary)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
      <button
        onClick={() => onStart(minutes)}
        style={{
          width: '100%',
          height: 34,
          borderRadius: 8,
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)')}
      >
        Start Focus
      </button>
    </div>
  )
}

// ?? Compact Widget ????????????????????????????????????????????????????????????
function CompactWidget({
  tasks,
  goal,
  timer,
  onExpand,
  onTimerToggle,
}: {
  tasks: Task[]
  goal: Goal
  timer: TimerData
  onExpand: () => void
  onTimerToggle: () => void
}) {
  const active = tasks.filter(t => t.status === 'active').length
  const completed = tasks.filter(t => t.status === 'completed').length
  const isRunning = timer.state === 'running'
  const isPaused = timer.state === 'paused'

  return (
    <div
      className="flex items-center gap-3"
      style={{
        height: 48,
        padding: '0 16px',
        backgroundColor: 'var(--card)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        minWidth: 280,
      }}
      onClick={onExpand}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--success)' }}>✓</span> {completed}/{goal.target}
      </div>
      <div style={{ width: 1, height: 16, backgroundColor: 'var(--border)' }} />
      {(isRunning || isPaused) ? (
        <div className="flex items-center gap-2 flex-1">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: isPaused ? 'var(--warning)' : 'var(--accent)',
              animation: isRunning ? 'progressPulse 2s ease infinite' : 'none',
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(timer.remainingSeconds)}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
          {active} task{active !== 1 ? 's' : ''} today
        </div>
      )}
      {(isRunning || isPaused) && (
        <button
          onClick={e => { e.stopPropagation(); onTimerToggle() }}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
          }}
        >
          {isRunning ? (
            <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
              <rect x="0" y="0" width="2.5" height="10" rx="1" fill="currentColor" />
              <rect x="5.5" y="0" width="2.5" height="10" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
              <path d="M1 1L7 5L1 9V1Z" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
      <button
        onClick={e => { e.stopPropagation(); onExpand() }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          backgroundColor: 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 16,
          fontWeight: 400,
        }}
      >
        +
      </button>
    </div>
  )
}

// ?? Main App ??????????????????????????????????????????????????????????????????
const INITIAL_TASKS: Task[] = [
  { id: uid(), title: 'Send society email', status: 'active', priority: 'normal', createdAt: Date.now(), dueLabel: 'Today' },
  { id: uid(), title: 'Review paper draft', status: 'active', priority: 'high', createdAt: Date.now(), dueLabel: 'Today · 3:00 PM' },
  { id: uid(), title: 'Update landing page', status: 'active', priority: 'normal', createdAt: Date.now(), dueLabel: 'Today · 5:00 PM' },
  { id: uid(), title: 'Team standup prep', status: 'completed', priority: 'normal', createdAt: Date.now() - 3600000 },
  { id: uid(), title: 'Fix auth bug', status: 'completed', priority: 'high', createdAt: Date.now() - 7200000 },
]

export default function App() {
  const isDesktopApp = new URLSearchParams(window.location.search).has('desktop')
  const [dark, setDark] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [newTask, setNewTask] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [view, setView] = useState<AppView>('default')
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [showFocusPopover, setShowFocusPopover] = useState(false)
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)
  const [focusMinutes, setFocusMinutes] = useState(25)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [timer, setTimer] = useState<TimerData>({
    state: 'idle',
    taskId: null,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
  })

  const goal: Goal = {
    type: 'tasks',
    label: 'Tasks completed',
    current: tasks.filter(t => t.status === 'completed').length,
    // Keep the goal denominator in sync with the number of tasks for today.
    target: Math.max(tasks.length, 1),
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const activeTasks = tasks.filter(t => t.status === 'active')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  // Timer tick
  useEffect(() => {
    if (timer.state !== 'running') return
    const id = setInterval(() => {
      setTimer(t => {
        if (t.remainingSeconds <= 1) {
          clearInterval(id)
          return { ...t, remainingSeconds: 0, state: 'finished' }
        }
        return { ...t, remainingSeconds: t.remainingSeconds - 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timer.state])

  // Dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('desktop-app', isDesktopApp)
  }, [dark])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        setShowAdd(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setShowAdd(false)
        setShowFocusPopover(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const completeTask = useCallback((id: string) => {
    const isCompleting = tasks.some(t => t.id === id && t.status === 'active')
    setTasks(ts =>
      ts.map(t =>
        t.id === id
          ? { ...t, status: t.status === 'completed' ? 'active' : 'completed' }
          : t
      )
    )
    // Reveal completed rows immediately so completing a task never makes it
    // appear to disappear from the list.
    if (isCompleting) setShowCompleted(true)
    if (timer.taskId === id) {
      setTimer(t => ({ ...t, state: 'idle', taskId: null }))
      setFocusTaskId(null)
    }
  }, [tasks, timer.taskId])

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(ts => [
      ...ts,
      {
        id: uid(),
        title: newTask.trim(),
        status: 'active',
        priority: 'normal',
        createdAt: Date.now(),
        dueLabel: 'Today',
      },
    ])
    setNewTask('')
    setShowAdd(false)
  }

  const openFocusFor = (taskId: string) => {
    setPendingFocusId(taskId)
    setShowFocusPopover(true)
  }

  const startFocus = (minutes: number) => {
    const secs = minutes * 60
    setTimer({ state: 'running', taskId: pendingFocusId, totalSeconds: secs, remainingSeconds: secs })
    setFocusTaskId(pendingFocusId)
    setFocusMinutes(minutes)
    setView('focus-only')
    setShowFocusPopover(false)
    setPendingFocusId(null)
  }

  const confirmFocusDone = () => {
    if (timer.taskId) {
      setTasks(ts => ts.map(task => task.id === timer.taskId ? { ...task, status: 'completed' } : task))
      setShowCompleted(true)
    }
    setTimer({ state: 'idle', taskId: null, totalSeconds: 25 * 60, remainingSeconds: 25 * 60 })
    setFocusTaskId(null)
    setView('default')
  }

  const timerTask = tasks.find(t => t.id === timer.taskId)

  // ?? Compact Mode ?????????????????????????????????????????????????????????
  if (view === 'compact') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: isDesktopApp ? 'transparent' : 'var(--background)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          padding: 24,
        }}
      >
        <CompactWidget
          tasks={tasks}
          goal={{ ...goal, current: completedCount }}
          timer={timer}
          onExpand={() => setView('default')}
          onTimerToggle={() =>
            setTimer(t => ({
              ...t,
              state: t.state === 'running' ? 'paused' : t.state === 'paused' ? 'running' : t.state,
            }))
          }
        />
      </div>
    )
  }

  // ?? Focus-only Mode ???????????????????????????????????????????????????????
  if (view === 'focus-only') {
    return (
      <FocusBombScreen
        taskTitle={timerTask?.title ?? 'Focus session'}
        timer={timer}
        onPause={() => setTimer(t => ({ ...t, state: 'paused' }))}
        onResume={() => setTimer(t => ({ ...t, state: 'running' }))}
        onDefuse={() => setTimer(t => ({ ...t, state: 'finished', remainingSeconds: 0 }))}
        onDone={confirmFocusDone}
        onAddFive={() => {
          const extra = 5 * 60
          setTimer(t => ({ ...t, state: 'running', totalSeconds: extra, remainingSeconds: extra }))
        }}
        onBack={() => setView('default')}
      />
    )
  }

  // ?? Default View ??????????????????????????????????????????????????????????
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDesktopApp ? 'transparent' : 'var(--background)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding: 24,
        fontFamily: "'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: 320,
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {/* Focus Setup Popover */}
        {showFocusPopover && pendingFocusId && (
          <FocusPopover
            task={tasks.find(t => t.id === pendingFocusId)!}
            onStart={startFocus}
            onClose={() => { setShowFocusPopover(false); setPendingFocusId(null) }}
          />
        )}

        {/* Header */}
        <div
          className="window-drag-region flex items-center justify-between"
          style={{ padding: '14px 16px 12px' }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              To do
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {formatDate(new Date())}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Daily summary */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 6 }}>
              {completedCount} · {focusMinutes > 0 && timer.state !== 'idle' ? Math.round((timer.totalSeconds - timer.remainingSeconds) / 60) : 0} min
            </div>
            <button
              onClick={() => {
                setShowAdd(true)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              title="New task (Ctrl+N)"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 300,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              +
            </button>
            <div className="relative">
              <button
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
                onClick={() => setDark(d => !d)}
                title="Toggle theme"
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--secondary)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
              >
                {dark ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="3" fill="currentColor" />
                    <path d="M6.5 1V2M6.5 11V12M1 6.5H2M11 6.5H12M2.93 2.93L3.64 3.64M9.36 9.36L10.07 10.07M10.07 2.93L9.36 3.64M3.64 9.36L2.93 10.07" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M11.5 7.5A5 5 0 1 1 5.5 1.5a3.5 3.5 0 0 0 6 6z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={() => setView('compact')}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Compact mode"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <rect x="0" y="0" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="2" y="3.25" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="4" y="6.5" width="4" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => window.close()}
              title="Close Focus Wire"
              aria-label="Close app"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--border)' }} />

        {/* Goal */}
        <div style={{ paddingTop: 14, paddingBottom: 14 }}>
          <GoalModule goal={{ ...goal, current: completedCount }} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--border)' }} />

        {/* Timer */}
        <div style={{ paddingTop: 4, paddingBottom: 4 }}>
          <TimerModule
            timer={timer}
            taskTitle={timerTask?.title ?? 'Select a task to focus'}
            onStart={() => {
              if (timer.taskId) {
                setTimer(t => ({ ...t, state: 'running' }))
              } else if (activeTasks.length > 0) {
                openFocusFor(activeTasks[0].id)
              }
            }}
            onPause={() => setTimer(t => ({ ...t, state: 'paused' }))}
            onResume={() => setTimer(t => ({ ...t, state: 'running' }))}
            onStop={() => {
              setTimer({ state: 'idle', taskId: null, totalSeconds: 25 * 60, remainingSeconds: 25 * 60 })
              setFocusTaskId(null)
            }}
            onDone={() => {
              confirmFocusDone()
            }}
            onAddFive={() => {
              const extra = 5 * 60
              setTimer(t => ({
                ...t,
                state: 'running',
                totalSeconds: extra,
                remainingSeconds: extra,
              }))
            }}
          />
          {(timer.state === 'running' || timer.state === 'paused') && (
            <button
              onClick={() => setView('focus-only')}
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 16px 8px',
                display: 'block',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              Focus-only view
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--border)' }} />

        {/* Quick Add */}
        <div style={{ padding: '8px 16px' }}>
          {showAdd ? (
            <div className="animate-slide-down flex items-center gap-2">
              <input
                ref={inputRef}
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addTask()
                  if (e.key === 'Escape') { setShowAdd(false); setNewTask('') }
                }}
                placeholder="Task name..."
                autoFocus
                style={{
                  flex: 1,
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid var(--accent)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={addTask}
                style={{
                  height: 34,
                  padding: '0 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)')}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowAdd(true); setTimeout(() => inputRef.current?.focus(), 50) }}
              style={{
                width: '100%',
                height: 34,
                padding: '0 4px',
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 13,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              <span style={{ fontSize: 16, fontWeight: 300 }}>+</span>
              <span>Add a task...</span>
            </button>
          )}
        </div>

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div style={{ paddingBottom: 8 }}>
            <div style={{ padding: '4px 16px 2px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Today
            </div>
            {activeTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                isActive={task.id === focusTaskId}
                onComplete={completeTask}
                onFocus={openFocusFor}
              />
            ))}
          </div>
        )}

        {/* Completed section */}
        {completedTasks.length > 0 && (
          <div style={{ paddingBottom: 12 }}>
            <button
              onClick={() => setShowCompleted(s => !s)}
              style={{
                width: '100%',
                padding: '6px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 500,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
              >
                <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ color: 'var(--success)' }}>✓</span> Completed {completedTasks.length}
            </button>
            {showCompleted && (
              <div className="animate-expand-in">
                {completedTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isActive={false}
                    onComplete={completeTask}
                    onFocus={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>All clear. Add a task to get started.</div>
          </div>
        )}
      </div>
    </div>
  )
}
