/**
 * HTTP client for calling the Python AI microservice.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export interface ProcessRequest {
  schematicId: string;
  fileUrl: string;
  callbackUrl?: string;
}

export interface JobStatus {
  job_id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  message?: string;
  result?: {
    pages_processed: number;
    components_detected: number;
    text_blocks_extracted: number;
    connections_found: number;
  };
}

export async function triggerProcessing(
  request: ProcessRequest
): Promise<JobStatus> {
  const res = await fetch(`${AI_SERVICE_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schematic_id: request.schematicId,
      file_url: request.fileUrl,
      callback_url: request.callbackUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI service error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${AI_SERVICE_URL}/status/${jobId}`);

  if (!res.ok) {
    throw new Error(`AI service error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
