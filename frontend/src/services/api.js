const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

async function request(endpoint, method = "GET", body = null, requireAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const token = localStorage.getItem("scrubpoint_admin_token");

    if (token) {

     const cleanToken = token.replace(/['"\s[\]]/g, "");
      headers["Authorization"] = `Bearer ${cleanToken}`;
    }
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    let result;

    try {
      result = await response.json();
    } catch {
      result = {
        success: false,
        message: "The server returned an invalid response.",
      };
    }

    if (!response.ok) {
      if (response.status === 401 && requireAuth) {
        localStorage.removeItem("scrubpoint_admin_token");
        localStorage.removeItem("scrubpoint_admin_email");
        localStorage.removeItem("scrubpoint_admin_role");

        window.location.href = "/admin";
      }

      throw new Error(
        result.message ||
          "An infrastructure communication exception occurred."
      );
    }

    return result;
  } catch (error) {
    console.error(
      `API Error on ${method} ${endpoint}:`,
      error.message
    );

    throw error;
  }
}

export const ApiService = {
  products: {
    getAll: (
      page = 1,
      limit = 20,
      category = "",
      search = "",
      sort = "newest"
    ) => {
      let query = `?page=${page}&limit=${limit}&sort=${sort}`;

      if (category) {
        query += `&category=${encodeURIComponent(category)}`;
      }

      if (search) {
        query += `&search=${encodeURIComponent(search)}`;
      }

      return request(`/products${query}`, "GET");
    },

    getById: (productId) => {
      return request(`/products/${productId}`, "GET");
    },

    create: (productPayload) => {
      return request("/products", "POST", productPayload, true);
    },

    update: (productId, productPayload) => {
      return request(
        `/products/${productId}`,
        "PUT",
        productPayload,
        true
      );
    },

    softDelete: (productId) => {
      return request(
        `/products/${productId}`,
        "DELETE",
        null,
        true
      );
    },

    restore: (productId) => {
      return request(
        `/products/${productId}/restore`,
        "PATCH",
        null,
        true
      );
    },
  },

  categories: {
    getAll: () => {
      return request("/categories", "GET");
    },
  },

  reviews: {
    getApproved: () => {
      return request("/reviews", "GET");
    },

    create: (reviewPayload) => {
      return request("/reviews", "POST", reviewPayload);
    },

    remove: (reviewId) => {
      return request(
        `/reviews?id=${reviewId}`,
        "DELETE",
        null,
        true
      );
    },
  },

  orders: {
    logWhatsAppClick: (orderPayload) => {
      return request("/orders", "POST", orderPayload);
    },

    getQueueList: () => {
      return request("/orders", "GET", null, true);
    },
  },


  packages: {
    getAll: () => {
      return request("/packages", "GET");
    },

    getById: (packageId) => {
      return request(`/packages/${packageId}`, "GET");
    },

    create: (packagePayload) => {
      return request(
        "/packages",
        "POST",
        packagePayload,
        true
      );
    },

    update: (packageId, packagePayload) => {
      return request(
        `/packages/${packageId}`,
        "PUT",
        packagePayload,
        true
      );
    },

    remove: (packageId) => {
      return request(
        `/packages/${packageId}`,
        "DELETE",
        null,
        true
      );
    },
  },

  auth: {
    login: (credentialsPayload) => {
      return request(
        "/admin/login",
        "POST",
        credentialsPayload
      );
    },

    createStaffAccount: (staffPayload) => {
      return request(
        "/admin/staff",
        "POST",
        staffPayload,
        true
      );
    },

    updateProfile: (profilePayload) => {
      return request(
        "/admin/profile",
        "PUT",
        profilePayload,
        true
      );
    },
  },
};