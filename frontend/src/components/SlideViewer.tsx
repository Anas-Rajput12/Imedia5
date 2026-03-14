"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SlideViewer({ file }: { file: string }) {

  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="flex flex-col items-center">

      <Document
        file={file}
        onLoadSuccess={(data) => setNumPages(data.numPages)}
      >
        <Page pageNumber={page} width={500} />
      </Document>

      <div className="flex gap-3 mt-4">

        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Prev
        </button>

        <span>
          {page} / {numPages}
        </span>

        <button
          onClick={() => setPage(p => Math.min(p + 1, numPages))}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Next
        </button>

      </div>

    </div>
  );
}