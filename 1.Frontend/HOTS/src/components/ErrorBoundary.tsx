import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * and displays a friendly fallback UI instead of crashing the whole page.
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-orange-800 mb-2">
                            Something went wrong
                        </h3>
                        <p className="text-sm text-orange-600 mb-4">
                            {this.props.fallbackMessage || 'This component failed to load. Please try again.'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleRetry}
                            className="text-orange-700 border-orange-300 hover:bg-orange-100"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
