export type HealthResponse = {
  status: 'ok'
  database: 'ok'
  service: string
  version: string
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`)
  }

  return (await response.json()) as HealthResponse
}
