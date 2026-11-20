import { useState } from "react";
import type { StartPaymentResponse } from "../types/agent";

export const PENDING_PAYMENT_KEY = "pendingInvoicePayment";

type StartFn = (
  id: string,
  body: { provider: "nomba"; callBackUrl: string }
) => Promise<StartPaymentResponse>;

export const usePayInvoice = (startPayment: StartFn, callbackPath: string) => {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const pay = async (invoiceId: string) => {
    if (payingId) return;
    try {
      setPayingId(invoiceId);
      setPayError(null);
      const res = await startPayment(invoiceId, {
        provider: "nomba",
        callBackUrl: `${window.location.origin}${callbackPath}`,
      });
      sessionStorage.setItem(
        PENDING_PAYMENT_KEY,
        JSON.stringify({
          invoiceId,
          reference: res.data.reference,
          returnTo: window.location.pathname,
        })
      );
      window.location.assign(res.data.checkoutLink);
    } catch (err: any) {
      setPayError(err?.response?.data?.message || "Could not start payment");
      setPayingId(null);
    }
  };

  return { pay, payingId, payError };
};