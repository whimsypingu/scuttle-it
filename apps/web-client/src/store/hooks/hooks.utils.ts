export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T | null> {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}