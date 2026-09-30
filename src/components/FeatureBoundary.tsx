import React from 'react'

type Props = {
  feature: string
  children: React.ReactNode
  /** Changing this value clears a previous error (e.g. the active drawer panel). */
  resetKey?: string | number
}

/**
 * Isolates a panel so one bad render shows a calm recovery card instead of
 * unmounting the whole game (a blank screen is the worst possible failure mode
 * for a save-backed sim).
 */
export class FeatureBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error(`FeatureBoundary error in ${this.props.feature}:`, error)
  }
  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="m-4 rst-surface p-5 text-center">
          <p className="rst-kicker">Console fault</p>
          <p className="rst-title mt-1 text-lg">This panel tripped a breaker</p>
          <p className="rst-body mt-2 text-sm">
            Your career is safe. Close the panel and reopen it, or try again below.
          </p>
          <button type="button" className="rst-btn rst-btn-primary mt-4" onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default FeatureBoundary
