const API_BASE_URL = "http://localhost:8000";

async function fetchJson(endpoint, resourceName) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(
        `Unable to load ${resourceName}. Server returned ${response.status}.`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to connect to the backend while loading ${resourceName}.`,
        {cause: error}
      );
    }

    throw error;
  }
}

export function getEvents() {
  return fetchJson("/events", "events");
}

export function getEntities() {
  return fetchJson("/entities", "entities");
}