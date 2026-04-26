import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import ErrorState from './ErrorState';

interface Props {
  children: ReactNode;
  source: string;
}

interface State {
  hasError: boolean;
}

/**
 * React class-based error boundary wrapping each API section.
 * Renders ErrorState on caught error, isolating failures per section.
 * Req 11.5, Req 12.2
 */
class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ApiErrorBoundary] Error in "${this.props.source}":`, error, info);
  }

  handleRetry(): void {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          source={this.props.source}
          errorType={null}
          lastFetchedAt={null}
          cachedDataAvailable={false}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ApiErrorBoundary;
