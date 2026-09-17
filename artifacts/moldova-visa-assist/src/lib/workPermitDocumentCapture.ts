function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read uploaded document"));
    reader.readAsDataURL(file);
  });
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")).toUpperCase();

  if (method === "POST" && url.includes("/api/work-permits") && init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body);
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
      const files = inputs.map((input) => input.files?.[0] || null);
      const names = ["passportCopyData", "photoData", "medicalCertData", "criminalRecordData"] as const;
      const captured = await Promise.all(files.map((file) => file ? fileToDataUrl(file) : Promise.resolve(null)));
      let totalBytes = 0;
      for (const value of captured) {
        if (value) totalBytes += Math.floor(value.length * 3 / 4);
      }
      if (totalBytes > 8 * 1024 * 1024) {
        throw new Error("Please keep the total uploaded documents under 8 MB.");
      }
      names.forEach((name, index) => { if (captured[index]) body[name] = captured[index]; });
      return originalFetch(input, { ...init, body: JSON.stringify(body) });
    } catch (error) {
      throw error;
    }
  }
  return originalFetch(input, init);
};
