import * as React from "react"
import { toast as sonnerToast } from "sonner"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
import {
  resolveToastPriority,
  toastGate,
  type ToastGateInput,
  type ToastPriority,
} from "@/lib/toastGate"
import { shouldDefer } from "@/lib/notificationPlacement"
import { currentNotificationPlacement, selectChromeState, useUiChromeStore } from "@/stores/uiChromeStore"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  priority?: ToastPriority
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function nodeToText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  return ""
}

type Admission = ReturnType<typeof toastGate.admit>

/**
 * Feedback with no safe lane right now (take calibration, open drawer/modal on a phone) waits here
 * and is shown when the chrome state frees up. Admission (dedupe / rate limit) has already run, so
 * the queue is small, coalesced, and stale entries are dropped rather than replayed late.
 */
const DEFER_MAX = 4
const DEFER_TTL_MS = 20000
type DeferredToast = { id: string; props: Toast; admission: Admission; priority: ToastPriority; at: number }
let deferred: DeferredToast[] = []
/** Cards currently on screen, so a state change can pull back the ones that would now cover a primary action. */
let shown: DeferredToast[] = []
let watchingChrome = false
let lastChromeState = ""

function flushDeferred() {
  if (deferred.length === 0) return
  const placement = currentNotificationPlacement()
  const now = Date.now()
  deferred = deferred.filter((entry) => now - entry.at < DEFER_TTL_MS)
  const ready = deferred.filter((entry) => !shouldDefer(placement, entry.priority))
  if (ready.length === 0) return
  deferred = deferred.filter((entry) => shouldDefer(placement, entry.priority))
  // Only the newest cards fit the lane; older ones are already stale.
  ready.slice(-placement.capacity).forEach((entry) => present(entry.id, entry.props, entry.admission))
}

/** A drawer / calibration / session just took over: feedback still on screen yields and waits its turn. */
function yieldVisibleToasts() {
  const placement = currentNotificationPlacement()
  const now = Date.now()
  shown = shown.filter((entry) => now - entry.at < (entry.admission.durationMs ?? 3200))
  const covering = shown.filter((entry) => shouldDefer(placement, entry.priority))
  if (covering.length === 0) return
  shown = shown.filter((entry) => !covering.includes(entry))
  covering.forEach((entry) => {
    sonnerToast.dismiss(entry.id)
    deferred = [...deferred.filter((d) => d.id !== entry.id), entry].slice(-DEFER_MAX)
  })
}

function watchChrome() {
  if (watchingChrome) return
  watchingChrome = true
  lastChromeState = selectChromeState(useUiChromeStore.getState())
  useUiChromeStore.subscribe((state) => {
    const next = selectChromeState(state)
    if (next !== lastChromeState) {
      lastChromeState = next
      yieldVisibleToasts()
    }
    flushDeferred()
  })
}

function present(id: string, props: Toast, admission: Admission) {
  watchChrome()
  shown = [...shown.filter((entry) => entry.id !== id), { id, props, admission, priority: resolveToastPriority(props.variant, props.priority), at: Date.now() }].slice(-DEFER_MAX)
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id })
      },
    },
  })

  // Bridge to Sonner — App mounts a single <Toaster /> from components/ui/toaster.
  const { title, description, className, variant, action } = props
  const options = {
    id,
    description,
    duration: admission.durationMs,
    className,
    ...(action ? { action } : {}),
  }
  if (variant === "destructive") {
    sonnerToast.error(title ?? "", options)
  } else {
    sonnerToast(title ?? "", options)
  }
}

function toast({ ...props }: Toast) {
  const titleText = nodeToText(props.title)
  const descriptionText = nodeToText(props.description)
  const gateInput: ToastGateInput = {
    title: titleText,
    description: descriptionText || undefined,
    variant: props.variant,
    priority: props.priority,
    duration: props.duration,
  }
  const admission = toastGate.admit(gateInput)

  if (!admission.allow) {
    if (props.priority === "quiet" && typeof console !== "undefined") {
      console.debug("[toast:quiet]", titleText, descriptionText)
    }
    return {
      id: admission.coalesceId ?? genId(),
      dismiss: () => undefined,
      update: () => undefined,
    }
  }

  const id = admission.coalesceId ?? genId()

  const update = (next: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...next, id },
    })
  const dismiss = () => {
    deferred = deferred.filter((entry) => entry.id !== id)
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  const priority = resolveToastPriority(props.variant, props.priority)
  if (shouldDefer(currentNotificationPlacement(), priority)) {
    deferred = [...deferred.filter((entry) => entry.id !== id), { id, props, admission, priority, at: Date.now() }].slice(-DEFER_MAX)
    watchChrome()
    return { id, dismiss, update }
  }

  present(id, props, admission)

  return {
    id,
    dismiss,
    update,
  }
}

/** Test seam: pending deferred cards. */
export const __deferredToastCount = () => deferred.length

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
