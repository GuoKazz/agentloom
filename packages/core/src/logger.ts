import type { Logger, LogLevel } from './types.js'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

export interface LoggerOptions {
  /** Plugin id, used to prefix log lines. */
  prefix?: string
  /** Minimum level emitted. Defaults to `info`. */
  level?: LogLevel
  /** Custom sink; defaults to `console`. */
  sink?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>
}

/**
 * Build a {@link Logger} that prefixes lines with `[id]` and respects a
 * minimum level threshold. The default sink is the global `console`.
 */
export function createLogger(opts: LoggerOptions = {}): Logger {
  const { prefix, level = 'info', sink = console } = opts
  const min = LEVEL_ORDER[level]
  const fmt = (args: unknown[]) => (prefix ? [`[${prefix}]`, ...args] : args)

  return {
    debug: (...args) => {
      if (LEVEL_ORDER.debug >= min) sink.debug(...fmt(args))
    },
    info: (...args) => {
      if (LEVEL_ORDER.info >= min) sink.info(...fmt(args))
    },
    warn: (...args) => {
      if (LEVEL_ORDER.warn >= min) sink.warn(...fmt(args))
    },
    error: (...args) => {
      if (LEVEL_ORDER.error >= min) sink.error(...fmt(args))
    }
  }
}