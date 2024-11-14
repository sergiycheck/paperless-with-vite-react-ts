import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileWithPath, useDropzone } from "react-dropzone";
import React from "react";
import { FileIcon } from "@radix-ui/react-icons";
import { Textarea } from "./components/ui/textarea";
import { z } from "zod";

const baseUrl = "http://localhost:8000/api";
const token = "cGFwZXJsZXNzOnBhcGVybGVzcw==";

const taskSchema = z.object({
  id: z.number(),
  task_id: z.string().uuid(),
  task_file_name: z.string(),
  date_created: z.string(),
  date_done: z.string(),
  type: z.enum(["file"]),
  status: z.enum(["SUCCESS", "FAILURE", "PENDING"]),
  result: z.string(),
  acknowledged: z.boolean(),
  related_document: z.string(),
});

type TaskType = z.infer<typeof taskSchema>;

const documentSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string(),
  tags: z.array(z.number().optional()).default([]).optional(),
  document_type: z.string().nullable().optional(),
  correspondent: z.string().nullable().optional(),
  created: z.string().optional(),
  created_date: z.string().optional(),
  modified: z.string().optional(),
  added: z.string().optional(),
  archive_serial_number: z.string().nullable(),
  original_file_name: z.string().optional(),
  archived_file_name: z.string().nullable().optional(),
  notes: z.array(z.string().optional()).default([]).optional(),
  page_count: z.number().int().nonnegative().nullable(),
  set_permissions: z.boolean().optional(),
  custom_fields: z
    .array(
      z.object({
        field: z.number().int().nonnegative(),
        value: z.any(),
      })
    )
    .default([]),
});

type DocumentType = z.infer<typeof documentSchema>;

export default function Component() {
  const [acceptedBlobFile, setAcceptedBlobFile] = React.useState<Blob | null>(null);
  const [acceptedFile, setAcceptedFile] = React.useState<File | null>(null);

  const onDrop = React.useCallback((acceptedFiles: FileWithPath[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        const binaryStr = reader.result;
        const blobFile = new Blob([new Uint8Array(binaryStr as ArrayBuffer)], { type: file.type });
        setAcceptedBlobFile(blobFile);
        setAcceptedFile(file);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({ onDrop });

  const [taskId, setTaskId] = React.useState<string | null>("");

  const uploadDocument = async () => {
    if (!acceptedBlobFile) return;

    const formData = new FormData();
    formData.append("title", "document 1");
    formData.append("document", acceptedBlobFile);

    try {
      const response = await fetch(baseUrl + "/documents/post_document/", {
        method: "POST",
        headers: {
          Authorization: "Basic " + token,
        },
        body: formData,
      });

      if (response.ok) {
        console.log("File uploaded successfully");
        const responseResult = await response.text();
        const taskId = responseResult.replace(/[%"]/g, "");
        setTaskId(taskId);
      } else {
        console.error("File upload failed", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const [statusLoading, setStatusLoading] = React.useState<
    "idle" | "loading" | "success" | "failure"
  >("idle");
  const [documentId, setDocumentId] = React.useState("");
  const [document, setDocument] = React.useState<DocumentType>();

  React.useEffect(() => {
    if (!taskId) return;

    setStatusLoading("loading");
    const pollInterval = 3000; // 5 seconds
    const controller = new AbortController();

    const fetchTaskStatus = async () => {
      try {
        const response = await fetch(baseUrl + `/tasks/?task_id=${taskId}`, {
          method: "GET",
          headers: {
            Authorization: "Basic " + token,
          },
          signal: controller.signal,
        });

        if (response.ok) {
          const dataResultArr = (await response.json()) as TaskType[];
          const data = dataResultArr[0];

          if (data.status === "SUCCESS") {
            const task = taskSchema.safeParse(data);
            if (task.success) {
              setDocumentId(task.data.related_document);
              setStatusLoading("success");
              clearInterval(intervalId);
            }
          }

          if (data.status === "FAILURE") {
            clearInterval(intervalId);
            setStatusLoading("failure");
          }
        } else {
          throw new Error(`Error: ${response.statusText}`);
        }
      } catch (err) {
        console.error(err);
        clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(fetchTaskStatus, pollInterval);
    fetchTaskStatus();

    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [taskId]);

  React.useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      try {
        const response = await fetch(baseUrl + `/documents/${documentId}/`, {
          method: "GET",
          headers: {
            Authorization: "Basic " + token,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as DocumentType;
          const parsedDocument = documentSchema.safeParse(data);
          if (parsedDocument.success) {
            setDocument(parsedDocument.data);
          } else {
            console.error(parsedDocument.error.errors);
          }
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDocument();
  }, [documentId]);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>
            Drag and drop your images or click the button below to select files.
          </CardDescription>
        </CardHeader>
        <CardContent
          {...getRootProps()}
          className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-10 space-y-6"
        >
          {!acceptedFile ? (
            <>
              <CloudUploadIcon className="w-16 h-16 text-zinc-500 dark:text-zinc-400" />
              <input {...getInputProps()} />
              <Button variant="outline">Upload a file</Button>
            </>
          ) : (
            <div className="flex space-x-2">
              <FileIcon className="w-5 h-5" />
              <p className="text-sm">{acceptedFile.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center p-2 space-x-2 items-center">
        <Button variant="outline" disabled={acceptedFiles.length === 0} onClick={uploadDocument}>
          Extract text
        </Button>

        {statusLoading === "loading" && <p className="text-sm">Extracting text...</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extracted text</CardTitle>
          <CardDescription>Text content from uploaded file</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-0 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          <Textarea rows={10} value={document?.content} />
        </CardContent>
      </Card>
    </div>
  );
}

function CloudUploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}
