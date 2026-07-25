import Swal from "sweetalert2";

const humanizeField = (field) =>
  field
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatApiError = (error) => {
  const detail = error?.response?.data?.detail;

  if (!detail) {
    return error?.response?.data?.message || error?.message || "An error occurred";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item?.msg) {
        const loc = Array.isArray(item.loc)
          ? item.loc
              .filter((segment) => segment !== "body")
              .map((segment) => humanizeField(segment))
              .join(" ")
          : "";
        return loc ? `${loc} ${item.msg}` : item.msg;
      }

      if (item?.detail) {
        return item.detail;
      }

      return JSON.stringify(item);
    });

    return messages.join("\n");
  }

  if (typeof detail === "object" && detail !== null) {
    return Object.entries(detail)
      .map(([field, value]) => {
        const message = Array.isArray(value) ? value.join(", ") : String(value);
        return `${humanizeField(field)} ${message}`;
      })
      .join("\n");
  }

  return String(detail);
};

export const showSuccess = (message, title = "Success") => {
  Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonText: "OK",
  });
};

export const showError = (message, title = "Error") => {
  Swal.fire({
    icon: "error",
    title,
    html: message.replace(/\n/g, "<br />"),
    confirmButtonText: "OK",
  });
};
