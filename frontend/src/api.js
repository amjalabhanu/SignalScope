const API_BASE_URL = "http://localhost:8000";

async function fetchJson(endpoint, resourceName, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      let message = `Unable to load ${resourceName}. Server returned ${response.status}.`;

      try {
        const errorBody = await response.json();
        if (errorBody?.detail) {
          message = errorBody.detail;
        }
      } catch {
        // Keep the default HTTP error message.
      }

      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to connect to the backend while loading ${resourceName}.`,
        { cause: error }
      );
    }

    throw error;
  }
}

function jsonHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Existing public APIs

export function getEvents() {
  return fetchJson("/events", "events");
}

export function getEntities() {
  return fetchJson("/entities", "entities");
}

// Authentication APIs

export function registerUser({ name, email, password }) {
  return fetchJson("/auth/register", "registration", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser({ email, password }) {
  return fetchJson("/auth/login", "login", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token) {
  return fetchJson("/auth/me", "current user", {
    headers: jsonHeaders(token),
  });
}

// Subscription APIs

export function getSubscriptions(token) {
  return fetchJson("/subscriptions", "subscriptions", {
    headers: jsonHeaders(token),
  });
}

export function followEntity(entityId, token) {
  return fetchJson(`/subscriptions/${entityId}`, "subscription", {
    method: "POST",
    headers: jsonHeaders(token),
  });
}

export function unfollowEntity(entityId, token) {
  return fetchJson(`/subscriptions/${entityId}`, "subscription", {
    method: "DELETE",
    headers: jsonHeaders(token),
  });
}