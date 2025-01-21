import { IPdfConverter } from '../../domain/interfaces/IPdfConverter';
import { PdfDocument, PdfPage } from '../../domain/entities/PdfDocument';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';

export class PdfConverter implements IPdfConverter {
    private readonly dpi: number = 300;
    private readonly imageWidth: number = 2480;

    async convertToImages(pdf: PdfDocument): Promise<PdfPage[]> {
        const tempDir = path.join(os.tmpdir(), `pdf-${Date.now()}`);
        
        try {
            fs.mkdirSync(tempDir, { recursive: true });
            const tempPdfPath = path.join(tempDir, 'temp.pdf');
            const outputPrefix = path.join(tempDir, 'page');

            fs.writeFileSync(tempPdfPath, pdf.content);

            await this.executePdfToPpmCommand(tempPdfPath, outputPrefix);

            return await this.collectGeneratedImages(tempDir, pdf.pageCount);
        } finally {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        }
    }

    private async executePdfToPpmCommand(pdfPath: string, outputPrefix: string): Promise<void> {
        try {
            execFileSync('pdftoppm', [
                '-png',
                '-r', this.dpi.toString(),
                '-scale-to', this.imageWidth.toString(),
                pdfPath,
                outputPrefix
            ]);
        } catch (error) {
            throw new Error(`PDF conversion failed: ${error.message}`);
        }
    }

    private async collectGeneratedImages(tempDir: string, pageCount: number): Promise<PdfPage[]> {
        const images: PdfPage[] = [];
        
        for (let i = 1; i <= pageCount; i++) {
            const pngPath = path.join(tempDir, `page-${i}.png`);
            if (fs.existsSync(pngPath)) {
                const imageBuffer = fs.readFileSync(pngPath);
                images.push({
                    pageNumber: i,
                    imageContent: imageBuffer.toString('base64')
                });
            }
        }

        if (images.length === 0) {
            throw new Error('No images were generated from the PDF');
        }

        return images;
    }
} 