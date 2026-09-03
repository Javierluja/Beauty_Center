const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbz_Xa916OIVWUyKwhpM4K73vntd0kaxgtuGuOG8fTdkkwg9mHAzLM9yLbhDU1i5z9c_Dg/exec";

export async function syncToGoogleSheets(payload: Record<string, any>) {
  try {
    const enrichedPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      fechaRegistro: new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })
    };

    fetch(GOOGLE_SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedPayload),
    }).catch(err => {
      console.error("[GoogleSheets Backup Warning]: Failed to send background sync", err.message);
    });
  } catch (err: any) {
    console.error("[GoogleSheets Backup Error]:", err.message);
  }
}
