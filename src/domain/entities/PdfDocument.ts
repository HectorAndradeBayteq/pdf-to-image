export interface PdfDocument {
    content: Buffer;
    pageCount: number;
}

export interface PdfPage {
    pageNumber: number;
    imageContent: string; // base64
} 