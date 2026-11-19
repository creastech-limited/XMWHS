import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyDidInvoicePayment } from "../../services/api/userService";
import { PENDING_PAYMENT_KEY } from "../../hooks/usePayInvoice";

type Pending = { invoiceId: string; reference: string; returnTo: string };

const InvoicePaymentCallback = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const ran = useRef(false);

  const verify = async (p: Pending) => {
    setState("verifying");
    try {
      const res = await verifyDidInvoicePayment(p.invoiceId, p.reference);
      if (res.status && res.transaction?.status === "success") {
        sessionStorage.removeItem(PENDING_PAYMENT_KEY);
        setState("success");
        setMessage(res.message);
      } else {
        setState("failed");
        setMessage(res.message || "Payment was not completed.");
      }
    } catch (err: any) {
      setState("failed");
      setMessage(err?.response?.data?.message || "Could not verify payment.");
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) {
      setState("failed");
      setMessage("No pending payment found.");
      return;
    }
    const p: Pending = JSON.parse(raw);
    setPending(p);
    verify(p);
  }, []);

  const back = () => navigate(pending?.returnTo ?? "/", { replace: true });

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center">
        {state === "verifying" && (
          <p className="text-slate-500">Confirming your payment…</p>
        )}
        {state === "success" && (
          <>
            <h2 className="mb-2 text-xl font-bold text-emerald-700">Payment successful</h2>
            <p className="mb-6 text-sm text-slate-500">{message}</p>
          </>
        )}
        {state === "failed" && (
          <>
            <h2 className="mb-2 text-xl font-bold text-red-600">Payment not confirmed</h2>
            <p className="mb-6 text-sm text-slate-500">{message}</p>
          </>
        )}
        {state !== "verifying" && (
          <div className="flex justify-center gap-2">
            {state === "failed" && pending && (
              <button
                type="button"
                onClick={() => verify(pending)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0f1535] hover:bg-slate-100"
              >
                Check again
              </button>
            )}
            <button
              type="button"
              onClick={back}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Back to invoices
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePaymentCallback;