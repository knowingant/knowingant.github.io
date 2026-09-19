import { createRoot } from "react-dom/client";
import * as React from "react";
import ReactModal from "react-modal";

import "./style.css";

import AppStateProvider from "./AppStateProvider";
import WebsocketProvider from "./WebsocketProvider";
import TimerProvider from "./TimerProvider";
import Root from "./Root";
import { AuthBootstrap } from "./Auth";

import type { JSX } from "react";

const WasmProvider = React.lazy(
  async () => await import("./WasmOrRpcProvider"),
);

interface IErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
}

/// Minimal error boundary (replaces the Sentry one upstream used). Renders
/// `fallback` once anything below it throws during render.
class ErrorBoundary extends React.Component<
  IErrorBoundaryProps,
  IErrorBoundaryState
> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): IErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error("Uncaught error in React tree:", error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const bootstrap = (): void => {
  const root = document.getElementById("root");
  const fallback: JSX.Element = (
    <>
      An error has occured, please try refreshing! If that doesn&apos;t resolve
      the issue, consider using the latest version of Mozilla Firefox or Google
      Chrome browsers.
    </>
  );
  ReactModal.setAppElement(root!);
  const root_ = createRoot(root!);

  root_.render(
    <ErrorBoundary fallback={fallback}>
      <React.Suspense fallback={"loading..."}>
        <WasmProvider>
          <TimerProvider>
            <AppStateProvider>
              <AuthBootstrap />
              <WebsocketProvider>
                <ErrorBoundary fallback={fallback}>
                  <Root />
                </ErrorBoundary>
              </WebsocketProvider>
            </AppStateProvider>
          </TimerProvider>
        </WasmProvider>
      </React.Suspense>
    </ErrorBoundary>,
  );
};

bootstrap();
