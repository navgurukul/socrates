import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: The FullScreenModal content div is rendered in the DOM, but it has opacity: 0 because this style is inadvertently part of its base styling object, preventing it from ever becoming visible.
export const modalContentInvisibleBattle: Battle = {
  "id": "modal-content-invisible",
  "trackId": "frontend-debugging",
  "arcId": "browser-and-dom",
  "title": "Full Screen Modal Content Invisible",
  "description": "Severity: Medium\nComponent: FullScreenModal\nContext: The `FullScreenModal` component is used throughout the application to display important information over the entire screen, with a semi-transparent backdrop and central content.\nReproduction:\n1. Ensure the `FullScreenModal` component's `isOpen` prop is set to `true` by its parent.\n2. Observe that the semi-transparent backdrop appears, covering the entire screen.\n3. Notice that the modal's content (e.g., \"Modal Content Here\") is not visible, although the backdrop is present.\nExpected: When the modal is open, both the backdrop and the modal content should be fully visible and readable. The content should be centrally aligned within the modal.",
  "difficulty": "Medium",
  "order": 1,
  "tech": [
    "react",
    "typescript",
    "vitest",
    "@testing-library/react"
  ],
  "files": {
    "package.json": {
      "readOnly": true,
      "file": {
        "contents": "{\n  \"name\": \"battle-challenge\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"preview\": \"vite preview\",\n    \"test\": \"vitest run\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\"\n  },\n  \"devDependencies\": {\n    \"@types/react\": \"^18.2.15\",\n    \"@types/react-dom\": \"^18.2.7\",\n    \"@vitejs/plugin-react\": \"^4.0.3\",\n    \"vite\": \"^4.4.5\",\n    \"vitest\": \"^0.34.1\",\n    \"jsdom\": \"^22.1.0\",\n    \"@testing-library/react\": \"^14.0.0\",\n    \"@testing-library/jest-dom\": \"^6.1.4\"\n  }\n}"
      }
    },
    "index.html": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Full Screen Modal Content Invisible</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
      }
    },
    "vite.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})"
      }
    },
    "vitest.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vitest/config'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  test: {\n    environment: 'jsdom',\n    globals: true,\n    watch: false,\n    setupFiles: ['./vitest.setup.ts'],\n  },\n})"
      }
    },
    "vitest.setup.ts": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import '@testing-library/jest-dom';"
      }
    },
    "src/main.tsx": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport FullScreenModal from './FullScreenModal.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <FullScreenModal />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/FullScreenModal.tsx": {
      "file": {
        "contents": "import React from 'react';interface FullScreenModalProps {  isOpen: boolean;  onClose: () => void;  children: React.ReactNode;}const modalContentStyle: React.CSSProperties = {  position: 'relative',  backgroundColor: 'white',  padding: '20px',  borderRadius: '8px',  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',  zIndex: 1002,  maxWidth: '500px',  width: '90%',  opacity: 0,  transition: 'opacity 0.3s ease-in-out',};const FullScreenModal: React.FC<FullScreenModalProps> = ({ isOpen, onClose, children }) => {  if (!isOpen) return null;  return (    <div      style={{        position: 'fixed',        top: 0,        left: 0,        width: '100vw',        height: '100vh',        display: 'flex',        alignItems: 'center',        justifyContent: 'center',        zIndex: 1000,      }}    >      <div        onClick={onClose}        style={{          position: 'absolute',          top: 0,          left: 0,          width: '100%',          height: '100%',          backgroundColor: 'rgba(0, 0, 0, 0.5)',          zIndex: 1001,        }}        data-testid=\"modal-backdrop\"      />      <div        style={modalContentStyle}        data-testid=\"modal-content\"      >        {children}        <button onClick={onClose} style={{ marginTop: '15px' }}>          Close        </button>      </div>    </div>  );};export default FullScreenModal;"
      }
    },
    "src/FullScreenModal.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import React from 'react';import { render, screen, fireEvent } from '@testing-library/react';import { describe, it, expect, vi } from 'vitest';import FullScreenModal from './FullScreenModal';describe('FullScreenModal', () => {  it('should display the modal content when isOpen is true', () => {    const handleClose = vi.fn();    render(      <FullScreenModal isOpen={true} onClose={handleClose}>        <div>Modal Content Here</div>      </FullScreenModal>    );    const modalContent = screen.getByTestId('modal-content');    expect(modalContent).toBeInTheDocument();    expect(modalContent).toBeVisible();    const backdrop = screen.getByTestId('modal-backdrop');    expect(backdrop).toBeVisible();  });  it('should not render the modal when isOpen is false', () => {    const handleClose = vi.fn();    render(      <FullScreenModal isOpen={false} onClose={handleClose}>        <div>Modal Content Here</div>      </FullScreenModal>    );    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();    expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();  });  it('should call onClose when backdrop or close button is clicked', () => {    const handleClose = vi.fn();    render(      <FullScreenModal isOpen={true} onClose={handleClose}>        <div>Modal Content Here</div>      </FullScreenModal>    );    fireEvent.click(screen.getByTestId('modal-backdrop'));    expect(handleClose).toHaveBeenCalledTimes(1);        handleClose.mockClear();    fireEvent.click(screen.getByText('Close'));    expect(handleClose).toHaveBeenCalledTimes(1);  });});"
      }
    }
  }
};
