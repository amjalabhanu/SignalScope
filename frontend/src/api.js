const API_BASE_URL = "http://localhost:8000";

export async function getEvents() {
  const response = await fetch(`${API_BASE_URL}/events`);

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

export async function getEntities() {
  const response = await fetch(`${API_BASE_URL}/entities`);

  if (!response.ok) {
    throw new Error("Failed to fetch entities");
  }

  return response.json();
}