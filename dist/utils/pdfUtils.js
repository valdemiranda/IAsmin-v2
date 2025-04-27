"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodePdfToBase64 = encodePdfToBase64;
exports.downloadAndEncodePdf = downloadAndEncodePdf;
exports.createPdfContentPart = createPdfContentPart;
const fs = __importStar(require("fs/promises"));
const node_fetch_1 = __importDefault(require("node-fetch"));
async function encodePdfToBase64(pdfPath) {
    try {
        const data = await fs.readFile(pdfPath);
        const base64Data = data.toString('base64');
        return `data:application/pdf;base64,${base64Data}`;
    }
    catch (error) {
        console.error('Error encoding PDF:', error);
        throw new Error(`Failed to encode PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function downloadAndEncodePdf(url) {
    try {
        const response = await (0, node_fetch_1.default)(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64Data}`;
        return dataUrl;
    }
    catch (error) {
        console.error('Error downloading and encoding PDF:', error);
        throw new Error(`Failed to download and encode PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function createPdfContentPart(pdfPath, filename) {
    const pdfDataUrl = await encodePdfToBase64(pdfPath);
    const actualFilename = filename || pdfPath.split('/').pop() || 'document.pdf';
    return {
        type: 'file',
        file: {
            filename: actualFilename,
            file_data: pdfDataUrl
        }
    };
}
//# sourceMappingURL=pdfUtils.js.map