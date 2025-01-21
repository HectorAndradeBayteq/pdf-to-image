import { PdfDocument, PdfPage } from '../entities/PdfDocument';

export interface IPdfConverter {
    convertToImages(pdf: PdfDocument): Promise<PdfPage[]>;
} 