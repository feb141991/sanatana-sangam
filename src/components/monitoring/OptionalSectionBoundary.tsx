'use client';

import { Component, type ReactNode } from 'react';
import { reportClientError } from '@/lib/client-error-reporter';

interface Props {
  /** Identifies which optional section this is, for the error report's `source` field. */
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * For a section of the page that is genuinely optional -- the rest of the
 * page is fully usable without it -- so a defect in it should never take
 * the whole page down. Renders nothing (not a visible error message) when
 * its children throw, since the surrounding page already reads fine
 * without this section.
 *
 * Do not wrap required content in this -- silently hiding a broken
 * required section is worse than the page-level error screen.
 */
export class OptionalSectionBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    void reportClientError({ source: 'react_home', error });
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
