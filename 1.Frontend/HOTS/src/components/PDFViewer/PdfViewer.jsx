import { PdfViewer as SharedPdfViewer } from '@hots/ui-kit/media';
import { Button } from '@hots/ui-kit';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

export default function PdfViewer({ file }) {
  return <div className="space-y-2 w-full">
    <SharedPdfViewer file={file} />
    {typeof file === 'string' && <Button asChild variant="outline" size="sm"><a href={file} download={file.split('/').pop()}>Download PDF</a></Button>}
  </div>;
}
