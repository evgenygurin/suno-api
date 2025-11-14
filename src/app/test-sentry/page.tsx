"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function TestSentryPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Test 1: Throw unhandled error
  const testUnhandledError = () => {
    addLog("🔴 Throwing unhandled error...");
    throw new Error("Test unhandled client-side error");
  };

  // Test 2: Captured exception
  const testCapturedError = () => {
    try {
      addLog("🟡 Capturing exception with Sentry...");
      const error = new Error("Test captured client-side exception");
      Sentry.captureException(error, {
        tags: {
          test: "sentry-integration",
          type: "captured-exception",
          location: "client",
        },
        extra: {
          page: "/test-sentry",
          timestamp: new Date().toISOString(),
        },
      });
      addLog("✅ Exception captured successfully");
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 3: Capture message
  const testCaptureMessage = () => {
    addLog("📝 Sending message to Sentry...");
    Sentry.captureMessage("Test Sentry message from client", {
      level: "info",
      tags: {
        test: "sentry-integration",
        type: "message",
      },
    });
    addLog("✅ Message sent successfully");
  };

  // Test 4: Test async error
  const testAsyncError = async () => {
    addLog("⏳ Testing async error...");
    try {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Test async error")), 100)
      );
    } catch (error) {
      addLog("🔴 Async error occurred");
      Sentry.captureException(error);
    }
  };

  // Test 5: Server-side error
  const testServerError = async (type: string) => {
    addLog(`🌐 Testing server error (type: ${type})...`);
    try {
      const response = await fetch(`/api/test-sentry/server-error?type=${type}`);
      if (!response.ok) {
        addLog(`🔴 Server returned status: ${response.status}`);
      } else {
        const data = await response.json();
        addLog(`✅ Server test: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 6: Show user feedback
  const testUserFeedback = () => {
    addLog("💬 Triggering Sentry feedback...");
    try {
      // Use showReportDialog for user feedback
      Sentry.showReportDialog({
        eventId: Sentry.captureMessage("User requested feedback", "info"),
        user: {
          email: "test@example.com",
          name: "Test User",
        },
      });
      addLog("✅ Feedback dialog opened");
    } catch (error) {
      addLog(`ℹ️  Note: Feedback widget may appear automatically as a button on the page`);
      addLog(`ℹ️  Or you can manually trigger with Sentry.showReportDialog()`);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          🧪 Sentry Integration Test Suite
        </h1>
        <p style={{ color: "#666" }}>
          Test different Sentry error tracking scenarios. Check your browser console
          and Sentry dashboard for captured events.
        </p>
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f0f0f0",
          borderRadius: "4px"
        }}>
          <strong>Sentry DSN:</strong>{" "}
          {process.env.NEXT_PUBLIC_SENTRY_DSN ? "✅ Configured" : "❌ Not configured"}
        </div>
      </div>

      {/* Client-side tests */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Client-Side Error Tests
        </h2>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          <button
            onClick={testCapturedError}
            style={buttonStyle("#10b981")}
          >
            ✅ Captured Exception
          </button>
          <button
            onClick={testCaptureMessage}
            style={buttonStyle("#3b82f6")}
          >
            📝 Capture Message
          </button>
          <button
            onClick={testAsyncError}
            style={buttonStyle("#f59e0b")}
          >
            ⏳ Async Error
          </button>
          <button
            onClick={testUserFeedback}
            style={buttonStyle("#8b5cf6")}
          >
            💬 User Feedback
          </button>
          <button
            onClick={testUnhandledError}
            style={buttonStyle("#ef4444")}
          >
            🔴 Unhandled Error (Dangerous!)
          </button>
        </div>
      </div>

      {/* Server-side tests */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Server-Side Error Tests
        </h2>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          <button
            onClick={() => testServerError("captured")}
            style={buttonStyle("#10b981")}
          >
            ✅ Server Captured
          </button>
          <button
            onClick={() => testServerError("message")}
            style={buttonStyle("#3b82f6")}
          >
            📝 Server Message
          </button>
          <button
            onClick={() => testServerError("timeout")}
            style={buttonStyle("#f59e0b")}
          >
            ⏱️ Server Timeout (Filtered)
          </button>
          <button
            onClick={() => testServerError("throw")}
            style={buttonStyle("#ef4444")}
          >
            🔴 Server Unhandled
          </button>
        </div>
      </div>

      {/* Logs */}
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Test Logs
        </h2>
        <div
          style={{
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            padding: "1rem",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {logs.length === 0 ? (
            <p style={{ color: "#888" }}>No logs yet. Click a button to test Sentry!</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: "0.5rem" }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: "2rem",
        padding: "1rem",
        backgroundColor: "#eff6ff",
        borderRadius: "4px",
        borderLeft: "4px solid #3b82f6"
      }}>
        <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>📋 What to Check:</h3>
        <ul style={{ marginLeft: "1.5rem", lineHeight: "1.6" }}>
          <li>Open browser DevTools Console to see Sentry debug logs</li>
          <li>Check your Sentry dashboard for captured events</li>
          <li>Session Replay should capture your interactions</li>
          <li>Filtered errors (timeout) should NOT appear in Sentry</li>
          <li>Development errors won't be sent unless SENTRY_DEBUG=1</li>
        </ul>
      </div>
    </div>
  );
}

const buttonStyle = (color: string) => ({
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
  fontWeight: "500" as const,
  backgroundColor: color,
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  transition: "opacity 0.2s",
  ":hover": {
    opacity: 0.9,
  },
});
