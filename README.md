# Redactor Pro

A privacy-first document redaction tool that automatically detects and redacts Personally Identifiable Information (PII) from PDFs and images. All processing happens locally in your browser - no data ever leaves your device.

## ✨ Features

### 🔍 Automatic PII Detection
Uses OCR (Tesseract.js) and regex pattern matching to identify sensitive information:
- ✅ Email addresses
- ✅ Phone numbers (various formats)
- ✅ Social Security Numbers (SSN)
- ✅ Credit card numbers
- ✅ Dates of birth

### ✏️ Manual Redaction
- Draw custom redaction boxes with click-and-drag
- Perfect for addresses, names, and other sensitive content
- Real-time preview with solid black boxes

### 📄 Document Support
- Multi-page PDF documents (up to 50MB)
- Images: PNG, JPG, JPEG (up to 50MB)
- Page-by-page navigation for PDFs

### 🎨 Intuitive Interface
- **Real-time redaction preview** - See solid black boxes immediately
- **Toggle controls** - Enable/disable individual detections with switches
- **Upload new documents** - Process multiple files without refreshing
- **Export options** - Download as PDF or PNG

### 🔒 Privacy & Security
- **100% local processing** - No server uploads
- **Permanent redactions** - Exported files contain flattened images, not text layers
- **No data storage** - Everything cleared on close
- **Open source** - Full transparency

## Supported File Formats

- **PDF**: Multi-page PDF documents (up to 50MB)
- **Images**: PNG, JPG, JPEG (up to 50MB)

## Technologies Used

- [Vite](https://vitejs.dev/) - Fast build tool and dev server
- [React 18](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [HeroUI](https://heroui.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR text extraction
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/redactor-pro.git
cd redactor-pro
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚀 Usage Guide

### Quick Start

1. **📤 Upload Document**
   - Drag and drop or click to upload a PDF or image
   - Supports files up to 50MB

2. **🔍 Detect PII**
   - Click "Detect PII" button in the toolbar
   - Wait for OCR and detection to complete (first time downloads ~4MB language data)
   - Solid black boxes appear immediately over detected PII

3. **✅ Review & Toggle**
   - View detected items in the right panel
   - Toggle individual redactions on/off with switches
   - Each detection shows type, confidence, and preview text

4. **✏️ Manual Redaction** (Optional)
   - Click "Manual Redact" mode in toolbar
   - Click and drag to draw boxes over any content
   - Perfect for addresses and other content not auto-detected

5. **💾 Export**
   - Choose format: PDF or PNG
   - Click "Export" button (only enabled when redactions exist)
   - Download your permanently redacted document

### ⌨️ Keyboard Shortcuts

- **← →** Navigate between pages (multi-page PDFs)
- **Delete/Backspace** Remove selected redaction
- **Escape** Cancel drawing or clear selection
- **Ctrl/Cmd + Scroll** Zoom in/out
- **Shift + Drag** Pan the canvas

### 🎯 Interaction Modes

- **View** - Navigate and view the document
- **Manual Redact** - Draw custom redaction boxes (cursor becomes crosshair)
- **Review** - Review and manage detected PII items

## 🔐 How Redactions Work

### Secure & Permanent
1. **Solid black boxes** are drawn directly on the canvas
2. The canvas is converted to an **image** (JPEG/PNG)
3. The image is embedded in the exported PDF/PNG
4. **No text layer exists** - original text cannot be recovered
5. Redactions are **permanent and irreversible**

### What You See Is What You Get
- Redactions appear as solid black boxes immediately
- Toggle detections on/off to see changes in real-time
- Export exactly what you see on screen

## ⚠️ Limitations

- **File size**: Maximum 50MB per file
- **OCR accuracy**: Depends on document quality, font clarity, and language
- **Pattern matching**: May have false positives/negatives
- **Performance**: Large PDFs may take longer to process
- **Browser memory**: Very large documents may cause memory issues
- **Language**: Currently optimized for English text only

## 💡 Tips for Best Results

- Use high-quality scans (300 DPI or higher)
- Ensure text is clear and not skewed
- Review auto-detected items before exporting
- Use manual mode for handwritten content or unusual layouts
- Test with a sample page first for large documents

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React UI components
│   ├── CanvasViewer.tsx       # Canvas display with zoom/pan
│   ├── DocumentUpload.tsx     # File upload interface
│   ├── ExportPanel.tsx        # Export controls
│   ├── PIIListPanel.tsx       # Detected PII list
│   ├── RedactionToolbar.tsx   # Main toolbar
│   └── ...
├── services/            # Core business logic
│   ├── DocumentManager.ts     # File validation
│   ├── PDFRenderer.ts         # PDF.js wrapper
│   ├── ImageRenderer.ts       # Image handling
│   ├── OCREngine.ts           # Tesseract.js wrapper
│   ├── OCREngineWorker.ts     # Web Worker for OCR
│   ├── PIIDetectionEngine.ts  # Regex-based PII detection
│   ├── RedactionManager.ts    # Redaction state management
│   ├── CanvasController.ts    # Canvas interactions
│   └── ExportService.ts       # PDF/PNG generation
├── hooks/               # Custom React hooks
│   ├── useDocument.ts         # Document state
│   ├── useRedactions.ts       # Redaction state
│   ├── useProcessing.ts       # Processing status
│   └── useErrors.ts           # Error handling
├── types/               # TypeScript definitions
└── pages/               # Application pages
```

### Architecture Highlights

- **Web Workers**: OCR runs in a separate thread to avoid blocking UI
- **Canvas-based**: All rendering uses HTML5 Canvas for performance
- **Service Layer**: Clean separation between UI and business logic
- **Type Safety**: Full TypeScript coverage
- **Accessibility**: WCAG-compliant with ARIA labels

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Licensed under the [MIT license](LICENSE).

---

**Built with privacy in mind. Your documents never leave your browser.** 🔒
