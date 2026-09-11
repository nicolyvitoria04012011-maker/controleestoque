import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;
  public setState!: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Algo inesperado aconteceu
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ocorreu uma falha temporária ao renderizar esta seção. Seus dados cadastrados permanecem salvos e seguros.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-left mb-5 max-h-32 overflow-auto">
                <p className="text-[11px] font-mono text-red-600 break-all">
                  {this.state.error.message || 'Erro desconhecido'}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Restaurar Painel</span>
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-2 px-3 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Página</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
