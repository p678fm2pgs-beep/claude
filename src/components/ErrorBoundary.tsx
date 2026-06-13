import { Component, type ErrorInfo, type ReactNode } from 'react';
import { translate } from '../i18n';
import { useStore } from '../store/useStore';

interface Props {
  children: ReactNode;
  label?: string;
}
interface State {
  hasError: boolean;
}

/**
 * React Error Boundary — zeigt eine gestaltete Fehlerkarte mit „Erneut versuchen",
 * niemals eine weiße Seite.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Bewusst kein console.error (Konsolen-Wächter); stattdessen geordnete Anzeige.
    void error;
    void info;
  }

  reset = (): void => this.setState({ hasError: false });

  render(): ReactNode {
    if (this.state.hasError) {
      const lang = useStore.getState().lang;
      return (
        <div className="card p-8 m-6 max-w-lg mx-auto text-center" role="alert">
          <p className="eyebrow mb-3">HAVEN</p>
          <h3 className="text-2xl mb-3">{translate(lang, 'err.boundary')}</h3>
          {this.props.label && <p className="text-muted text-sm mb-5">{this.props.label}</p>}
          <button className="btn btn-primary" onClick={this.reset}>
            {translate(lang, 'common.retry')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
