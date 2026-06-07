'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center">
          <p className="text-red-400 font-medium">This section encountered an error.</p>
          <p className="text-slate-400 text-sm mt-1">Please refresh the page or try again later.</p>
        </div>
      )
    }
    return this.props.children
  }
}
