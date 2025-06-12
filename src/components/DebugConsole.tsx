'use client';

import { useEffect, useState, useRef } from 'react';

export default function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const originalConsole = useRef<{log: typeof console.log, error: typeof console.error, warn: typeof console.warn} | null>(null);
  
  // Test database connection
  const testConnection = async () => {
    try {
      console.log('Testing database connection...');
      const response = await fetch('/api/debug/db-test');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      console.log('Database connection test:', data);
    } catch (error) {
      console.error('Database connection test failed:', error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    // Only store original console methods once
    if (!originalConsole.current) {
      originalConsole.current = {
        log: console.log,
        error: console.error,
        warn: console.warn
      };
    }

    // Create safe wrapper functions that won't cause React state updates during rendering
    const safeAddLog = (type: string, args: any[]) => {
      setTimeout(() => {
        setLogs(prev => [...prev, `${type}: ${args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return '[Object]';
          }
        }).join(' ')}`]);
      }, 0);
    };

    // Override console methods to capture logs
    console.log = (...args) => {
      if (originalConsole.current) {
        originalConsole.current.log(...args);
      }
      safeAddLog('LOG', args);
    };

    console.error = (...args) => {
      if (originalConsole.current) {
        originalConsole.current.error(...args);
      }
      safeAddLog('ERROR', args);
    };

    console.warn = (...args) => {
      if (originalConsole.current) {
        originalConsole.current.warn(...args);
      }
      safeAddLog('WARN', args);
    };

    // Don't automatically run test connection on mount - this was causing the ChunkLoadError
    // We've moved the testConnection function outside of useEffect so it can be called from the JSX

    // Clean up
    return () => {
      if (originalConsole.current) {
        console.log = originalConsole.current.log;
        console.error = originalConsole.current.error;
        console.warn = originalConsole.current.warn;
      }
    };
  }, []);

  return (
    <div className="fixed bottom-0 right-0 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded-tl-md"
      >
        {isOpen ? 'Close Debug' : 'Open Debug'}
      </button>
      
      {isOpen && (
        <div className="bg-black bg-opacity-90 text-white p-4 w-full md:w-[600px] h-[400px] overflow-auto">
          <h3 className="text-xl mb-2">Debug Console</h3>
          <div className="flex space-x-2 mb-2">
            <button 
              onClick={() => setLogs([])}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              Clear
            </button>
            <button
              onClick={testConnection}
              className="bg-blue-500 text-white px-2 py-1 rounded"
            >
              Test DB Connection
            </button>
          </div>
          <div className="text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className={`mb-1 ${log.startsWith('ERROR') ? 'text-red-400' : log.startsWith('WARN') ? 'text-yellow-400' : 'text-green-400'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
