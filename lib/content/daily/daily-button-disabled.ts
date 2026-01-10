import { Challenge } from "../types";

// Daily battle: Button Disabled (daily variant)
// Independent from track/arc curriculum, used only by the daily battle system.

export const dailyButtonDisabled: Challenge = {
  id: "daily-button-disabled-incorrectly",
  title: "Daily: Button Disabled Incorrectly",
  description: `
# Daily Bug: Submit Button Always Disabled

**Severity:** High  
**Component:** \`RegistrationForm.tsx\`

## Context
Users cannot submit the registration form. The submit button remains disabled even after filling out all required fields.

## Instructions
1. Run the **Preview**.
2. Fill out the form completely. Notice the button stays disabled.
3. Fix the bug in \`src/RegistrationForm.tsx\`.
4. Run Tests to verify.
  `,
  difficulty: "Easy",
  order: 3,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "daily-button-disabled-challenge",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "vite build",
              preview: "vite preview",
              test: "vitest run",
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.15",
              "@types/react-dom": "^18.2.7",
              "@vitejs/plugin-react": "^4.0.3",
              vite: "^4.4.5",
              vitest: "^0.34.1",
              jsdom: "^22.1.0",
              "@testing-library/react": "^14.0.0",
            },
          },
          null,
          2
        ),
      },
    },
    "index.html": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daily Button Disabled Bug</title>
    <style>body { background-color: #09090b; color: white; margin: 0; font-family: system-ui; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
    },
    "vite.config.js": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      },
    },
    "vitest.config.js": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
  },
})`,
      },
    },
    "src/main.tsx": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import RegistrationForm from './RegistrationForm.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RegistrationForm />
  </React.StrictMode>,
)`,
      },
    },
    "src/index.css": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `
body { 
  font-family: system-ui; 
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
}
.form-container {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  width: 100%;
  max-width: 400px;
}
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  color: #a1a1aa;
}
input {
  width: 100%;
  padding: 10px;
  border: 1px solid #27272a;
  border-radius: 4px;
  background: #09090b;
  color: white;
  box-sizing: border-box;
}
.btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  margin-top: 1rem;
}
.btn:hover:not(:disabled) { background: #2563eb; }
.btn:disabled {
  background: #3f3f46;
  cursor: not-allowed;
  opacity: 0.5;
}
`,
      },
    },
    "src/RegistrationForm.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

export default function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isFormValid = 
    email.length > 0 || 
    password.length >= 8 || 
    confirmPassword.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      alert('Registration successful!');
    }
  };

  return (
    <div className="form-container">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password (min 8 chars)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          className="btn" 
          disabled={!isFormValid}
          data-testid="submit-btn"
        >
          Register
        </button>
      </form>
    </div>
  );
}`,
      },
    },
    "src/RegistrationForm.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import RegistrationForm from './RegistrationForm';

test('enables submit button when form is valid', () => {
  render(<RegistrationForm />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const confirmInput = screen.getByLabelText(/confirm password/i);
  const submitButton = screen.getByTestId('submit-btn');

  expect(submitButton).toBeDisabled();

  fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.change(confirmInput, { target: { value: 'password123' } });

  expect(submitButton).not.toBeDisabled();
});`,
      },
    },
  },
};
