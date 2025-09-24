import React from 'react'

type Props = {
  feature: string
  children: React.ReactNode
}

export class FeatureBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any) {
    console.error(`FeatureBoundary error in ${this.props.feature}:`, error)
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-50 text-red-800">Feature unavailable</div>
    }
    return this.props.children
  }
}

export default FeatureBoundary
