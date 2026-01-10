import { Battle } from "../types";

export const lighthousePerformanceBattle: Battle = {
  id: "lighthouse-performance",
  trackId: "frontend-debugging",
  arcId: "debugging-foundations",
  title: "Slow Page Load Mystery",
  description: `
# Bug Report: Homepage Takes 5+ Seconds to Load

**Severity:** Medium  
**Component:** \`ImageGallery.tsx\`

## Context
Users complain the homepage is slow. Marketing says it's hurting conversions.

## Instructions
1. Run the **Preview** and notice the slow image loading
2. **Right-click** → **Inspect** → Open **Lighthouse tab**
3. Click "Analyze page load" to run a Performance audit
4. Check the "Properly size images" warning (huge unoptimized images)
5. Open **Network tab** and reload the preview (Cmd/Ctrl+R)
6. Observe massive image file sizes and slow load times
7. Fix the image loading strategy in \`src/ImageGallery.tsx\`
8. Re-run Lighthouse to verify improved performance score
  `,
  difficulty: "Easy",
  order: 5,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "lighthouse-performance",
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
    <title>Photo Gallery</title>
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
import ImageGallery from './ImageGallery.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ImageGallery />
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
  padding: 2rem;
  margin: 0;
}
.gallery {
  max-width: 1200px;
  margin: 0 auto;
}
.gallery h1 {
  margin: 0 0 2rem 0;
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
.gallery-img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #27272a;
  object-fit: cover;
  aspect-ratio: 4/3;
}
`,
      },
    },
    "src/ImageGallery.tsx": {
      file: {
        contents: `import React from 'react';

// BUG: Using massive 4000x3000 images without optimization
const IMAGES = [
  'https://picsum.photos/4000/3000?random=1',
  'https://picsum.photos/4000/3000?random=2',
  'https://picsum.photos/4000/3000?random=3',
  'https://picsum.photos/4000/3000?random=4',
  'https://picsum.photos/4000/3000?random=5',
  'https://picsum.photos/4000/3000?random=6',
];

export default function ImageGallery() {
  return (
    <div className="gallery">
      <h1>Photo Gallery</h1>
      <div className="grid">
        {IMAGES.map((src, idx) => (
          <img 
            key={idx} 
            src={src} 
            alt={\`Gallery image \${idx + 1}\`}
            className="gallery-img"
            // Missing: width, height, loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}`,
      },
    },
    "src/ImageGallery.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import ImageGallery from './ImageGallery';

test('renders all gallery images', () => {
  render(<ImageGallery />);
  
  const images = screen.getAllByRole('img');
  expect(images.length).toBe(6);
});

test('all images have lazy loading attribute', () => {
  render(<ImageGallery />);
  
  const images = screen.getAllByRole('img');
  images.forEach(img => {
    expect(img.getAttribute('loading')).toBe('lazy');
  });
});

test('all images have explicit width and height', () => {
  render(<ImageGallery />);
  
  const images = screen.getAllByRole('img');
  images.forEach(img => {
    expect(img.getAttribute('width')).toBeTruthy();
    expect(img.getAttribute('height')).toBeTruthy();
  });
});

test('images use optimized dimensions', () => {
  render(<ImageGallery />);
  
  const images = screen.getAllByRole('img');
  images.forEach(img => {
    const src = img.getAttribute('src') || '';
    // Should use smaller dimensions (800x600 or similar)
    expect(src).not.toContain('4000');
    expect(src).not.toContain('3000');
  });
});`,
      },
    },
  },
};
