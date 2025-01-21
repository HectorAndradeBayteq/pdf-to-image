import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ConvertPdfToImagesUseCase } from "../application/useCases/ConvertPdfToImagesUseCase";
import { PdfConverter } from "../infrastructure/services/PdfConverter";
import { PdfConversionRequest } from "../domain/dto/PdfConversionRequest";
import { execFileSync } from 'child_process';

export async function ConvertPdfToImages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Verify pdftoppm is installed
        try {
            execFileSync('pdftoppm', ['-v']);
        } catch (error) {
            return {
                status: 500,
                jsonBody: {
                    error: 'Poppler is not properly installed',
                    details: error.message
                }
            };
        }

        const body = await request.json() as PdfConversionRequest;
        if (!body || typeof body !== 'object') {
            return {
                status: 400,
                jsonBody: {
                    error: 'Request body must be a valid JSON object'
                }
            };
        }

        const { pdfBase64 } = body;

        if (!pdfBase64) {
            return {
                status: 400,
                jsonBody: {
                    error: 'PDF in base64 format is required'
                }
            };
        }

        const pdfConverter = new PdfConverter();
        const useCase = new ConvertPdfToImagesUseCase(pdfConverter);
        
        const images = await useCase.execute(pdfBase64);

        return {
            status: 200,
            jsonBody: {
                images: images.map(page => ({
                    pageNumber: page.pageNumber,
                    imageContent: page.imageContent
                }))
            }
        };
    } catch (error) {
        context.error('Error in PDF conversion:', error);
        return {
            status: 500,
            jsonBody: {
                error: 'Error in conversion process',
                details: error.message
            }
        };
    }
}

app.http('ConvertPdfToImages', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: ConvertPdfToImages
});
