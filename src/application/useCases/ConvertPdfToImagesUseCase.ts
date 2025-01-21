import { IPdfConverter } from '../../domain/interfaces/IPdfConverter';
import { PdfDocument, PdfPage } from '../../domain/entities/PdfDocument';
import { PDFDocument } from 'pdf-lib';

export class ConvertPdfToImagesUseCase {
    constructor(private pdfConverter: IPdfConverter) {}

    async execute(pdfBase64: string): Promise<PdfPage[]> {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        if (pageCount === 0) {
            throw new Error('PDF has no pages');
        }

        const pdf: PdfDocument = {
            content: pdfBuffer,
            pageCount
        };

        return await this.pdfConverter.convertToImages(pdf);
    }
} 