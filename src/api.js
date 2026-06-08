import axios from "axios";

const ACCESS_KEY = "access";   // unified key
const REFRESH_KEY = "refresh";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      // очистить токены, но НЕ делать window.location.href
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = "Bearer " + token;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post("http://127.0.0.1:8000/api/refresh/", {
        refresh: refreshToken,
      });

      const newAccess = refreshResponse.data.access;
      if (!newAccess) throw new Error("No access in refresh response");

      localStorage.setItem(ACCESS_KEY, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      processQueue(null, newAccess);
      isRefreshing = false;

      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      isRefreshing = false;
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      return Promise.reject(err);
    }
  }
);

export const saveTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export default api;
