export type PaymentProvider = "kaspi-manual" | "robokassa" | "cloudpayments";

export type SubscriptionInvoiceInput = {
  tenantId: string;
  amountKzt: number;
  provider: PaymentProvider;
};

export async function createSubscriptionInvoice(
  input: SubscriptionInvoiceInput,
) {
  if (input.provider === "kaspi-manual") {
    return {
      provider: input.provider,
      status: "manual",
    };
  }

  throw new Error("Online acquiring is not connected yet.");
}
