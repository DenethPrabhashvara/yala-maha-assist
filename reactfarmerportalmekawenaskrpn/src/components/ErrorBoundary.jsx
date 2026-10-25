import { Component } from 'react';
import ErrorScreen from '../pages/ErrorScreen.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook a crash reporter here (e.g. Sentry) in production.
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          detail={String(this.state.error?.message || this.state.error)}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
