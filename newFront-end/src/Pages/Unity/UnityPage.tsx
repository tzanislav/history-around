import { useCallback, useEffect, useRef, useState } from 'react'
import UnityViewer from '../../Components/UnityViewer/UnityViewer'
import ConsoleOverlay, { type ConsoleEntry } from '../../Components/ConsoleOverlay/ConsoleOverlay'
import './UnityPage.css'
import NavBar from '../../Components/NavBar/NavBar'

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error'

function normalizeLevel(level: unknown): ConsoleLevel {
  if (level === 'info' || level === 'warn' || level === 'error') {
    return level
  }

  return 'log'
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') {
    return arg
  }

  if (arg instanceof Error) {
    return arg.stack ?? arg.message
  }

  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function UnityPage() {
    const [isConsoleVisible, setIsConsoleVisible] = useState(false)
    const [entries, setEntries] = useState<ConsoleEntry[]>([])
    const nextIdRef = useRef(1)

    const appendEntry = useCallback((level: ConsoleLevel, source: 'app' | 'unity', args: unknown[]) => {
        const message = args.map((arg) => formatArg(arg)).join(' ')
        const entry: ConsoleEntry = {
            id: nextIdRef.current++,
            level,
            source,
            message,
            time: new Date().toLocaleTimeString(),
        }

        setEntries((prev) => [...prev.slice(-299), entry])
    }, [])

    useEffect(() => {
        const levels: ConsoleLevel[] = ['log', 'info', 'warn', 'error']
        const originals = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
        }

        levels.forEach((level) => {
            console[level] = (...args: unknown[]) => {
                originals[level](...args)
                appendEntry(level, 'app', args)
            }
        })

        const onError = (event: ErrorEvent) => {
            appendEntry('error', 'app', [event.message, event.filename ? `at ${event.filename}:${event.lineno}` : ''])
        }

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            appendEntry('error', 'app', ['UnhandledPromiseRejection', event.reason])
        }

        const onUnityMessage = (event: MessageEvent) => {
            if (event.data?.type !== 'UNITY_CONSOLE') {
                return
            }

            const payload = event.data?.payload ?? {}
            const level = normalizeLevel(payload.level)
            appendEntry(level, 'unity', [payload.message ?? ''])
        }

        window.addEventListener('error', onError)
        window.addEventListener('unhandledrejection', onUnhandledRejection)
        window.addEventListener('message', onUnityMessage)

        return () => {
            console.log = originals.log
            console.info = originals.info
            console.warn = originals.warn
            console.error = originals.error
            window.removeEventListener('error', onError)
            window.removeEventListener('unhandledrejection', onUnhandledRejection)
            window.removeEventListener('message', onUnityMessage)
        }
    }, [appendEntry])

    return (
        <main className="unity-page">
            <NavBar />
            <UnityViewer autoResize />

            <footer className="unity-page__footer">
                <button
                    type="button"
                    className="unity-page__console-toggle"
                    onClick={() => setIsConsoleVisible((prev) => !prev)}
                >
                    {isConsoleVisible ? 'Hide Console Overlay' : 'Show Console Overlay'}
                </button>
            </footer>

            <ConsoleOverlay
                entries={entries}
                isVisible={isConsoleVisible}
                onHide={() => setIsConsoleVisible(false)}
                onClear={() => setEntries([])}
            />
        </main>
    )
}

export default UnityPage
