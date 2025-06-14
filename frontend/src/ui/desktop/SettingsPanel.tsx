import React, { useState } from "react";
import { settingService } from "../../services/settingService";
import { useAuth } from "../../contexts/AuthContext";

export function SettingsPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, login, logout } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await settingService.registerEmail({ email, password });
      if (response.success) {
        login(response.token);
        setEmail(""); // Clear the input after success
        setPassword(""); // Clear the password
      } else {
        setError(response.error || "Failed to register email");
      }
    } catch (err) {
      setError("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Welcome to Hermes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Your AI-powered translation assistant. Get started by registering your
          email.
        </p>
      </div>

      {isAuthenticated ? (
        <div className="text-sm">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <span>✓ Account registered</span>
            <button
              onClick={logout}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded border px-3 py-2 text-sm"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Password must be at least 8 characters long.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}
    </div>
  );
}
