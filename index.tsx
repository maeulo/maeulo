/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { html } from 'htm/preact';

const App = () => {
  const [sortedContent, setSortedContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const findContentValues = (data) => {
    const contents = [];
    const recurse = (item) => {
      if (Array.isArray(item)) {
        item.forEach(recurse);
      } else if (typeof item === 'object' && item !== null) {
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            if (key === 'content' && typeof item[key] === 'string') {
              contents.push(item[key]);
            } else {
              recurse(item[key]);
            }
          }
        }
      }
    };
    recurse(data);
    return contents;
  };

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSortedContent('');

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File could not be read as text.');
        }
        
        const data = JSON.parse(text);
        const contents = findContentValues(data);
        
        if (contents.length === 0) {
          throw new Error("No valid 'content' string fields found in the JSON file.");
        }

        const sorted = contents.sort((a, b) => a.localeCompare(b)).join('\n');
        setSortedContent(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const handleCopy = useCallback(() => {
    if (!sortedContent) return;
    navigator.clipboard.writeText(sortedContent).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setError('Could not copy text to clipboard.');
    });
  }, [sortedContent]);

  const handleDownload = useCallback(() => {
    if (!sortedContent) return;
    const blob = new Blob([sortedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sorted_content.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sortedContent]);

  return html`
    <div class="container">
      <header>
        <h1>JSON Content Sorter</h1>
        <p>Upload a JSON file to extract, sort, and display its 'content' values.</p>
      </header>
      <main>
        <label for="file-upload" class="file-upload-label">
          ${isLoading ? 'Processing...' : 'Select JSON File'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".json,application/json"
          onChange=${handleFileChange}
          disabled=${isLoading}
          aria-busy=${isLoading}
        />
        ${error && html`<div class="error-message" role="alert">${error}</div>`}
        ${sortedContent && html`
          <div class="content-container">
            <div class="content-header">
              <h2>Sorted Content</h2>
              <div class="content-actions">
                <button onClick=${handleCopy} class="action-button" title="Copy content to clipboard">
                  ${copyButtonText}
                </button>
                <button onClick=${handleDownload} class="action-button" title="Download content as a .txt file">
                  Download .txt
                </button>
              </div>
            </div>
            <pre class="content-display">${sortedContent}</pre>
          </div>
        `}
      </main>
      <footer>
        <p>A simple tool for developers.</p>
      </footer>
    </div>
  `;
};

render(html`<${App} />`, document.getElementById('root'));